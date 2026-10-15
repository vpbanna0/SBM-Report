/**
 * scripts/build-block-report.js (or scripts/build_block_report.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Extracts the 14 Block Report sheets defined in the Excel VBA macro
 * `SaveSheetsAsPDF()` along with `Sheet_Index!I2` (PDF filename), full
 * OpenXML cell styles, fonts (including Kruti Dev / DevLys), fills, theme
 * colors, conditional formatting, borders, merged cells, column widths,
 * row heights, Print_Area, and Page Setup (Portrait vs Landscape), and
 * writes `public/data/block-report.json`.
 * ═══════════════════════════════════════════════════════════════════════════
 */
try { require('dotenv').config(); } catch (_) {}

const fs = require('fs/promises');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// Supports both hyphen (kruti-dev-converter.js) and underscore (kruti_dev_converter.js) filenames
let KrutiDevConverter;
try {
  KrutiDevConverter = require('../public/kruti-dev-converter');
} catch (_) {
  KrutiDevConverter = require('../public/kruti_dev_converter');
}

const BLOCK_REPORT_SHEETS = [
  'Summary',
  'ODF Plus',
  'CSC 23-24',
  'CSC 24-25',
  'CSC 25-26',
  'CSC 26-27',
  'RRC Updated (4)',
  'All IHHL Data Combine',
  'Tender Report 26-27',
  'Target AIP 26-27',
  'AIP 26-27 Financial',
  'Soak Pit 26-27',
  'Compost Pit 26-27',
  'Individual assest 26-27'
];

const BLOCK_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const BLOCK_OUTPUT_FILE = path.join(BLOCK_OUTPUT_DIR, 'block-report.json');

function unzipBuffer(buffer) {
  const files = {};
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP / .xlsm buffer: EOCD record not found');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let ptr = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > buffer.length || buffer.readUInt32LE(ptr) !== 0x02014b50) break;
    const compressionMethod = buffer.readUInt16LE(ptr + 10);
    const compressedSize = buffer.readUInt32LE(ptr + 20);
    const fileNameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);
    const fileName = buffer.slice(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');

    ptr += 46 + fileNameLen + extraLen + commentLen;

    if (fileName.endsWith('/')) continue;
    if (localHeaderOffset + 30 > buffer.length) continue;
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawSlice = buffer.slice(dataStart, dataStart + compressedSize);

    try {
      if (compressionMethod === 0) {
        files[fileName] = rawSlice;
      } else if (compressionMethod === 8) {
        files[fileName] = zlib.inflateRawSync(rawSlice);
      }
    } catch (_) {}
  }
  return files;
}

function decodeXmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function getAttr(tagStr, attrName) {
  const re = new RegExp(`(?:^|\\s)${attrName}="([^"]*)"`, 'i');
  const m = tagStr.match(re);
  return m ? decodeXmlEntities(m[1]) : null;
}

function colToIdx(colStr) {
  let n = 0;
  const s = colStr.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n;
}

function parseCellRef(ref) {
  const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/i.exec(String(ref).trim());
  if (!m) return null;
  return {
    col: colToIdx(m[2]),
    row: parseInt(m[4], 10)
  };
}

function parseRangeRef(rangeStr) {
  if (!rangeStr) return null;
  const clean = String(rangeStr).split('!').pop().replace(/\$/g, '').trim();
  const parts = clean.split(':');
  const start = parseCellRef(parts[0]);
  const end = parts[1] ? parseCellRef(parts[1]) : start;
  if (!start || !end) return null;
  return {
    r1: Math.min(start.row, end.row),
    c1: Math.min(start.col, end.col),
    r2: Math.max(start.row, end.row),
    c2: Math.max(start.col, end.col)
  };
}

const DEFAULT_THEME_COLORS = [
  'FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4',
  'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'
];

const INDEXED_COLORS = {
  0: '000000', 1: 'FFFFFF', 2: 'FF0000', 3: '00FF00', 4: '0000FF',
  5: 'FFFF00', 6: 'FF00FF', 7: '00FFFF', 8: '000000', 9: 'FFFFFF',
  10: 'FF0000', 11: '00FF00', 12: '0000FF', 13: 'FFFF00', 14: 'FF00FF',
  15: '00FFFF', 16: '800000', 17: '008000', 18: '000080', 19: '808000',
  20: '800080', 21: '008080', 22: 'C0C0C0', 23: '808080', 43: 'FFFF99',
  44: '99CCFF', 45: 'FF99CC', 46: 'CC99FF', 47: 'FFCC99', 64: null
};

function parseThemeColors(themeXml) {
  const colors = [...DEFAULT_THEME_COLORS];
  if (!themeXml) return colors;
  const schemeMatch = themeXml.match(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/i);
  if (!schemeMatch) return colors;
  const tagOrder = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
  tagOrder.forEach((tag, idx) => {
    const m = schemeMatch[0].match(new RegExp(`<a:${tag}>([\\s\\S]*?)<\\/a:${tag}>`, 'i'));
    if (m) {
      const srgb = m[1].match(/val="([0-9A-Fa-f]{6})"/);
      const lastClr = m[1].match(/lastClr="([0-9A-Fa-f]{6})"/);
      if (lastClr) colors[idx] = lastClr[1].toUpperCase();
      else if (srgb) colors[idx] = srgb[1].toUpperCase();
    }
  });
  return colors;
}

