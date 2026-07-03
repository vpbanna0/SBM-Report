"""
build-block-pdf.py
LibreOffice UNO automation se directly Excel sheets select karke
PDF export karta hai — bilkul VBA macro jaisa (file ko touch/resave
nahi karta, isliye formatting 100% Excel jaisi rehti hai)
"""
import os, sys, subprocess, tempfile, shutil, base64, re, time
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import requests
from openpyxl import load_workbook

ONEDRIVE_URL = os.environ.get('ONEDRIVE_URL', '')
PUBLIC_DIR   = Path(__file__).parent.parent / 'public'
DATA_DIR     = PUBLIC_DIR / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

# VBA macro waali sheets — exact same order/names
TARGET_SHEETS = [
    'Summary', 'ODF Plus', 'CSC 23-24', 'CSC 24-25', 'CSC 25-26',
    'RRC Updated (4)', 'All IHHL Data Combine', 'Tender Report 25-26',
    'Target AIP 26-27', 'AIP 26-27 Financial', 'Soak Pit 26-27',
    'Compost Pit 26-27', 'Individual assest 26-27'
]

HEADERS = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

SOFFICE_PORT = 2002


# ══════════════════════════════════════════════
#  ROBUST ONEDRIVE DOWNLOAD (multi-method)
# ══════════════════════════════════════════════

def is_allowed_onedrive_url(url):
    host = urlparse(url).hostname or ''
    return host in ('1drv.ms', 'onedrive.live.com') or host.endswith('sharepoint.com')

def resolve_onedrive_share_url(source):
    if not is_allowed_onedrive_url(source):
        raise Exception('Only OneDrive share links are allowed.')
    qs = parse_qs(urlparse(source).query)
    redeem = qs.get('redeem', [None])[0]
    if redeem:
        try:
            padded = redeem + '=' * (-len(redeem) % 4)
            return base64.b64decode(padded).decode('utf-8')
        except Exception:
            pass
    return source

def fetch_preview_html(source, session):
    current_url = source
    for _ in range(8):
        r = session.get(current_url, headers=HEADERS, allow_redirects=False, timeout=30)
        location = r.headers.get('location')
        if not location or r.status_code < 300 or r.status_code >= 400:
            if not r.ok:
                raise Exception(f'Preview request failed with HTTP {r.status_code}')
            return r.text
        current_url = location if location.startswith('http') else requests.compat.urljoin(current_url, location)
    raise Exception('OneDrive preview redirect chain exceeded safe limit.')

def extract_signed_download_url(preview_html):
    match = re.search(r'my\.microsoftpersonalcontent\.com[^"\']*download\.aspx\?UniqueId=[^"\']+', preview_html, re.IGNORECASE)
    if not match:
        raise Exception('Signed OneDrive download URL not found in preview HTML.')
    normalized = match.group(0).replace('\\u0026', '&').replace('\\/', '/')
    return normalized if normalized.startswith('http') else f'https://{normalized}'

def is_valid_zip(data):
    return len(data) > 4 and data[:2] == b'PK'

def download_excel(url):
    print("📥 Downloading Excel from OneDrive...")
    sharing_url = resolve_onedrive_share_url(url)
    session = requests.Session()

    try:
        b64 = base64.b64encode(sharing_url.encode()).decode().rstrip('=').replace('+', '-').replace('/', '_')
        api_url = f"https://api.onedrive.com/v1.0/shares/u!{b64}/root/content"
        r = session.get(api_url, headers=HEADERS, allow_redirects=True, timeout=60)
        if r.ok and is_valid_zip(r.content):
            print("✅ Downloaded via OneDrive API")
            return r.content
        print(f"⚠️ API method gave invalid file (status {r.status_code}, size {len(r.content)})")
    except Exception as e:
        print(f"⚠️ OneDrive API failed: {e}")

    try:
        preview_html = fetch_preview_html(url, session)
        signed_url = extract_signed_download_url(preview_html)
        r = session.get(signed_url, headers=HEADERS, allow_redirects=True, timeout=60)
        if r.ok and is_valid_zip(r.content):
            print("✅ Downloaded via preview scraping")
            return r.content
        print(f"⚠️ Preview method gave invalid file (status {r.status_code}, size {len(r.content)})")
    except Exception as e:
        print(f"⚠️ Preview download failed: {e}")

    try:
        r = session.get(sharing_url, headers=HEADERS, allow_redirects=True, timeout=60)
        final_url = r.url
        if 'onedrive.live.com' in final_url:
            final_url = final_url.replace('redir?', 'download?')
            if '/download' not in final_url:
                sep = '&' if '?' in final_url else '?'
                final_url += f'{sep}download=1'
        r2 = session.get(final_url, headers=HEADERS, allow_redirects=True, timeout=60)
        if r2.ok and 'login.live.com' not in r2.url and is_valid_zip(r2.content):
            print("✅ Downloaded via redirect method")
            return r2.content
        print(f"⚠️ Redirect method gave invalid file (status {r2.status_code}, size {len(r2.content)})")
    except Exception as e:
        print(f"⚠️ Generic download failed: {e}")

    raise Exception("OneDrive se valid Excel file download nahi ho saki. Share link check karein.")


