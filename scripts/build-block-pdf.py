"""
build-block-pdf.py
Excel file ko download karke LibreOffice se PDF banata hai
Bilkul VBA ke ExportAsFixedFormat jaisa output
"""
import os, sys, subprocess, tempfile, shutil, struct, zlib
from pathlib import Path

# ── pip install ──
subprocess.run([sys.executable,'-m','pip','install','requests','openpyxl','--quiet'], check=True)
import requests, openpyxl
from openpyxl import load_workbook

ONEDRIVE_URL = os.environ.get('ONEDRIVE_URL','')
PUBLIC_DIR   = Path(__file__).parent.parent / 'public'
DATA_DIR     = PUBLIC_DIR / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

TARGET_SHEETS = [
    'Summary','ODF Plus','CSC 23-24','CSC 24-25','CSC 25-26',
    'RRC Updated (4)','All IHHL Data Combine','Tender Report 25-26',
    'Target AIP 26-27','AIP 26-27 Financial','Soak Pit 26-27',
    'Compost Pit 26-27','Individual assest 26-27'
]

HEADERS = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': 'text/html,application/xhtml+xml,*/*;q=0.8'
}

def download_excel(url):
    print(f"📥 Downloading Excel from OneDrive...")
    # Method 1: OneDrive API
    try:
        b64 = __import__('base64').b64encode(url.encode()).decode().rstrip('=').replace('+','-').replace('/','_')
        api = f"https://api.onedrive.com/v1.0/shares/u!{b64}/root/content"
        r = requests.get(api, timeout=60, allow_redirects=True)
        if r.ok and len(r.content) > 1000:
            print("✅ Downloaded via OneDrive API")
            return r.content
    except Exception as e:
        print(f"⚠️ API failed: {e}")
    # Method 2: Direct fetch
    try:
        r = requests.get(url, timeout=60, allow_redirects=True, headers=HEADERS)
        if r.ok and len(r.content) > 1000:
            print("✅ Downloaded via direct fetch")
            return r.content
    except Exception as e:
        print(f"⚠️ Direct failed: {e}")
    raise Exception("Excel file download nahi hua")

def get_pdf_name(wb):
    """Sheet_Index I2 se PDF naam"""
    for sname in wb.sheetnames:
        if 'sheet_index' in sname.lower() or 'sheetindex' in sname.lower():
            try:
                val = wb[sname]['I2'].value
                if val:
                    return str(val).strip()
            except:
                pass
    return 'Block_SBM_Report'

def hide_other_sheets(wb, keep_sheets):
    """Sirf target sheets visible rakho"""
    from openpyxl.utils.exceptions import InvalidFileException
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
            except:
                pass
    print(f"📋 Visible sheets: {visible_names}")
    return visible_names

def convert_to_pdf(xlsx_path, pdf_path):
    """LibreOffice se PDF convert"""
    out_dir = pdf_path.parent
    print("🔄 LibreOffice se PDF convert ho raha hai...")
    result = subprocess.run([
        'libreoffice','--headless','--norestore','--nofirststartwizard',
        '--convert-to','pdf',
        '--outdir', str(out_dir),
        str(xlsx_path)
    ], capture_output=True, text=True, timeout=120)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        raise Exception(f"LibreOffice failed: {result.stderr}")
    # LibreOffice output naam
    generated = out_dir / (xlsx_path.stem + '.pdf')
    if generated.exists():
        shutil.move(str(generated), str(pdf_path))
        print(f"✅ PDF saved: {pdf_path}")
    else:
        raise Exception(f"PDF file nahi mili: {generated}")

def main():
    if not ONEDRIVE_URL:
        print("❌ ONEDRIVE_URL not set"); sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        xlsx_path = tmp / 'workbook.xlsx'
        filtered_path = tmp / 'block_report.xlsx'

        # Download
        data = download_excel(ONEDRIVE_URL)
        xlsx_path.write_bytes(data)
        print(f"📦 File size: {len(data)//1024} KB")

        # PDF naam nikalo
        wb = load_workbook(xlsx_path, read_only=True, data_only=True)
        pdf_name = get_pdf_name(wb)
        wb.close()
        print(f"📄 PDF naam: {pdf_name}")

        # Sirf target sheets wali copy banao
        wb2 = load_workbook(xlsx_path, data_only=True)
        visible = hide_other_sheets(wb2, TARGET_SHEETS)
        # Make sure at least one sheet is visible
        if not visible:
            print("⚠️ Koi matching sheet nahi mili, saari sheets rakh rahe hain")
            for name in wb2.sheetnames:
                wb2[name].sheet_state = 'visible'
        wb2.save(str(filtered_path))
        wb2.close()

        # PDF banao
        pdf_out = DATA_DIR / f"{pdf_name}.pdf"
        convert_to_pdf(filtered_path, pdf_out)

        # Latest naam se bhi save karo (block-report.pdf - fixed naam for linking)
        shutil.copy(str(pdf_out), str(DATA_DIR / 'block-report.pdf'))

        # PDF naam save karo JS ke liye
        (DATA_DIR / 'block-pdf-name.txt').write_text(pdf_name)
        print(f"🎉 Done! PDF: {pdf_out.name}")

if __name__ == '__main__':
    main()