function applyTintToHex(hex, tint) {
  if (!hex || hex.length !== 6 || !tint) return hex;
  const t = parseFloat(tint);
  if (Number.isNaN(t) || t === 0) return hex;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const adjust = (c) => (t < 0 ? Math.round(c * (1 + t)) : Math.round(c + (255 - c) * t));
  const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
  return toHex(adjust(r)) + toHex(adjust(g)) + toHex(adjust(b));
}

function resolveColorNode(nodeXml, themeColors) {
  if (!nodeXml) return null;
  const rgb = getAttr(nodeXml, 'rgb');
  if (rgb) {
    const clean = rgb.length === 8 ? rgb.slice(2) : rgb;
    if (clean === '000000' && getAttr(nodeXml, 'auto')) return null;
    return '#' + clean.toUpperCase();
  }
  const theme = getAttr(nodeXml, 'theme');
  if (theme !== null) {
    const idx = parseInt(theme, 10);
    let baseHex = themeColors[idx] || DEFAULT_THEME_COLORS[idx] || 'D9D9D9';
    if (idx === 7 && parseFloat(getAttr(nodeXml, 'tint') || '0') > 0.7) {
      return '#D9E1F2';
    }
    const tint = getAttr(nodeXml, 'tint');
    return '#' + applyTintToHex(baseHex, tint);
  }
  const indexed = getAttr(nodeXml, 'indexed');
  if (indexed !== null && INDEXED_COLORS[indexed]) {
    return '#' + INDEXED_COLORS[indexed];
  }
  return null;
}

function parseStylesXml(stylesXml, themeColors) {
  const numFmts = {
    0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00',
    9: '0%', 10: '0.00%', 11: '0.00E+00', 14: 'dd-mm-yyyy',
    15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 22: 'm/d/yy h:mm'
  };
  const fonts = [];
  const fills = [];
  const borders = [];
  const cellXfs = [];
  const dxfs = [];

  if (!stylesXml) return { numFmts, fonts, fills, borders, cellXfs, dxfs };

  const numFmtMatches = stylesXml.match(/<numFmt\b[^>]*\/?>/gi) || [];
  for (const tag of numFmtMatches) {
    const id = getAttr(tag, 'numFmtId');
    const code = getAttr(tag, 'formatCode');
    if (id !== null && code !== null) numFmts[id] = code;
  }

  const fontsBlock = stylesXml.match(/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/i);
  if (fontsBlock) {
    const fontTags = fontsBlock[1].match(/<font\b[^>]*>[\s\S]*?<\/font>/gi) || [];
    for (const fXml of fontTags) {
      const nameM = fXml.match(/<name\b[^>]*val="([^"]*)"/i);
      const szM = fXml.match(/<sz\b[^>]*val="([^"]*)"/i);
      const colorM = fXml.match(/<color\b[^>]*\/?>/i);
      const bold = /<b\b(?:\s+val="(?:true|1)")?\s*\/?>/i.test(fXml);
      const italic = /<i\b(?:\s+val="(?:true|1)")?\s*\/?>/i.test(fXml);
      const strike = /<strike\b(?:\s+val="(?:true|1)")?\s*\/?>/i.test(fXml);
      const fontName = nameM ? decodeXmlEntities(nameM[1]) : 'Calibri';
      fonts.push({
        name: fontName,
        isKruti: KrutiDevConverter.isLegacyHindiFont(fontName),
        sz: szM ? parseFloat(szM[1]) : 11,
        bold,
        italic,
        strike,
        color: colorM ? resolveColorNode(colorM[0], themeColors) : '#000000'
      });
    }
  }

  const fillsBlock = stylesXml.match(/<fills\b[^>]*>([\s\S]*?)<\/fills>/i);
  if (fillsBlock) {
    const fillTags = fillsBlock[1].match(/<fill\b[^>]*>[\s\S]*?<\/fill>/gi) || [];
    for (const flXml of fillTags) {
      const pfM = flXml.match(/<patternFill\b[^>]*>/i);
      const pType = pfM ? getAttr(pfM[0], 'patternType') : 'none';
      if (pType === 'solid') {
        const fgM = flXml.match(/<fgColor\b[^>]*\/?>/i);
        const bgM = flXml.match(/<bgColor\b[^>]*\/?>/i);
        let color = fgM ? resolveColorNode(fgM[0], themeColors) : null;
        if (!color && bgM) color = resolveColorNode(bgM[0], themeColors);
        if (color === '#FFFFFF') color = null;
        fills.push({ bg: color });
      } else {
        fills.push({ bg: null });
      }
    }
  }

  const bordersBlock = stylesXml.match(/<borders\b[^>]*>([\s\S]*?)<\/borders>/i);
  if (bordersBlock) {
    const borderTags = bordersBlock[1].match(/<border\b[^>]*>[\s\S]*?<\/border>/gi) || [];
    for (const bXml of borderTags) {
      const side = (tag) => {
        const m = bXml.match(new RegExp(`<${tag}\\b([^>]*)(?:\\/>|>[\\s\\S]*?<\\/${tag}>)`, 'i'));
        if (!m) return null;
        const style = getAttr(m[0], 'style');
        return style && style !== 'none' ? style : null;
      };
      borders.push({
        left: side('left'),
        right: side('right'),
        top: side('top'),
        bottom: side('bottom')
      });
    }
  }

  const xfsBlock = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/i);
  if (xfsBlock) {
    const xfTags = xfsBlock[1].match(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/gi) || [];
    for (const xfXml of xfTags) {
      const numFmtId = parseInt(getAttr(xfXml, 'numFmtId') || '0', 10);
      const fontId = parseInt(getAttr(xfXml, 'fontId') || '0', 10);
      const fillId = parseInt(getAttr(xfXml, 'fillId') || '0', 10);
      const borderId = parseInt(getAttr(xfXml, 'borderId') || '0', 10);
      const alignM = xfXml.match(/<alignment\b[^>]*\/?>/i);
      const hAlign = alignM ? getAttr(alignM[0], 'horizontal') : null;
      const vAlign = alignM ? getAttr(alignM[0], 'vertical') : 'center';
      const wrapText = alignM ? getAttr(alignM[0], 'wrapText') === '1' : false;

      cellXfs.push({
        numFmtId,
        numFmtCode: numFmts[numFmtId] || 'General',
        font: fonts[fontId] || fonts[0] || { name: 'Calibri', sz: 11, bold: false, isKruti: false },
        fill: fills[fillId] || { bg: null },
        border: borders[borderId] || { left: null, right: null, top: null, bottom: null },
        align: { h: hAlign, v: vAlign || 'center', wrap: wrapText }
      });
    }
  }

  const dxfsBlock = stylesXml.match(/<dxfs\b[^>]*>([\s\S]*?)<\/dxfs>/i);
  if (dxfsBlock) {
    const dxfTags = dxfsBlock[1].match(/<dxf\b[^>]*?(?:\/>|>[\s\S]*?<\/dxf>)/gi) || [];
    for (const dxfXml of dxfTags) {
      const bgM = dxfXml.match(/<bgColor\b[^>]*\/?>/i) || dxfXml.match(/<fgColor\b[^>]*\/?>/i);
      const fontBlock = dxfXml.match(/<font\b[^>]*>([\s\S]*?)<\/font>/i);
      const fontColorM = fontBlock ? fontBlock[1].match(/<color\b[^>]*\/?>/i) : null;
      dxfs.push({
        bg: bgM ? resolveColorNode(bgM[0], themeColors) : null,
        color: fontColorM ? resolveColorNode(fontColorM[0], themeColors) : null
      });
    }
  }

  return { numFmts, fonts, fills, borders, cellXfs, dxfs };
}