def get_pdf_name(xlsx_path):
    """Sirf naam padhne ke liye read-only open - original file ko touch nahi karta"""
    wb = load_workbook(xlsx_path, read_only=True, data_only=True)
    try:
        for sname in wb.sheetnames:
            if 'sheet_index' in sname.lower() or 'sheetindex' in sname.lower():
                try:
                    val = wb[sname]['I2'].value
                    if val:
                        return str(val).strip()
                except Exception:
                    pass
        return 'Block_SBM_Report'
    finally:
        wb.close()


# ══════════════════════════════════════════════
#  LIBREOFFICE UNO AUTOMATION
#  (VBA jaisa selection-based export — file resave nahi hota)
# ══════════════════════════════════════════════

def start_soffice(profile_dir):
    profile_uri = Path(profile_dir).resolve().as_uri()
    env = os.environ.copy()
    env['SAL_USE_VCLPLUGIN'] = 'svp'   # X11/display ki zaroorat nahi - pure headless rendering
    env['HOME'] = profile_dir           # kuch font/config cache yahi dhundta hai

    # IMPORTANT: soffice ka output parent ke stdout/stderr se ALAG file mein redirect karo.
    # Agar inherit kiya to soffice ka background process GitHub Actions ke stdout pipe ko
    # pakda rakhega aur step kabhi terminate nahi hoga, chahe humara python script khatam ho jaye.
    log_path = os.path.join(profile_dir, 'soffice_output.log')
    log_file = open(log_path, 'w')

    proc = subprocess.Popen([
        'soffice', '--headless', '--invisible', '--nocrashreport',
        '--nodefault', '--norestore', '--nologo', '--nofirststartwizard',
        f'-env:UserInstallation={profile_uri}',
        f'--accept=socket,host=localhost,port={SOFFICE_PORT};urp;'
    ], env=env, stdout=log_file, stderr=log_file, stdin=subprocess.DEVNULL)
    proc._log_file = log_file  # cleanup ke liye reference rakho
    return proc

def connect_uno(retries=90, soffice_proc=None):
    import uno
    local_ctx = uno.getComponentContext()
    resolver = local_ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local_ctx)
    last_err = None
    for i in range(retries):
        if soffice_proc is not None and soffice_proc.poll() is not None:
            raise Exception(f"soffice process crash ho gayi (exit code {soffice_proc.returncode}) connect karne se pehle")
        try:
            ctx = resolver.resolve(
                f"uno:socket,host=localhost,port={SOFFICE_PORT};urp;StarOffice.ComponentContext")
            print(f"✅ LibreOffice se connect ho gaya ({i+1} tries ke baad)")
            return ctx
        except Exception as e:
            last_err = e
            if i % 10 == 0:
                print(f"⏳ LibreOffice start hone ka wait... ({i+1}/{retries})")
            time.sleep(1)
    raise Exception(f"LibreOffice se connect nahi hua: {last_err}")

def make_prop(name, value):
    from com.sun.star.beans import PropertyValue
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p

