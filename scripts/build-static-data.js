require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const XLSX = require('xlsx');

/* ═══════════════════════════════════════════════════════════════
   CONFIG — Google Drive source (OneDrive पूरी तरह हटा दिया गया है)
═══════════════════════════════════════════════════════════════ */
const GOOGLE_DRIVE_FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID || '1mW76gRlKc5P2h9svnjbGKdHj5AeXrHc3';

// Bade / macro-enabled (.xlsm) files पर Google का "can't scan for viruses"
// warning page आ जाता है, इसलिए पहले direct usercontent endpoint try करते हैं।
const PRIMARY_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${GOOGLE_DRIVE_FILE_ID}&export=download&confirm=t`;
// Fallback: पुराना classic uc?export=download endpoint (confirm-token retry सहित)।
const FALLBACK_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}`;

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'workbook.json');
const NOJEKYLL_FILE = path.join(__dirname, '..', 'public', '.nojekyll');

const BROWSER_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

// Workbook में sheet नाम अलग-अलग casing/spelling में हो सकते हैं,
// इसलिए हर business-sheet के लिए accepted aliases रखे गए हैं।
const ACCEPT = {
  census: ['census', 'census data'],
  ration: ['ration hh', 'ration', 'ration hh data', 'ration card'],
  imis: ['all ihhl data', 'all ihhl', 'ihhl data', 'imis data', 'ihhl'],
  csc: ['csc status', 'csc', 'iec csc', 'adarsh shauchalay', 'samudayik']
};

const SHEET_LABELS = {
  census: 'Census',
  ration: 'Ration HH',
  imis: 'All IHHL Data',
  csc: 'CSC Status'
};