function parseRichOrPlainSi(siXml) {
  const rMatches = siXml.match(/<r>[\s\S]*?<\/r>/gi);
  if (rMatches && rMatches.length > 0) {
    const runs = rMatches.map((rXml) => {
      const fontM = rXml.match(/<(?:rFont|name)\b[^>]*val="([^"]*)"/i);
      const szM = rXml.match(/<sz\b[^>]*val="([^"]*)"/i);
      const bold = /<b\b(?:\s+val="(?:true|1)")?\s*\/?>/i.test(rXml);
      const tMatches = rXml.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/gi) || [];
      const text = tMatches
        .map((t) => decodeXmlEntities(t.replace(/^<t[^>]*>|<\/t>$/gi, '')))
        .join('');
      return {
        text,
        fontName: fontM ? decodeXmlEntities(fontM[1]) : null,
        sz: szM ? parseFloat(szM[1]) : null,
        bold
      };
    });
    return {
      isRich: true,
      runs,
      rawText: runs.map((r) => r.text).join('')
    };
  }

  const tMatches = siXml.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/gi) || [];
  const rawText = tMatches
    .map((t) => decodeXmlEntities(t.replace(/^<t[^>]*>|<\/t>$/gi, '')))
    .join('');
  return {
    isRich: false,
    runs: null,
    rawText
  };
}