def export_selected_sheets_pdf(xlsx_path, pdf_path, target_sheets):
    profile_dir = tempfile.mkdtemp(prefix='lo_profile_')
    proc = start_soffice(profile_dir)
    try:
        ctx = connect_uno(soffice_proc=proc)
        smgr = ctx.ServiceManager
        desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

        url = "file://" + os.path.abspath(str(xlsx_path))
        load_props = (
            make_prop("Hidden", True),
            make_prop("MacroExecutionMode", 0),  # VBA macro run na ho
        )
        # NOTE: ReadOnly=False rakho — visibility toggle ke liye write access chahiye
        # (Lekin disk pe save nahi karenge — storeToURL ek alag PDF file banata hai)
        doc = desktop.loadComponentFromURL(url, "_blank", 0, load_props)

        sheets = doc.Sheets
        all_names = list(sheets.ElementNames)
        target_lower = [t.strip().lower() for t in target_sheets]

        ordered_matched = [n for n in all_names if n.strip().lower() in target_lower]
        print(f"📋 Matched sheets ({len(ordered_matched)}): {ordered_matched}")

        if not ordered_matched:
            print("⚠️ Koi target sheet nahi mili — saari sheets export ho rahi hain")
            ordered_matched = all_names

        # ── CORE LOGIC ──────────────────────────────────────────────────────
        # Sheets delete nahi karte (reference errors aate hain).
        # Sirf unwanted sheets ko INVISIBLE kar dete hain — sab formulas/references
        # memory mein intact rehti hain, sirf PDF mein nahi aate.
        # LibreOffice PDF export automatically sirf VISIBLE sheets export karta hai.
        # ────────────────────────────────────────────────────────────────────
        hidden_by_us = []
        at_least_one_visible = False

        for name in all_names:
            sheet = sheets.getByName(name)
            is_target = name.strip().lower() in target_lower
            if is_target:
                # Target sheet — visible rakho (agar pehle se hidden thi to bhi show karo)
                try:
                    if not sheet.IsVisible:
                        sheet.IsVisible = True
                except Exception:
                    pass
                at_least_one_visible = True
            else:
                # Non-target sheet — hide karo, original state yaad rakho
                try:
                    was_visible = sheet.IsVisible
                    if was_visible:
                        sheet.IsVisible = False
                        hidden_by_us.append(name)
                except Exception:
                    pass  # kuch sheets already very-hidden hoti hain — skip karo

        print(f"👁️ Hidden sheets: {len(hidden_by_us)}, Visible (export hongi): {len(ordered_matched)}")

        # PDF export — sirf visible sheets aayengi, koi extra filter nahi chahiye
        export_props = (make_prop("FilterName", "calc_pdf_Export"),)

        out_url = "file://" + os.path.abspath(str(pdf_path))
        print("🖨️ PDF export shuru ho raha hai...")
        t0 = time.time()
        doc.storeToURL(out_url, export_props)
        print(f"✅ PDF export complete ({time.time() - t0:.1f} seconds)")

        doc.close(False)
        print(f"✅ PDF exported: {pdf_path}")

    finally:
        print("🧹 LibreOffice process cleanup ho raha hai...")
        try:
            proc.terminate()
            proc.wait(timeout=8)
        except Exception:
            try:
                proc.kill()
                proc.wait(timeout=5)
            except Exception:
                pass
        try:
            if hasattr(proc, '_log_file'):
                proc._log_file.close()
        except Exception:
            pass
        # Safety net: kabhi-kabhi soffice.bin alag se background mein chalta reh jaata hai
        # aur stdout pipe pakda rakhta hai - isliye forcefully sab kill karo
        try:
            subprocess.run(['pkill', '-9', '-f', 'soffice'], timeout=5,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        shutil.rmtree(profile_dir, ignore_errors=True)
        print("✅ Cleanup complete")


# ══════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════

def main():
    if not ONEDRIVE_URL:
        print("❌ ONEDRIVE_URL not set")
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        xlsx_path = tmp / 'workbook.xlsx'

        data = download_excel(ONEDRIVE_URL)
        xlsx_path.write_bytes(data)
        print(f"📦 File size: {len(data) // 1024} KB")

        pdf_name = get_pdf_name(xlsx_path)
        print(f"📄 PDF naam: {pdf_name}")

        pdf_out = tmp / 'output.pdf'
        export_selected_sheets_pdf(xlsx_path, pdf_out, TARGET_SHEETS)

        final_pdf = DATA_DIR / f"{pdf_name}.pdf"
        shutil.copy(str(pdf_out), str(final_pdf))
        shutil.copy(str(pdf_out), str(DATA_DIR / 'block-report.pdf'))
        (DATA_DIR / 'block-pdf-name.txt').write_text(pdf_name)
        print(f"🎉 Done! PDF: {final_pdf.name}")


if __name__ == '__main__':
    main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)   # forceful clean exit - koi background thread/fd process ko rokein nahi