/* ═══════════════════════════════════════════════════════════════
   Google Drive download helpers
═══════════════════════════════════════════════════════════════ */
function updateCookieJar(jar, response) {
  const setCookies = (response.headers.raw && response.headers.raw()['set-cookie']) || [];
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

// ज़िप-आधारित फ़ाइलों (.xlsx/.xlsm दोनों असल में ZIP container हैं) का
// magic header "PK" (0x50 0x4B) से शुरू होता है। Google का HTML error/redirect
// page कभी भी इस header से match नहीं करेगा, इसलिए यह एक भरोसेमंद गार्ड है।
function hasZipMagicHeader(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

function looksLikeHtml(buffer) {
  const head = buffer.slice(0, 1024).toString('utf8').toLowerCase();
  return head.includes('<html') || head.includes('<!doctype html');
}

async function fetchAsBuffer(url, cookieJar) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      ...(cookieJar && Object.keys(cookieJar).length ? { cookie: getCookieHeader(cookieJar) } : {})
    }
  });

  if (cookieJar) updateCookieJar(cookieJar, response);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${url})`);
  }

  return response.buffer();
}

function extractConfirmParams(html) {
  const confirmMatch =
    html.match(/confirm=([0-9A-Za-z_-]+)&amp;/) ||
    html.match(/name="confirm"\s+value="([0-9A-Za-z_-]+)"/) ||
    html.match(/confirm=([0-9A-Za-z_-]+)/);
  const uuidMatch = html.match(/name="uuid"\s+value="([0-9A-Za-z_-]+)"/);
  return {
    confirm: confirmMatch ? confirmMatch[1] : null,
    uuid: uuidMatch ? uuidMatch[1] : null
  };
}

/**
 * Google Drive से .xlsm workbook download करता है।
 * हर response को magic header (PK\x03\x04) से verify करता है ताकि
 * कोई HTML warning/redirect page गलती से workbook.json को corrupt न करे।
 */
async function downloadGoogleDriveWorkbook() {
  if (!GOOGLE_DRIVE_FILE_ID) {
    throw new Error('Missing GOOGLE_DRIVE_FILE_ID. Set it as an environment variable / GitHub Actions secret.');
  }

  const cookieJar = {};
  const attempts = [];

  // Attempt 1: usercontent.google.com direct endpoint — बड़ी / macro-enabled
  // files के लिए virus-scan interstitial को अक्सर bypass कर देता है।
  try {
    const buffer = await fetchAsBuffer(PRIMARY_DOWNLOAD_URL, cookieJar);
    if (hasZipMagicHeader(buffer)) return buffer;
    attempts.push('primary (drive.usercontent.google.com): invalid file signature — HTML/redirect page मिला, .xlsm नहीं।');
  } catch (err) {
    attempts.push(`primary (drive.usercontent.google.com): ${err.message}`);
  }

  // Attempt 2: classic uc?export=download, ज़रूरत पड़ने पर confirm-token के साथ retry।
  try {
    const buffer = await fetchAsBuffer(FALLBACK_DOWNLOAD_URL, cookieJar);
    if (hasZipMagicHeader(buffer)) return buffer;

    if (looksLikeHtml(buffer)) {
      const html = buffer.toString('utf8');
      const { confirm, uuid } = extractConfirmParams(html);
      if (confirm) {
        const confirmUrl = `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}&confirm=${confirm}${
          uuid ? `&uuid=${uuid}` : ''
        }`;
        const confirmedBuffer = await fetchAsBuffer(confirmUrl, cookieJar);
        if (hasZipMagicHeader(confirmedBuffer)) return confirmedBuffer;
        attempts.push('fallback confirm-retry: confirm token मिला लेकिन फिर भी invalid file signature।');
      } else {
        attempts.push('fallback (drive.google.com/uc): virus-scan HTML page मिला, कोई confirm token नहीं निकाला जा सका।');
      }
    } else {
      attempts.push('fallback (drive.google.com/uc): invalid file signature (ZIP/.xlsm नहीं)।');
    }
  } catch (err) {
    attempts.push(`fallback (drive.google.com/uc): ${err.message}`);
  }

  throw new Error(
    'Google Drive से valid .xlsm file download नहीं हो सकी। ' +
      'File की sharing setting "Anyone with the link" (Viewer) पर verify करें।\n' +
      `Attempts:\n- ${attempts.join('\n- ')}`
  );
}

/* ═══════════════════════════════════════════════════════════════
   Workbook parsing (Hindi / Kruti Dev 010 / multi-row headers)
═══════════════════════════════════════════════════════════════ */
function toCompactRows(sheet) {
  return XLSX.utils
    .sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
    .map((row) => {
      let end = row.length;
      while (end > 0 && (row[end - 1] === '' || row[end - 1] === null)) end -= 1;
      return row.slice(0, end);
    })
    .filter((row) => row.some((cell) => cell !== '' && cell !== null));
}

/**
 * Sirf main SBM Report dashboard ke liye zaroori sheets nikalta hai:
 * Census, Ration HH, All IHHL Data, CSC Status.
 * Cell ka raw structure (Hindi / Kruti Dev 010 text, multi-row headers)
 * bina bigade array-of-arrays ke roop mein rakha jaata hai.
 */
function parseWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheets = {};
  const sheetNames = [];
  const foundKeys = new Set();

  const addSheet = (key, name) => {
    if (!name || sheets[name]) return;
    const sheet = workbook.Sheets[name];
    if (!sheet) return;
    sheets[name] = toCompactRows(sheet);
    sheetNames.push(name);
    foundKeys.add(key);
  };

  const exactImis = workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'all ihhl data');
  addSheet('imis', exactImis || workbook.SheetNames.find((name) => ACCEPT.imis.includes(name.trim().toLowerCase())));

  ['census', 'ration', 'csc'].forEach((key) => {
    addSheet(key, workbook.SheetNames.find((name) => ACCEPT[key].includes(name.trim().toLowerCase())));
  });

  const missingKeys = Object.keys(ACCEPT).filter((key) => !foundKeys.has(key));

  return {
    sheets,
    sheetNames,
    sourceWorkbookSheetNames: workbook.SheetNames,
    missingKeys
  };
}

/* ═══════════════════════════════════════════════════════════════
   IST timestamp helpers
═══════════════════════════════════════════════════════════════ */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ISO string, लेकिन wall-clock IST time के हिसाब से, +05:30 suffix के साथ।
function toISTISOString(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().replace('Z', '+05:30');
}

function formatISTDisplay(date = new Date()) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/* ═══════════════════════════════════════════════════════════════
   Snapshot build + write (server.js भी इन्हें reuse करता है)
═══════════════════════════════════════════════════════════════ */
async function buildWorkbookSnapshot() {
  const buffer = await downloadGoogleDriveWorkbook();
  const { sheets, sheetNames, sourceWorkbookSheetNames, missingKeys } = parseWorkbookBuffer(buffer);

  if (sheetNames.length === 0) {
    throw new Error(
      'Workbook download हो गई, लेकिन कोई भी known sheet ' +
        '(Census / Ration HH / All IHHL Data / CSC Status) नहीं मिली। ' +
        `Workbook में मौजूद sheets: ${sourceWorkbookSheetNames.join(', ') || 'कोई नहीं'}`
    );
  }

  const now = new Date();
  const version = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);

  const payload = {
    success: true,
    sheets,
    sheetNames,
    meta: {
      source: 'google-drive',
      fileId: GOOGLE_DRIVE_FILE_ID,
      version,
      fetchedAt: now.toISOString(),
      lastUpdated: toISTISOString(now),
      lastUpdatedDisplay: `${formatISTDisplay(now)} IST`,
      missingSheets: missingKeys.map((key) => SHEET_LABELS[key]),
      sourceWorkbookSheetNames
    }
  };

  return { payload, buffer };
}

async function writeSnapshotToDisk(payload) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const json = JSON.stringify(payload);
  await fs.writeFile(OUTPUT_FILE, json, 'utf8');
  await fs.writeFile(NOJEKYLL_FILE, '');
  return json;
}

async function main() {
  console.log(`⬇️  Google Drive से workbook download हो रही है (file ID: ${GOOGLE_DRIVE_FILE_ID})...`);
  const { payload } = await buildWorkbookSnapshot();
  const json = await writeSnapshotToDisk(payload);

  const sizeMb = (Buffer.byteLength(json) / (1024 * 1024)).toFixed(2);
  console.log(`✅ Snapshot लिखा गया: ${OUTPUT_FILE} (${sizeMb} MB)`);
  console.log(`   Sheets मिलीं: ${payload.sheetNames.join(', ')}`);
  if (payload.meta.missingSheets.length) {
    console.warn(`   ⚠️  ये sheets नहीं मिलीं: ${payload.meta.missingSheets.join(', ')}`);
  }
  console.log(`   Last updated (IST): ${payload.meta.lastUpdatedDisplay}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ build-static-data.js fail हुआ:', err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  buildWorkbookSnapshot,
  writeSnapshotToDisk,
  downloadGoogleDriveWorkbook,
  parseWorkbookBuffer,
  hasZipMagicHeader,
  toISTISOString,
  formatISTDisplay,
  OUTPUT_FILE,
  OUTPUT_DIR,
  GOOGLE_DRIVE_FILE_ID
};