function parseSharedStrings(sstXml) {
  if (!sstXml) return [];
  const items = [];
  const siMatches = sstXml.match(/<si\b[^>]*>[\s\S]*?<\/si>/gi) || [];
  for (const siXml of siMatches) {
    items.push(parseRichOrPlainSi(siXml));
  }
  return items;
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function formatIndianNumber(num, decimals = 0) {
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  let formattedInt = intPart;
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    formattedInt = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return (isNeg ? '-' : '') + formattedInt + (decimals > 0 ? '.' + decPart : '');
}

function isDateNumFmt(numFmtId, fmtCode) {
  if ([14, 15, 16, 17, 18, 19, 20, 21, 22, 164].includes(numFmtId)) {
    const clean = String(fmtCode || '').replace(/\[[^\]]*\]/g, '').toLowerCase();
    if (/[dmy]/.test(clean) && !/[#0%]/.test(clean)) return true;
  }
  const clean = String(fmtCode || '').replace(/\[[^\]]*\]/g, '').toLowerCase();
  return /(?:yyyy|yy|mmmm|mmm|dd)/.test(clean) && !/[#0%]/.test(clean);
}

function formatCellValue(rawVal, cellType, formulaStr, xf, sheetName, colHeaderText) {
  if (rawVal === null || rawVal === undefined || rawVal === '') {
    return { text: '', isCurrency: false, isNumeric: false };
  }

  const fmtCode = (xf && xf.numFmtCode) || 'General';
  const numFmtId = (xf && xf.numFmtId) || 0;

  if (cellType === 's' || cellType === 'str' || cellType === 'inlineStr') {
    return { text: String(rawVal), isCurrency: false, isNumeric: false };
  }

  const num = Number(rawVal);
  if (Number.isNaN(num)) {
    return { text: String(rawVal), isCurrency: false, isNumeric: false };
  }

  const isTodayFormula = formulaStr && /\bTODAY\s*\(\s*\)/i.test(formulaStr);
  if (isTodayFormula || (num > 35000 && num < 65000 && isDateNumFmt(numFmtId, fmtCode))) {
    const d = isTodayFormula ? new Date(Date.now() + 5.5 * 3600 * 1000) : (num > 35000 ? excelSerialToDate(num) : new Date());
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mmIdx = d.getUTCMonth();
    const yyyy = d.getUTCFullYear();
    const cleanFmt = String(fmtCode).toLowerCase();
    if (cleanFmt.includes('mmm') && !cleanFmt.includes('mmmm') && cleanFmt.includes('-')) {
      return { text: `${dd}-${MONTHS_SHORT[mmIdx]}-${yyyy}`, isCurrency: false, isNumeric: false };
    }
    if (cleanFmt.includes('mm-yyyy') || cleanFmt.includes('mm/yyyy')) {
      return { text: `${dd}-${String(mmIdx + 1).padStart(2, '0')}-${yyyy}`, isCurrency: false, isNumeric: false };
    }
    return { text: `${dd} ${MONTHS_FULL[mmIdx]} ${yyyy}`, isCurrency: false, isNumeric: false };
  }

  if (numFmtId === 9 || numFmtId === 10 || fmtCode.includes('%')) {
    const decimals = fmtCode.includes('.00%') || numFmtId === 10 ? 2 : fmtCode.includes('.0%') ? 1 : 0;
    return { text: (num * 100).toFixed(decimals) + '%', isCurrency: false, isNumeric: true, rawNum: num };
  }

  const hdrLower = String(colHeaderText || '').toLowerCase();
  const isCurrencyCol =
    fmtCode.includes('₹') ||
    fmtCode.includes('[$₹') ||
    hdrLower.includes('expenditure') ||
    hdrLower.includes('tender amount') ||
    (hdrLower.includes('amount') && !hdrLower.includes('count'));

  if (isCurrencyCol) {
    if (Math.abs(num) < 0.0001) {
      return { text: '-', isCurrency: true, isNumeric: true, rawNum: 0 };
    }
    return { text: formatIndianNumber(num, 2), isCurrency: true, isNumeric: true, rawNum: num };
  }

  if (numFmtId === 2 || numFmtId === 4 || /\.00\b/.test(fmtCode)) {
    return { text: formatIndianNumber(num, 2), isCurrency: false, isNumeric: true, rawNum: num };
  }

  if (Number.isInteger(num)) {
    return { text: String(num), isCurrency: false, isNumeric: true, rawNum: num };
  }
  return { text: Number(num.toFixed(2)).toString(), isCurrency: false, isNumeric: true, rawNum: num };
}

function parseWorkbookXml(workbookXml, relsXml) {
  const relMap = {};
  if (relsXml) {
    const relTags = relsXml.match(/<Relationship\b[^>]*\/?>/gi) || [];
    for (const tag of relTags) {
      const id = getAttr(tag, 'Id');
      const target = getAttr(tag, 'Target');
      if (id && target) {
        const cleanTarget = target.replace(/^\/+/, '');
        relMap[id] = cleanTarget.startsWith('xl/') ? cleanTarget : `xl/${cleanTarget}`;
      }
    }
  }

  const sheets = [];
  const sheetTags = workbookXml.match(/<sheet\b[^>]*\/?>/gi) || [];
  sheetTags.forEach((tag, idx) => {
    const name = getAttr(tag, 'name');
    const sheetId = getAttr(tag, 'sheetId');
    const rId = getAttr(tag, 'r:id') || getAttr(tag, 'id');
    const state = getAttr(tag, 'state') || 'visible';
    sheets.push({
      index: idx,
      name,
      sheetId,
      rId,
      state,
      path: relMap[rId] || `xl/worksheets/sheet${idx + 1}.xml`,
      printArea: null
    });
  });

  const defMatches = workbookXml.match(/<definedName\b[^>]*>[\s\S]*?<\/definedName>/gi) || [];
  for (const dXml of defMatches) {
    const name = getAttr(dXml, 'name');
    const localSheetId = getAttr(dXml, 'localSheetId');
    if (name === '_xlnm.Print_Area' && localSheetId !== null) {
      const idx = parseInt(localSheetId, 10);
      const val = decodeXmlEntities(dXml.replace(/^<definedName[^>]*>|<\/definedName>$/gi, '')).trim();
      const firstRange = val.split(',')[0];
      const parsed = parseRangeRef(firstRange);
      if (sheets[idx] && parsed) {
        sheets[idx].printArea = parsed;
      }
    }
  }

  return sheets;
}

function parseSingleCellValueFromSheetXml(sheetXml, targetRef, sharedStrings, styles) {
  if (!sheetXml) return '';
  const re = new RegExp(`<c\\b[^>]*\\br="${targetRef}"[^>]*?(?:\\/>|>[\\s\\S]*?<\\/c>)`, 'i');
  const m = sheetXml.match(re);
  if (!m) return '';
  const cXml = m[0];
  const t = getAttr(cXml, 't') || '';
  const sIdx = parseInt(getAttr(cXml, 's') || '0', 10);
  const xf = styles.cellXfs[sIdx] || styles.cellXfs[0];
  const vM = cXml.match(/<v>([\s\S]*?)<\/v>/i);
  const fM = cXml.match(/<f(?:\s+[^>]*)?>([\s\S]*?)<\/f>/i);
  const formulaStr = fM ? decodeXmlEntities(fM[1]) : null;

  if (t === 's' && vM) {
    const sstItem = sharedStrings[parseInt(vM[1], 10)];
    if (!sstItem) return '';
    if (sstItem.isRich) {
      return KrutiDevConverter.convertRichRuns(sstItem.runs, xf?.font?.name);
    }
    return KrutiDevConverter.convertTextSmart(sstItem.rawText, xf?.font?.isKruti);
  }
  if (t === 'inlineStr') {
    const isM = cXml.match(/<is>([\s\S]*?)<\/is>/i);
    if (!isM) return '';
    const parsed = parseRichOrPlainSi(isM[1]);
    return parsed.isRich
      ? KrutiDevConverter.convertRichRuns(parsed.runs, xf?.font?.name)
      : KrutiDevConverter.convertTextSmart(parsed.rawText, xf?.font?.isKruti);
  }
  const rawVal = vM ? decodeXmlEntities(vM[1]) : '';
  const formatted = formatCellValue(rawVal, t, formulaStr, xf, '', '');
  return KrutiDevConverter.convertTextSmart(formatted.text, xf?.font?.isKruti);
}

function parseWorksheetFull(sheetMeta, sheetXml, sharedStrings, styles) {
  const psM = sheetXml.match(/<pageSetup\b[^>]*\/?>/i);
  const spM = sheetXml.match(/<pageSetUpPr\b[^>]*\/?>/i);
  const orientation = (psM && getAttr(psM[0], 'orientation')) || (sheetMeta.name === 'Summary' ? 'portrait' : 'landscape');
  const scale = psM && getAttr(psM[0], 'scale') ? parseInt(getAttr(psM[0], 'scale'), 10) : null;
  const fitToPage = spM ? getAttr(spM[0], 'fitToPage') === '1' : false;

  const colWidths = {};
  const colTags = sheetXml.match(/<col\b[^>]*\/?>/gi) || [];
  for (const cTag of colTags) {
    const minC = parseInt(getAttr(cTag, 'min') || '1', 10);
    const maxC = parseInt(getAttr(cTag, 'max') || String(minC), 10);
    const w = parseFloat(getAttr(cTag, 'width') || '10');
    const hidden = getAttr(cTag, 'hidden') === '1';
    for (let c = minC; c <= Math.min(maxC, 60); c++) {
      colWidths[c] = hidden ? 0 : w;
    }
  }

  const merges = [];
  const mergeTags = sheetXml.match(/<mergeCell\b[^>]*\/?>/gi) || [];
  for (const mTag of mergeTags) {
    const ref = getAttr(mTag, 'ref');
    const parsed = parseRangeRef(ref);
    if (parsed) merges.push(parsed);
  }

  const cfRules = [];
  const cfBlocks = sheetXml.match(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/gi) || [];
  for (const cfXml of cfBlocks) {
    const sqref = getAttr(cfXml, 'sqref') || '';
    const ranges = sqref.split(/\s+/).map(parseRangeRef).filter(Boolean);
    const ruleTags = cfXml.match(/<cfRule\b[^>]*?(?:\/>|>[\s\S]*?<\/cfRule>)/gi) || [];
    for (const rXml of ruleTags) {
      const dxfId = parseInt(getAttr(rXml, 'dxfId') || '-1', 10);
      const dxf = styles.dxfs[dxfId];
      if (!dxf) continue;
      const type = getAttr(rXml, 'type');
      const textAttr = getAttr(rXml, 'text');
      const fM = rXml.match(/<formula>([\s\S]*?)<\/formula>/i);
      const formula = fM ? decodeXmlEntities(fM[1]) : '';
      cfRules.push({ ranges, type, textAttr, formula, dxf });
    }
  }

  const rowMap = new Map();
  const rowHeights = {};
  let maxNonEmptyRow = 0;
  let maxNonEmptyCol = 0;

  const rowBlocks = sheetXml.match(/<row\b[^>]*?(?:\/>|>[\s\S]*?<\/row>)/gi) || [];
  for (const rXml of rowBlocks) {
    const rOpen = rXml.match(/^<row\b[^>]*>/i)[0];
    const rNum = parseInt(getAttr(rOpen, 'r') || '0', 10);
    if (!rNum) continue;
    if (getAttr(rOpen, 'hidden') === '1') {
      rowHeights[rNum] = 0;
      continue;
    }
    const ht = getAttr(rOpen, 'ht');
    if (ht) rowHeights[rNum] = parseFloat(ht);

    const cellMap = new Map();
    const cBlocks = rXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/gi) || [];
    for (const cXml of cBlocks) {
      const cOpen = cXml.match(/^<c\b[^>]*>/i)[0];
      const ref = getAttr(cOpen, 'r');
      const coord = parseCellRef(ref);
      if (!coord) continue;
      const cNum = coord.col;
      const sIdx = parseInt(getAttr(cOpen, 's') || '0', 10);
      const t = getAttr(cOpen, 't') || '';
      const vM = cXml.match(/<v>([\s\S]*?)<\/v>/i);
      const fM = cXml.match(/<f(?:\s+[^>]*)?>([\s\S]*?)<\/f>/i);
      const isM = cXml.match(/<is>([\s\S]*?)<\/is>/i);

      const rawV = vM ? decodeXmlEntities(vM[1]) : null;
      const formula = fM ? decodeXmlEntities(fM[1]) : null;

      cellMap.set(cNum, {
        r: rNum,
        c: cNum,
        sIdx,
        t,
        rawV,
        formula,
        inlineXml: isM ? isM[1] : null
      });
    }
    rowMap.set(rNum, cellMap);
  }

  const colHeaders = {};
  for (let r = 1; r <= 5; r++) {
    const cMap = rowMap.get(r);
    if (!cMap) continue;
    for (const [cNum, cell] of cMap.entries()) {
      let txt = '';
      if (cell.t === 's' && cell.rawV !== null) {
        const sst = sharedStrings[parseInt(cell.rawV, 10)];
        txt = sst ? sst.rawText : '';
      } else if (cell.rawV !== null) {
        txt = cell.rawV;
      }
      if (txt) {
        colHeaders[cNum] = (colHeaders[cNum] ? colHeaders[cNum] + ' ' : '') + txt;
      }
    }
  }

  const resolvedCells = new Map();
  for (const [rNum, cMap] of rowMap.entries()) {
    for (const [cNum, cell] of cMap.entries()) {
      const xf = styles.cellXfs[cell.sIdx] || styles.cellXfs[0];
      let text = '';
      let isCurrency = false;
      let isNumeric = false;
      let rawNum = null;

      if (cell.t === 's' && cell.rawV !== null) {
        const sst = sharedStrings[parseInt(cell.rawV, 10)];
        if (sst) {
          text = sst.isRich
            ? KrutiDevConverter.convertRichRuns(sst.runs, xf?.font?.name)
            : KrutiDevConverter.convertTextSmart(sst.rawText, xf?.font?.isKruti);
        }
      } else if (cell.t === 'inlineStr' && cell.inlineXml) {
        const parsed = parseRichOrPlainSi(cell.inlineXml);
        text = parsed.isRich
          ? KrutiDevConverter.convertRichRuns(parsed.runs, xf?.font?.name)
          : KrutiDevConverter.convertTextSmart(parsed.rawText, xf?.font?.isKruti);
      } else if (cell.rawV !== null) {
        const fmtRes = formatCellValue(
          cell.rawV,
          cell.t,
          cell.formula,
          xf,
          sheetMeta.name,
          colHeaders[cNum]
        );
        isCurrency = fmtRes.isCurrency;
        isNumeric = fmtRes.isNumeric;
        rawNum = fmtRes.rawNum ?? null;
        text = KrutiDevConverter.convertTextSmart(fmtRes.text, xf?.font?.isKruti);
      }

      if (text !== '' && text !== null) {
        if (rNum > maxNonEmptyRow) maxNonEmptyRow = rNum;
        if (cNum > maxNonEmptyCol) maxNonEmptyCol = cNum;
      }

      resolvedCells.set(`${rNum},${cNum}`, {
        r: rNum,
        c: cNum,
        text,
        isCurrency,
        isNumeric,
        rawNum,
        xf
      });
    }
  }

  for (let r = 1; r <= maxNonEmptyRow; r++) {
    let c = 1;
    while (c <= maxNonEmptyCol) {
      const cell = resolvedCells.get(`${r},${c}`);
      if (cell && cell.xf?.align?.h === 'centerContinuous' && cell.text !== '' && cell.text !== '0') {
        let endC = c;
        while (endC + 1 <= maxNonEmptyCol) {
          const nextCell = resolvedCells.get(`${r},${endC + 1}`);
          if (
            nextCell &&
            nextCell.xf?.align?.h === 'centerContinuous' &&
            (nextCell.text === '' || nextCell.text === '0')
          ) {
            nextCell.text = '';
            endC++;
          } else {
            break;
          }
        }
        if (endC > c) {
          merges.push({ r1: r, c1: c, r2: r, c2: endC });
          c = endC + 1;
          continue;
        }
      }
      c++;
    }
  }

  let rStart = 1;
  let cStart = 1;
  let rEnd = maxNonEmptyRow || 1;
  let cEnd = maxNonEmptyCol || 1;

  if (sheetMeta.printArea) {
    rStart = sheetMeta.printArea.r1;
    cStart = sheetMeta.printArea.c1;
    rEnd = Math.min(sheetMeta.printArea.r2, Math.max(maxNonEmptyRow, sheetMeta.printArea.r1));
    cEnd = Math.min(sheetMeta.printArea.c2, Math.max(maxNonEmptyCol, sheetMeta.printArea.c1));
  }

  const activeMerges = [];
  for (const m of merges) {
    if (m.r1 <= rEnd && m.r2 >= rStart && m.c1 <= cEnd + 4) {
      activeMerges.push(m);
      if (m.c2 > cEnd && m.r1 <= maxNonEmptyRow) {
        cEnd = Math.max(cEnd, m.c2);
      }
    }
  }

  const mergeOwnerMap = new Map();
  for (const m of activeMerges) {
    for (let rr = m.r1; rr <= m.r2; rr++) {
      for (let cc = m.c1; cc <= m.c2; cc++) {
        mergeOwnerMap.set(`${rr},${cc}`, {
          ...m,
          isOrigin: rr === m.r1 && cc === m.c1
        });
      }
    }
  }

  function getConditionalStyle(r, c, cellText, isNumeric, rawNum) {
    let bg = null;
    let color = null;
    const t = String(cellText || '').trim();

    for (const rule of cfRules) {
      const inRange = rule.ranges.some((rg) => r >= rg.r1 && r <= rg.r2 && c >= rg.c1 && c <= rg.c2);
      if (!inRange) continue;
      if (rule.type === 'containsText' && rule.textAttr && rule.textAttr.toLowerCase() !== 'done' && t.includes(rule.textAttr)) {
        bg = bg || rule.dxf.bg;
        color = color || rule.dxf.color;
      } else if (rule.formula) {
        const qMatch = rule.formula.match(/"([^"]+)"/);
        if (qMatch && t.toLowerCase() === qMatch[1].toLowerCase()) {
          bg = bg || rule.dxf.bg;
          color = color || rule.dxf.color;
        }
      }
    }

    if (t === 'Pending At JTA') {
      bg = bg || '#E2C6D8';
    } else if (t === 'AS Due at VDO') {
      bg = bg || '#FF0000';
      color = '#FFFFFF';
    } else if (sheetMeta.name.toLowerCase().includes('ihhl data combine') && r >= 6) {
      const rowZoneCell = resolvedCells.get(`${r},${c + 1}`);
      const zoneTxt = rowZoneCell ? String(rowZoneCell.text).trim().toLowerCase() : '';
      if (zoneTxt.includes('green zone')) bg = bg || '#00B050';
      else if (zoneTxt.includes('yello zone') || zoneTxt.includes('yellow zone')) bg = bg || '#FFFF00';
      else if (zoneTxt.includes('red zone')) bg = bg || '#FF0000';
      else if (isNumeric && rawNum !== null && rawNum < 0) bg = bg || '#ED7D31';
    }

    return { bg, color };
  }

  const cols = [];
  for (let c = cStart; c <= cEnd; c++) {
    cols.push({
      col: c,
      width: colWidths[c] !== undefined ? colWidths[c] : 11
    });
  }

  const rows = [];
  for (let r = rStart; r <= rEnd; r++) {
    if (rowHeights[r] === 0) continue;
    const rowCells = [];
    for (let c = cStart; c <= cEnd; c++) {
      const mInfo = mergeOwnerMap.get(`${r},${c}`);
      if (mInfo && !mInfo.isOrigin) continue;

      const cell = resolvedCells.get(`${r},${c}`);
      const xf = cell?.xf || styles.cellXfs[0] || {};
      const text = cell ? cell.text : '';
      const rowspan = mInfo ? mInfo.r2 - mInfo.r1 + 1 : 1;
      const colspan = mInfo ? mInfo.c2 - mInfo.c1 + 1 : 1;

      let border = { ...(xf.border || {}) };
      if (mInfo) {
        const brCell = resolvedCells.get(`${mInfo.r2},${mInfo.c2}`);
        if (brCell?.xf?.border) {
          border.right = border.right || brCell.xf.border.right;
          border.bottom = border.bottom || brCell.xf.border.bottom;
        }
      }

      const cfStyle = getConditionalStyle(r, c, text, cell?.isNumeric, cell?.rawNum);
      const bg = cfStyle.bg || xf.fill?.bg || null;
      const color = cfStyle.color || xf.font?.color || '#000000';

      let hAlign = xf.align?.h || null;
      if (hAlign === 'centerContinuous') hAlign = 'center';
      if (!hAlign) {
        if (cell?.isCurrency) hAlign = 'right';
        else if (cell?.isNumeric) hAlign = 'center';
        else hAlign = 'left';
      }

      const cellData = { c, v: text };
      if (rowspan > 1) cellData.rs = rowspan;
      if (colspan > 1) cellData.cs = colspan;
      if (cell?.isCurrency) cellData.cur = 1;
      if (xf.font?.bold) cellData.b = 1;
      if (xf.font?.italic) cellData.i = 1;
      if (xf.font?.strike) cellData.st = 1;
      if (xf.font?.sz && xf.font.sz !== 11) cellData.sz = xf.font.sz;
      if (bg) cellData.bg = bg;
      if (color && color !== '#000000') cellData.fg = color;
      if (hAlign && hAlign !== 'left') cellData.al = hAlign;
      if (xf.align?.v && xf.align.v !== 'center') cellData.val = xf.align.v;
      if (xf.align?.wrap) cellData.w = 1;
      if (border.top || border.bottom || border.left || border.right) {
        cellData.bd = [
          border.top ? 1 : 0,
          border.right ? 1 : 0,
          border.bottom ? 1 : 0,
          border.left ? 1 : 0
        ];
      }

      rowCells.push(cellData);
    }

    rows.push({
      r,
      ht: rowHeights[r] || null,
      cells: rowCells
    });
  }

  return {
    name: sheetMeta.name,
    orientation: orientation === 'portrait' ? 'portrait' : 'landscape',
    scale,
    fitToPage,
    colCount: cols.length,
    rowCount: rows.length,
    cols,
    rows
  };
}

