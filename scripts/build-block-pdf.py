"""
build-block-pdf.py
Excel file ko download karke LibreOffice se PDF banata hai
Bilkul VBA ke ExportAsFixedFormat jaisa output
"""
import os, sys, subprocess, tempfile, shutil, base64, re
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import requests
from openpyxl import load_workbook

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
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}


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
    """Excel files (.xlsx) ek zip hote hain - PK header check karo"""
    return len(data) > 4 and data[:2] == b'PK'

def download_excel(url):
    print("📥 Downloading Excel from OneDrive...")
    sharing_url = resolve_onedrive_share_url(url)
    session = requests.Session()

    # Method 1: OneDrive API
    try:
        b64 = base64.b64encode(sharing_url.encode()).decode().rstrip('=').replace('+', '-').replace('/', '_')
        api_url = f"https://api.onedrive.com/v1.0/shares/u!{b64}/root/content"
        r = session.get(api_url, headers=HEADERS, allow_redirects=True, timeout=60)
        if r.ok and is_valid_zip(r.content):
            print("✅ Downloaded via OneDrive API")
            return r.content
        else:
            print(f"⚠️ API method gave invalid file (status {r.status_code}, size {len(r.content)})")
    except Exception as e:
        print(f"⚠️ OneDrive API failed: {e}")

    # Method 2: Preview HTML scraping (signed download URL)
    try:
        preview_html = fetch_preview_html(url, session)
        signed_url = extract_signed_download_url(preview_html)
        r = session.get(signed_url, headers=HEADERS, allow_redirects=True, timeout=60)
        if r.ok and is_valid_zip(r.content):
            print("✅ Downloaded via preview scraping")
            return r.content
        else:
            print(f"⚠️ Preview method gave invalid file (status {r.status_code}, size {len(r.content)})")
    except Exception as e:
        print(f"⚠️ Preview download failed: {e}")

    # Method 3: Generic redirect with download param
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
        else:
            print(f"⚠️ Redirect method gave invalid file (status {r2.status_code}, size {len(r2.content)})")
    except Exception as e:
        print(f"⚠️ Generic download failed: {e}")

    raise Exception("OneDrive se valid Excel file download nahi ho saki. Share link check karein.")


# ══════════════════════════════════════════════
#  PDF NAAM + SHEET FILTER
# ══════════════════════════════════════════════

def get_pdf_name(wb):
    for sname in wb.sheetnames:
        if 'sheet_index' in sname.lower() or 'sheetindex' in sname.lower():
            try:
                val = wb[sname]['I2'].value
                if val:
                    return str(val).strip()
            except Exception:
                pass
    return 'Block_SBM_Report'

def hide_other_sheets(wb, keep_sheets):
    visible_names = []
    for name in wb.sheetnames:
        ws = wb[name]
        matched = any(name.strip().lower() == t.strip().lower() for t in keep_sheets)
        if matched:
            ws.sheet_state = 'visible'
            visible_names.append(name)
        else:
            try:
                ws.sheet_state = 'hidden'
            except Exception:
                pass
    print(f"📋 Visible sheets: {visible_names}")
    return visible_names


# ══════════════════════════════════════════════
#  LIBREOFFICE CONVERT
# ══════════════════════════════════════════════

def convert_to_pdf(xlsx_path, pdf_path):
    out_dir = pdf_path.parent
    print("🔄 LibreOffice se PDF convert ho raha hai...")
    result = subprocess.run([
        'libreoffice', '--headless', '--norestore', '--nofirststartwizard',
        '--convert-to', 'pdf',
        '--outdir', str(out_dir),
        str(xlsx_path)
    ], capture_output=True, text=True, timeout=180)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        raise Exception(f"LibreOffice failed: {result.stderr}")
    generated = out_dir / (xlsx_path.stem + '.pdf')
    if generated.exists():
        shutil.move(str(generated), str(pdf_path))
        print(f"✅ PDF saved: {pdf_path}")
    else:
        raise Exception(f"PDF file nahi mili: {generated}")


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
        filtered_path = tmp / 'block_report.xlsx'

        data = download_excel(ONEDRIVE_URL)
        xlsx_path.write_bytes(data)
        print(f"📦 File size: {len(data) // 1024} KB")

        wb = load_workbook(xlsx_path, read_only=True, data_only=True)
        pdf_name = get_pdf_name(wb)
        wb.close()
        print(f"📄 PDF naam: {pdf_name}")

        wb2 = load_workbook(xlsx_path, data_only=True)
        visible = hide_other_sheets(wb2, TARGET_SHEETS)
        if not visible:
            print("⚠️ Koi matching sheet nahi mili, saari sheets rakh rahe hain")
            for name in wb2.sheetnames:
                wb2[name].sheet_state = 'visible'
        wb2.save(str(filtered_path))
        wb2.close()

        pdf_out = DATA_DIR / f"{pdf_name}.pdf"
        convert_to_pdf(filtered_path, pdf_out)

        shutil.copy(str(pdf_out), str(DATA_DIR / 'block-report.pdf'))
        (DATA_DIR / 'block-pdf-name.txt').write_text(pdf_name)
        print(f"🎉 Done! PDF: {pdf_out.name}")


if __name__ == '__main__':
    main()
