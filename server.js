const express = require('express');
const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ONEDRIVE_SHARE_URL = process.env.ONEDRIVE_URL;
const ONEDRIVE_CACHE_TTL_MS = Number(process.env.ONEDRIVE_CACHE_TTL_MS || 300000);
const CLOUD_SOURCE_LABEL = 'secure-onedrive';
const BROWSER_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

const workbookCache = {
  payload: null,
  version: null,
  fetchedAt: null,
  expiresAt: 0
};

let workbookRefreshPromise = null;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

function ensureConfiguredOneDriveSource() {
  if (!ONEDRIVE_SHARE_URL) {
    throw new Error('Server configuration missing ONEDRIVE_URL.');
  }
}

function isAllowedOneDriveUrl(source) {
  try {
    const { hostname } = new URL(source);
    return hostname === '1drv.ms' || hostname === 'onedrive.live.com';
  } catch (err) {
    return false;
  }
}

function resolveOneDriveShareUrl(source) {
  if (!isAllowedOneDriveUrl(source)) {
    throw new Error('Only OneDrive share links are allowed.');
  }

  try {
    const urlObj = new URL(source);
    const redeemParam = urlObj.searchParams.get('redeem');
    if (redeemParam) {
      return Buffer.from(redeemParam, 'base64').toString('utf8');
    }
  } catch (err) {
    throw new Error('Invalid OneDrive URL.');
  }

  return source;
}

function updateCookieJar(jar, response) {
  const setCookies = response.headers.raw()['set-cookie'] || [];
  setCookies.forEach((header) => {
    const firstChunk = header.split(';')[0];
    const separatorIndex = firstChunk.indexOf('=');
    if (separatorIndex > 0) {
      jar[firstChunk.slice(0, separatorIndex)] = firstChunk.slice(separatorIndex + 1);
    }
  });
}

function getCookieHeader(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function fetchOneDrivePreviewHtml(source) {
  let currentUrl = source;
  const cookieJar = {};

  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        ...BROWSER_HEADERS,
        ...(Object.keys(cookieJar).length ? { cookie: getCookieHeader(cookieJar) } : {})
      }
    });

    updateCookieJar(cookieJar, response);

    const location = response.headers.get('location');
    if (!location || response.status < 300 || response.status >= 400) {
      if (!response.ok) {
        throw new Error(`Preview request failed with HTTP ${response.status}`);
      }
      return response.text();
    }

    currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).toString();
  }

  throw new Error('OneDrive preview redirect chain exceeded safe limit.');
}

function extractSignedDownloadUrl(previewHtml) {
  const match = previewHtml.match(/my\.microsoftpersonalcontent\.com[^"']*download\.aspx\?UniqueId=[^"']+/i);
  if (!match) {
    throw new Error('Signed OneDrive download URL not found in preview HTML.');
  }

  const normalized = match[0]
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');

  return normalized.startsWith('http') ? normalized : `https://${normalized}`;
}

async function downloadOneDriveBuffer(source) {
  const sharingUrl = resolveOneDriveShareUrl(source);

  try {
    const base64Url = Buffer.from(sharingUrl)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const apiUrl = `https://api.onedrive.com/v1.0/shares/u!${base64Url}/root/content`;
    const response = await fetch(apiUrl, { redirect: 'follow' });
    if (response.ok) {
      return response.buffer();
    }
  } catch (err) {
    console.warn('OneDrive API download failed:', err.message);
  }

  try {
    const previewHtml = await fetchOneDrivePreviewHtml(source);
    const signedDownloadUrl = extractSignedDownloadUrl(previewHtml);
    const fileResponse = await fetch(signedDownloadUrl, {
      redirect: 'follow',
      headers: {
        'user-agent': BROWSER_HEADERS['user-agent']
      }
    });
    if (fileResponse.ok) {
      return fileResponse.buffer();
    }
  } catch (err) {
    console.warn('OneDrive preview download failed:', err.message);
  }

  try {
    const redirectResponse = await fetch(sharingUrl, { redirect: 'follow', headers: BROWSER_HEADERS });
    let finalUrl = redirectResponse.url;

    if (finalUrl.includes('onedrive.live.com')) {
      finalUrl = finalUrl.replace('redir?', 'download?');
      if (!finalUrl.includes('/download')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'download=1';
      }
    }

    const fileResponse = await fetch(finalUrl, { redirect: 'follow', headers: BROWSER_HEADERS });
    if (fileResponse.ok && !fileResponse.url.includes('login.live.com')) {
      return fileResponse.buffer();
    }
  } catch (err) {
    console.warn('OneDrive generic download failed:', err.message);
  }

  throw new Error('OneDrive से फ़ाइल डाउनलोड नहीं हो सकी। Server-side source verify करें।');
}

function parseWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, cellStyles: true });
  const sheets = {};
  const toCompactRows = (sheet) => XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false, raw: false })
    .map((row) => {
      let end = row.length;
      while (end > 0 && row[end - 1] === '') end -= 1;
      return row.slice(0, end);
    })
    .filter((row) => row.some((cell) => cell !== ''));

  workbook.SheetNames.forEach((name) => {
    sheets[name] = toCompactRows(workbook.Sheets[name]);
  });

  return { sheets, sheetNames: workbook.SheetNames };
}

