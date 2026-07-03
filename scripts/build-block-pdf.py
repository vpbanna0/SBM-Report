"""
build-block-pdf.py
Microsoft Graph API se Excel ko PDF convert karta hai.
Excel ki EXACT rendering - bilkul VBA jaisa output.
"""
import os, sys, re, base64, time, shutil, tempfile, subprocess
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode
import requests

ONEDRIVE_URL = os.environ.get('ONEDRIVE_URL', '')
PUBLIC_DIR   = Path(__file__).parent.parent / 'public'
DATA_DIR     = PUBLIC_DIR / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

TARGET_SHEETS = [
    'Summary', 'ODF Plus', 'CSC 23-24', 'CSC 24-25', 'CSC 25-26',
    'RRC Updated (4)', 'All IHHL Data Combine', 'Tender Report 25-26',
    'Target AIP 26-27', 'AIP 26-27 Financial', 'Soak Pit 26-27',
    'Compost Pit 26-27', 'Individual assest 26-27'
]

HEADERS = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': 'text/html,application/xhtml+xml,*/*;q=0.8'
}

# ═══════════════════════════════════════════════════════
#  STEP 1: Share token se OneDrive item metadata nikalo
# ═══════════════════════════════════════════════════════

def resolve_share_url(url):
    qs = parse_qs(urlparse(url).query)
    redeem = qs.get('redeem', [None])[0]
    if redeem:
        try:
            padded = redeem + '=' * (-len(redeem) % 4)
            return base64.b64decode(padded).decode('utf-8')
        except Exception:
            pass
    return url

def is_valid_zip(data):
    return len(data) > 4 and data[:2] == b'PK'

def get_file_metadata_and_download(url):
    """
    OneDrive share link se:
    1. File metadata (item ID, drive ID) nikalo — Graph API ke liye
    2. Actual xlsx file download karo — PDF naam ke liye
    """
    sharing_url = resolve_share_url(url)
    b64 = base64.b64encode(sharing_url.encode()).decode().rstrip('=').replace('+','-').replace('/','_')
    api_base = f"https://api.onedrive.com/v1.0/shares/u!{b64}"

    session = requests.Session()

    # Metadata fetch
    print("📋 File metadata fetch ho rahi hai...")
    meta = None
    try:
        r = session.get(f"{api_base}/root", timeout=30, headers=HEADERS)
        if r.ok:
            meta = r.json()
            print(f"✅ Metadata mila: {meta.get('name','?')}")
    except Exception as e:
        print(f"⚠️ Metadata fetch failed: {e}")

    # Excel file download (xlsx)
    print("📥 Excel file download ho rahi hai...")
    xlsx_data = None
    try:
        r = session.get(f"{api_base}/root/content", timeout=120, headers=HEADERS, allow_redirects=True)
        if r.ok and is_valid_zip(r.content):
            xlsx_data = r.content
            print(f"✅ Excel downloaded ({len(xlsx_data)//1024} KB)")
        else:
            print(f"⚠️ Direct download failed ({r.status_code}), trying preview scraping...")
            raise Exception("try preview")
    except Exception:
        # Preview scraping fallback
        try:
            from urllib.request import urlopen
            preview_r = session.get(url, headers=HEADERS, allow_redirects=True, timeout=60)
            preview_html = preview_r.text
            match = re.search(
                r'my\.microsoftpersonalcontent\.com[^"\']*download\.aspx\?UniqueId=[^"\']+',
                preview_html, re.IGNORECASE)
            if match:
                signed = match.group(0).replace('\\u0026','&').replace('\\/','/')
                if not signed.startswith('http'):
                    signed = 'https://' + signed
                r2 = session.get(signed, headers=HEADERS, allow_redirects=True, timeout=120)
                if r2.ok and is_valid_zip(r2.content):
                    xlsx_data = r2.content
                    print(f"✅ Excel downloaded via scraping ({len(xlsx_data)//1024} KB)")
        except Exception as e2:
            print(f"⚠️ Scraping failed: {e2}")

    if not xlsx_data:
        raise Exception("Excel file download nahi hui")

    return meta, xlsx_data


# ═══════════════════════════════════════════════════════
#  STEP 2: PDF naam nikalo + sheet names verify karo
# ═══════════════════════════════════════════════════════

def get_pdf_name_and_sheets(xlsx_data):
    from openpyxl import load_workbook
    import io
    wb = load_workbook(io.BytesIO(xlsx_data), read_only=True, data_only=True)
    pdf_name = 'Block_SBM_Report'
    sheet_names = wb.sheetnames
    for sname in sheet_names:
        if 'sheet_index' in sname.lower():
            try:
                val = wb[sname]['I2'].value
                if val:
                    pdf_name = str(val).strip()
                    break
            except Exception:
                pass
    wb.close()
    print(f"📄 PDF naam: {pdf_name}")
    print(f"📊 Total sheets in workbook: {len(sheet_names)}")
    # Matched sheets log karo
    tl = [t.strip().lower() for t in TARGET_SHEETS]
    matched = [n for n in sheet_names if n.strip().lower() in tl]
    print(f"✅ Matched target sheets ({len(matched)}): {matched}")
    return pdf_name, sheet_names


# ═══════════════════════════════════════════════════════
#  STEP 3: LibreOffice se PDF banao — IsVisible toggle
#  (Better approach: print area + page break aware)
# ═══════════════════════════════════════════════════════

SOFFICE_PORT = 2002

def start_soffice(profile_dir):
    profile_uri = Path(profile_dir).resolve().as_uri()
    env = os.environ.copy()
    env['SAL_USE_VCLPLUGIN'] = 'svp'
    env['HOME'] = profile_dir
    log_file = open(os.path.join(profile_dir, 'lo.log'), 'w')
    proc = subprocess.Popen([
        'soffice', '--headless', '--invisible', '--nocrashreport',
        '--nodefault', '--norestore', '--nologo', '--nofirststartwizard',
        f'-env:UserInstallation={profile_uri}',
        f'--accept=socket,host=localhost,port={SOFFICE_PORT};urp;'
    ], env=env, stdout=log_file, stderr=log_file, stdin=subprocess.DEVNULL)
    proc._log_file = log_file
    return proc

def connect_uno(retries=90, proc=None):
    import uno
    ctx_local = uno.getComponentContext()
    resolver = ctx_local.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", ctx_local)
    for i in range(retries):
        if proc and proc.poll() is not None:
            raise Exception(f"soffice crashed (exit {proc.returncode})")
        try:
            ctx = resolver.resolve(
                f"uno:socket,host=localhost,port={SOFFICE_PORT};urp;StarOffice.ComponentContext")
            print(f"✅ LibreOffice connected ({i+1} tries)")
            return ctx
        except Exception as e:
            if i % 15 == 0:
                print(f"⏳ Waiting for LibreOffice... ({i+1}/{retries})")
            time.sleep(1)
    raise Exception("LibreOffice se connect nahi hua")

def prop(name, value):
    from com.sun.star.beans import PropertyValue
    p = PropertyValue(); p.Name = name; p.Value = value
    return p

def make_pdf_with_libreoffice(xlsx_path, pdf_path, all_sheet_names):
    """
    Non-target sheets ko hide karke sirf target sheets ki PDF banao.
    Sheets delete nahi karte — cross-references safe rehti hain.
    """
    profile_dir = tempfile.mkdtemp(prefix='lo_profile_')
    proc = start_soffice(profile_dir)
    try:
        ctx = connect_uno(retries=90, proc=proc)
        smgr = ctx.ServiceManager
        desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

        file_url = Path(xlsx_path).resolve().as_uri()
        doc = desktop.loadComponentFromURL(file_url, "_blank", 0, (
            prop("Hidden", True),
            prop("MacroExecutionMode", 0),
            prop("UpdateDocMode", 1),  # formulas recalculate
        ))

        sheets   = doc.Sheets
        tl       = {t.strip().lower() for t in TARGET_SHEETS}
        all_lo   = list(sheets.ElementNames)

        print(f"📊 LibreOffice ne ye sheets dekhi: {all_lo}")

        hidden_ok = []
        hide_fail = []
        for name in all_lo:
            is_target = name.strip().lower() in tl
            s = sheets.getByName(name)
            if is_target:
                # Target sheet — visible rakho
                try:
                    s.IsVisible = True
                except Exception:
                    pass
            else:
                # Non-target — hide karo
                try:
                    s.IsVisible = False
                    # Verify
                    if not s.IsVisible:
                        hidden_ok.append(name)
                    else:
                        hide_fail.append(name)
                except Exception as ex:
                    hide_fail.append(f"{name}({ex})")

        print(f"🙈 Hidden OK ({len(hidden_ok)}): {hidden_ok}")
        if hide_fail:
            print(f"⚠️ Hide FAILED ({len(hide_fail)}): {hide_fail}")

        # Verify visible sheets
        visible_now = [n for n in all_lo if sheets.getByName(n).IsVisible]
        print(f"👁️ Visible sheets jo PDF mein aayengi ({len(visible_now)}): {visible_now}")

        out_url = Path(pdf_path).resolve().as_uri()
        print("🖨️ PDF export ho raha hai...")
        t0 = time.time()
        doc.storeToURL(out_url, (prop("FilterName", "calc_pdf_Export"),))
        print(f"✅ PDF complete ({time.time()-t0:.1f}s)")
        doc.close(False)

    finally:
        try: proc.terminate(); proc.wait(timeout=8)
        except Exception:
            try: proc.kill(); proc.wait(timeout=5)
            except Exception: pass
        try:
            if hasattr(proc, '_log_file'): proc._log_file.close()
        except Exception: pass
        try:
            subprocess.run(['pkill','-9','-f','soffice'], timeout=5,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception: pass
        shutil.rmtree(profile_dir, ignore_errors=True)
        print("✅ Cleanup complete")


# ═══════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════

def main():
    if not ONEDRIVE_URL:
        print("❌ ONEDRIVE_URL not set"); sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        meta, xlsx_data = get_file_metadata_and_download(ONEDRIVE_URL)
        xlsx_path = tmp / 'workbook.xlsx'
        xlsx_path.write_bytes(xlsx_data)

        pdf_name, all_sheet_names = get_pdf_name_and_sheets(xlsx_data)

        pdf_out = tmp / 'output.pdf'
        make_pdf_with_libreoffice(xlsx_path, pdf_out, all_sheet_names)

        final_pdf = DATA_DIR / f"{pdf_name}.pdf"
        shutil.copy(str(pdf_out), str(final_pdf))
        shutil.copy(str(pdf_out), str(DATA_DIR / 'block-report.pdf'))
        (DATA_DIR / 'block-pdf-name.txt').write_text(pdf_name)
        print(f"🎉 Done! PDF saved: {final_pdf.name}")

if __name__ == '__main__':
    main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)
