require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const XLSX = require('xlsx');

const ONEDRIVE_SHARE_URL = process.env.ONEDRIVE_URL;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'workbook.json');
const NOJEKYLL_FILE = path.join(__dirname, '..', 'public', '.nojekyll');
const BROWSER_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};
const ACCEPT = {
  census: ['census', 'census data'],
  ration: ['ration hh', 'ration', 'ration hh data', 'ration card'],
  imis: ['all ihhl data', 'all ihhl', 'ihhl data', 'imis data', 'ihhl'],
  csc: ['csc status', 'csc', 'iec csc', 'adarsh shauchalay', 'samudayik']
};
const BLOCK_TARGET_SHEETS = [
  'Summary', 'ODF Plus', 'CSC 23-24', 'CSC 24-25', 'CSC 25-26',
  'RRC Updated (4)', 'All IHHL Data Combine', 'Tender Report 25-26',
  'Target AIP 26-27', 'AIP 26-27 Financial', 'Soak Pit 26-27',
  'Compost Pit 26-27', 'Individual assest 26-27'
];
const BLOCK_HELPER_SHEETS = ['sheet_index'];

function ensureConfiguredOneDriveSource() {
  if (!ONEDRIVE_SHARE_URL) {
    throw new Error('Missing ONEDRIVE_URL. Add it as an environment variable or GitHub Actions secret.');
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

async function downloadOneDriveBuffer() {
  ensureConfiguredOneDriveSource();
  const sharingUrl = resolveOneDriveShareUrl(ONEDRIVE_SHARE_URL);

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
    const previewHtml = await fetchOneDrivePreviewHtml(ONEDRIVE_SHARE_URL);
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

  throw new Error('OneDrive से फ़ाइल डाउनलोड नहीं हो सकी।');
}

function normalizeSheetName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, cellStyles: true });
  const sheets = {};
  const sheetNames = [];
  const toCompactRows = (sheet) => XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false, raw: false })
    .map((row) => {
      let end = row.length;
      while (end > 0 && row[end - 1] === '') end -= 1;
      return row.slice(0, end);
    })
    .filter((row) => row.some((cell) => cell !== ''));

  const addSheet = (name) => {
    if (!name || sheets[name]) return;
    sheets[name] = toCompactRows(workbook.Sheets[name]);
    sheetNames.push(name);
  };

  const exactImis = workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'all ihhl data');
  if (exactImis) {
    addSheet(exactImis);
  } else {
    addSheet(workbook.SheetNames.find((name) => ACCEPT.imis.includes(name.trim().toLowerCase())));
  }

  ['census', 'ration', 'csc'].forEach((key) => {
    addSheet(workbook.SheetNames.find((name) => ACCEPT[key].includes(name.trim().toLowerCase())));
  });

  BLOCK_HELPER_SHEETS.forEach((target) => {
    addSheet(workbook.SheetNames.find((name) => normalizeSheetName(name) === normalizeSheetName(target)));
  });

  BLOCK_TARGET_SHEETS.forEach((target) => {
    addSheet(workbook.SheetNames.find((name) => normalizeSheetName(name) === normalizeSheetName(target)));
  });

  return { sheets, sheetNames, blockTargetSheets: BLOCK_TARGET_SHEETS };
}

async function main() {
  const buffer = await downloadOneDriveBuffer();
  const payload = parseWorkbookBuffer(buffer);
  const now = new Date().toISOString();
  const version = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
  const sitePayload = JSON.stringify({
    success: true,
    ...payload,
    meta: {
      source: 'github-pages-snapshot',
      upstreamSource: 'secure-onedrive',
      cached: false,
      version,
      fetchedAt: now,
      publishedAt: now
    }
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, sitePayload);
  await fs.writeFile(NOJEKYLL_FILE, '');

  const sizeMb = (Buffer.byteLength(sitePayload) / (1024 * 1024)).toFixed(2);
  console.log(`Published snapshot written to ${OUTPUT_FILE} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