function buildWorkbookMeta(cached) {
  return {
    source: CLOUD_SOURCE_LABEL,
    cached,
    version: workbookCache.version,
    fetchedAt: workbookCache.fetchedAt
  };
}

function getCachedWorkbookPayload() {
  if (!workbookCache.payload || workbookCache.expiresAt <= Date.now()) {
    return null;
  }

  return {
    ...workbookCache.payload,
    meta: buildWorkbookMeta(true)
  };
}

async function refreshCloudWorkbook() {
  ensureConfiguredOneDriveSource();

  if (workbookRefreshPromise) {
    return workbookRefreshPromise;
  }

  workbookRefreshPromise = (async () => {
    const buffer = await downloadOneDriveBuffer(ONEDRIVE_SHARE_URL);
    const payload = parseWorkbookBuffer(buffer);
    const version = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const fetchedAt = new Date().toISOString();

    workbookCache.payload = payload;
    workbookCache.version = version;
    workbookCache.fetchedAt = fetchedAt;
    workbookCache.expiresAt = Date.now() + ONEDRIVE_CACHE_TTL_MS;

    return {
      ...payload,
      meta: buildWorkbookMeta(false)
    };
  })();

  try {
    return await workbookRefreshPromise;
  } finally {
    workbookRefreshPromise = null;
  }
}

async function getCloudWorkbook(options = {}) {
  const { refresh = false } = options;
  if (!refresh) {
    const cachedPayload = getCachedWorkbookPayload();
    if (cachedPayload) {
      return cachedPayload;
    }
  }

  return refreshCloudWorkbook();
}