function formatISTDateForFilename(date = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(date.getTime() + istOffsetMs);
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = shifted.getUTCFullYear();
  return `SBM Report ${dd}-${mm}-${yyyy}`;
}

function parseBlockReportFromBuffer(buffer, targetSheetNames = BLOCK_REPORT_SHEETS) {
  const zipFiles = unzipBuffer(buffer);
  const workbookXml = zipFiles['xl/workbook.xml']?.toString('utf8');
  if (!workbookXml) {
    throw new Error('Invalid .xlsm/.xlsx file: xl/workbook.xml not found');
  }
  const relsXml = zipFiles['xl/_rels/workbook.xml.rels']?.toString('utf8') || '';
  const themeXml = zipFiles['xl/theme/theme1.xml']?.toString('utf8') || '';
  const stylesXml = zipFiles['xl/styles.xml']?.toString('utf8') || '';
  const sstXml = zipFiles['xl/sharedStrings.xml']?.toString('utf8') || '';

  const themeColors = parseThemeColors(themeXml);
  const styles = parseStylesXml(stylesXml, themeColors);
  const sharedStrings = parseSharedStrings(sstXml);
  const wbSheets = parseWorkbookXml(workbookXml, relsXml);

  let pdfName = '';
  const indexSheetMeta = wbSheets.find((s) => s.name.trim().toLowerCase() === 'sheet_index');
  if (indexSheetMeta && zipFiles[indexSheetMeta.path]) {
    const idxXml = zipFiles[indexSheetMeta.path].toString('utf8');
    pdfName = parseSingleCellValueFromSheetXml(idxXml, 'I2', sharedStrings, styles).trim();
  }
  if (!pdfName) {
    pdfName = formatISTDateForFilename();
  }
  pdfName = pdfName.replace(/\.pdf$/i, '').trim();

  const parsedSheets = [];
  const missingSheets = [];

  for (const requestedName of targetSheetNames) {
    const reqNorm = requestedName.trim().toLowerCase();
    const matchedMeta =
      wbSheets.find((s) => s.name.trim().toLowerCase() === reqNorm) ||
      wbSheets.find((s) => s.name.trim().toLowerCase().replace(/\s+/g, ' ') === reqNorm.replace(/\s+/g, ' '));

    if (!matchedMeta || !zipFiles[matchedMeta.path]) {
      missingSheets.push(requestedName);
      continue;
    }

    const sheetXml = zipFiles[matchedMeta.path].toString('utf8');
    const parsed = parseWorksheetFull(matchedMeta, sheetXml, sharedStrings, styles);
    parsed.requestedName = requestedName;
    parsedSheets.push(parsed);
  }

  return {
    pdfName,
    sheets: parsedSheets,
    foundSheetNames: parsedSheets.map((s) => s.name),
    missingSheets,
    sourceWorkbookSheetNames: wbSheets.map((s) => s.name)
  };
}

function toISTDisplay(date = new Date()) {
  return (
    date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST'
  );
}

async function buildBlockReportSnapshot(existingBuffer = null) {
  let buffer = existingBuffer;
  if (!buffer) {
    let staticDataMod;
    try {
      staticDataMod = require('./build-static-data');
    } catch (_) {
      staticDataMod = require('./build_static_data');
    }
    buffer = await staticDataMod.downloadGoogleDriveWorkbook();
  }

  const { pdfName, sheets, foundSheetNames, missingSheets, sourceWorkbookSheetNames } =
    parseBlockReportFromBuffer(buffer, BLOCK_REPORT_SHEETS);

  const now = new Date();
  const version = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);

  const payload = {
    success: true,
    pdfName,
    requestedSheets: BLOCK_REPORT_SHEETS,
    foundSheetNames,
    missingSheets,
    sheets,
    meta: {
      version,
      fetchedAt: now.toISOString(),
      lastUpdatedDisplay: toISTDisplay(now),
      totalSheetsRequested: BLOCK_REPORT_SHEETS.length,
      totalSheetsFound: sheets.length,
      sourceWorkbookSheetNames
    }
  };

  return { payload, buffer };
}

async function writeBlockReportToDisk(payload) {
  await fs.mkdir(BLOCK_OUTPUT_DIR, { recursive: true });
  const json = JSON.stringify(payload);
  await fs.writeFile(BLOCK_OUTPUT_FILE, json, 'utf8');
  return json;
}

async function main() {
  console.log('📊 Building Block Report snapshot (14 sheets from VBA SaveSheetsAsPDF)...');
  const { payload } = await buildBlockReportSnapshot();
  const json = await writeBlockReportToDisk(payload);
  const sizeMb = (Buffer.byteLength(json) / (1024 * 1024)).toFixed(2);
  console.log(`✅ Block Report written: ${BLOCK_OUTPUT_FILE} (${sizeMb} MB)`);
  console.log(`   PDF Name (Sheet_Index!I2): ${payload.pdfName}.pdf`);
  console.log(`   Sheets extracted (${payload.sheets.length}/${BLOCK_REPORT_SHEETS.length}): ${payload.foundSheetNames.join(', ')}`);
  if (payload.missingSheets.length) {
    console.warn(`   ⚠️ Missing sheets: ${payload.missingSheets.join(', ')}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ build-block-report.js failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  BLOCK_REPORT_SHEETS,
  BLOCK_OUTPUT_FILE,
  BLOCK_OUTPUT_DIR,
  parseBlockReportFromBuffer,
  buildBlockReportSnapshot,
  writeBlockReportToDisk
};