app.post('/api/load-excel', async (req, res) => {
  try {
    const refresh = Boolean(req.body?.refresh);
    const workbook = await getCloudWorkbook({ refresh });
    res.json({ success: true, ...workbook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  const { gp, excelData } = req.body;
  if (!gp || !excelData) {
    return res.status(400).json({ error: 'Missing GP or Excel data' });
  }

  const html = buildReportHTML(gp, excelData);
  let browser = null;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '22mm', bottom: '20mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10pt; font-weight:bold; width:100%; margin:0 12mm; display:flex; justify-content:space-between; align-items:center; font-family: 'Noto Sans Devanagari', sans-serif; border-bottom:1px solid #000; padding-bottom:4px;">
          <span style="flex:1; text-align:left;">Gram Panchayat: ${gp}</span>
          <span style="flex:1; text-align:center; font-size:12pt;">Swachh Bharat Mission (Gramin)</span>
          <span style="flex:1; text-align:right;" class="date"></span>
        </div>
        <script>
          const d = new Date();
          const day = d.getDate().toString().padStart(2,'0');
          const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
          const year = d.getFullYear();
          let hours = d.getHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          const minutes = d.getMinutes().toString().padStart(2,'0');
          document.querySelector('.date').innerText = day + '-' + month + '-' + year + ', ' + hours + ':' + minutes + ' ' + ampm;
        </script>
      `,
      footerTemplate: `
        <div style="font-size:9pt; font-weight:bold; width:100%; text-align:center; margin:0 12mm; border-top:1px solid #000; padding-top:4px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SBM_Report_${gp}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error(err);
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-all-pdf', async (req, res) => {
  const { excelData, gpList } = req.body;
  if (!excelData || !gpList || gpList.length === 0) {
    return res.status(400).json({ error: 'Missing data' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    let combinedHtml = '';
    for (const gp of gpList) {
      combinedHtml += `<div style="page-break-after: always;">${buildReportHTML(gp, excelData)}</div>`;
    }
    await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '22mm', bottom: '20mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10pt; font-weight:bold; width:100%; margin:0 12mm; display:flex; justify-content:space-between; align-items:center; font-family: 'Noto Sans Devanagari', sans-serif; border-bottom:1px solid #000; padding-bottom:4px;">
          <span style="flex:1; text-align:left;">Swachh Bharat Mission (Gramin)</span>
          <span style="flex:1; text-align:center; font-size:12pt;">All GPs Report</span>
          <span style="flex:1; text-align:right;" class="date"></span>
        </div>
        <script>
          const d = new Date();
          document.querySelector('.date').innerText = d.toLocaleDateString('en-IN');
        </script>
      `,
      footerTemplate: `<div style="font-size:9pt; font-weight:bold; width:100%; text-align:center; margin:0 12mm; border-top:1px solid #000; padding-top:4px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
    });
    
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SBM_Report_All_GPs.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error(err);
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
});

function buildReportHTML(gp, excelData) {
  const { census = [], ration = [], imis = [], csc = [] } = excelData;

  const censusVillages = [];
  census.forEach((row, i) => {
    if (i === 0) return;
    if (String(row[2] || '').trim() === gp && String(row[3] || '').trim()) {
      censusVillages.push({ name: String(row[3]).trim(), pop: parseInt(row[4]) || 0 });
    }
  });
  const totalPop = censusVillages.reduce((s, v) => s + v.pop, 0);

  const rationVillages = [];
  ration.forEach((row, i) => {
    if (i === 0) return;
    if (String(row[8] || '').trim() === gp && String(row[9] || '').trim()) {
      rationVillages.push({ name: String(row[9]).trim(), hh: parseInt(row[7]) || 0 });
    }
  });
  const totalHH = rationVillages.reduce((s, v) => s + v.hh, 0);

  let ihhlRow = null;
  for (let i = 1; i < imis.length; i++) {
    if (String(imis[i][1] || '').trim() === gp) { ihhlRow = imis[i]; break; }
  }
  const v = (idx) => (ihhlRow && ihhlRow[idx] !== undefined && ihhlRow[idx] !== '') ? String(ihhlRow[idx]) : '-';

  let cscRowsHtml = '';
  if (csc.length > 1) {
    const headers = csc[0].map(c => String(c || '').trim().toLowerCase());
    const gpCol = headers.findIndex(h => h.includes('gp') || h.includes('gram panchayat'));
    if (gpCol !== -1) {
      const matched = csc.slice(1).filter(row => String(row[gpCol] || '').trim() === gp);
      matched.forEach((row, idx) => {
        const workNameCol = headers.findIndex(h => h.includes('work'));
        cscRowsHtml += `<tr>
          <td>${idx+1}</td>
          <td>${row[headers.findIndex(h => h.includes('financial'))] || '-'}</td>
          <td>${row[gpCol] || '-'}</td>
          <td>${row[headers.findIndex(h => h.includes('village'))] || '-'}</td>
          <td class="kruti-work-name">${workNameCol !== -1 ? (row[workNameCol] || '-') : '-'}</td>
          <td>${row[headers.findIndex(h => h.includes('status'))] || '-'}</td>
          <td>${row[headers.findIndex(h => h.includes('geo'))] || '-'}</td>
          <td>${row[headers.findIndex(h => h.includes('pending'))] || '-'}</td>
        </tr>`;
      });
    }
  }

  // Exact matching UI CSS for the PDF rendering
  return `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><title>SBM Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Noto Sans Devanagari', 'Poppins', sans-serif; padding: 0; color: #000; background: #fff; }
    
    .sec-title { font-size: 1.1rem; font-weight: bold; margin: 12px 0 6px; border-left: 5px solid #000; padding-left: 10px; }
    .sum-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .sum-box { border: 1px solid #000; border-radius: 4px; padding: 8px; text-align: center; flex:1; }
    .sum-box .val { font-size: 1.6rem; font-weight: bold; }
    .hh-bar { border: 1px solid #000; padding: 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight:bold; }
    
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 15px; }
    .card { border: 1px solid #000; border-radius: 4px; padding: 8px; text-align: center; }
    .card .cnt { font-size: 1.4rem; font-weight: bold; }
    
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9pt; }
    th, td { border: 1px solid #000; padding: 5px 4px; text-align: center; vertical-align: middle; }
    th { font-weight: bold; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; color: #000; }
    
    .kruti-work-name { font-family: 'Kruti Dev 010', 'DevLys010', 'Mangal', sans-serif !important; font-size: 18pt !important; font-weight:bold; text-align: left; }
    #s4 { page-break-before: always; }
  </style>
  </head>
  <body>
    <div id="s1">
      <div class="sec-title">🏘️ राजस्व ग्राम एवं जनसंख्या विवरण</div>
      <div class="sum-row">
        <div class="sum-box"><div class="lbl">कुल ग्राम</div><div class="val">${censusVillages.length}</div></div>
        <div class="sum-box"><div class="lbl">कुल जनसंख्या</div><div class="val">${totalPop.toLocaleString('hi-IN')}</div></div>
      </div>
      <div class="cards">${censusVillages.map(v => `<div class="card"><div class="nm">${v.name}</div><div class="cnt">${v.pop.toLocaleString('hi-IN')}</div><div class="sub">जनसंख्या</div></div>`).join('')}</div>
    </div>
    <div id="s2">
      <div class="sec-title">📋 राजस्व ग्राम एवं परिवार (राशन कार्ड डेटा अनुसार)</div>
      <div class="hh-bar"><span>कुल परिवार (HH) :</span><span class="big">${totalHH.toLocaleString('hi-IN')}</span></div>
      <div class="cards">${rationVillages.map(v => `<div class="card"><div class="nm">${v.name}</div><div class="cnt">${v.hh.toLocaleString('hi-IN')}</div><div class="sub">परिवार (HH)</div></div>`).join('')}</div>
    </div>
    <div id="s3">
      <div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी (भाग 1: क्र.सं. से कुल परिवार)</div>
      <table><thead>
        <tr><th rowspan="2">क्र.सं.</th><th rowspan="2">ग्राम पंचायत</th><th colspan="9">वर्ष वार नए IHHL</th><th rowspan="2">कुल परिवार</th></tr>
        <tr><th>BLS</th><th>LOB</th><th>NLB</th><th>21-22</th><th>22-23</th><th>23-24</th><th>24-25</th><th>25-26</th><th>26-27</th></tr>
        <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th></tr>
      </thead>
      <tbody><tr><td>1</td><td style="font-weight:bold;">${gp}</td><td>${v(2)}</td><td>${v(3)}</td><td>${v(4)}</td><td>${v(5)}</td><td>${v(6)}</td><td>${v(7)}</td><td>${v(8)}</td><td>${v(9)}</td><td>${v(10)}</td><td style="font-weight:bold;">${v(11)}</td></tr></tbody></table>
      
      <div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी (भाग 2: शौचालय युक्त एवं लाभान्वित)</div>
      <table><thead>
        <tr><th colspan="4">शौचालय युक्त परिवार</th><th colspan="9">लाभान्वित परिवार</th><th rowspan="2">अपात्र</th><th rowspan="2">शेष</th></tr>
        <tr><th>स्वयं के संसाधन</th><th>एनबीए/पीएमएवी/नरेगा</th><th>एसबीएम से</th><th>⭐ कुल स्वीकृत</th><th>SBM & LOB</th><th>NLB</th><th>21-22</th><th>22-23</th><th>23-24</th><th>24-25</th><th>25-26</th><th>26-27</th><th>कुल लाभान्वित</th></tr>
        <tr><th>13</th><th>14</th><th>15</th><th>16</th><th>17</th><th>18</th><th>19</th><th>20</th><th>21</th><th>22</th><th>23</th><th>24</th><th>25</th><th>26</th><th>27</th></tr>
      </thead>
      <tbody><tr><td>${v(12)}</td><td>${v(13)}</td><td>${v(14)}</td><td style="font-weight:bold;">${v(15)}</td><td>${v(16)}</td><td>${v(17)}</td><td>${v(18)}</td><td>${v(19)}</td><td>${v(20)}</td><td>${v(21)}</td><td>${v(22)}</td><td>${v(23)}</td><td style="font-weight:bold;">${v(24)}</td><td>${v(25)}</td><td style="font-weight:bold;">${v(26)}</td></tr></tbody></table>
    </div>
    <div id="s4">
      <div class="sec-title">🚻 आदर्श / सामुदायिक शौचालय विवरण (CSC Status)</div>
      <table><thead><tr><th>क्र.सं.</th><th>Financial Year</th><th>Name of GP</th><th>Name of Village</th><th>Work Name</th><th>Work Status</th><th>Geo Tag Status</th><th>Pending Since</th></tr></thead>
      <tbody>${cscRowsHtml}</tbody></table>
    </div>
  </body>
  </html>`;
}

app.listen(PORT, () => {
  console.log(`SBM-G server running on http://localhost:${PORT}`);
});
