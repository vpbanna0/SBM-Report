;(function (root) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
     PART 1: Kruti Dev (010/011/016) & DevLys (010/020) → Unicode Converter
  ═══════════════════════════════════════════════════════════════════════════ */
  const ARRAY_ONE = [
    'ñ', 'Q+Z', 'sas', 'aa', ')Z', 'ZZ', '‘', '’', '“', '”',
    'å', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹',
    '¶+', 'd+', '[+k', '[+', 'x+', 'T+', 't+', 'M+', '<+', 'Q+', ';+', 'j+', 'u+',
    'Ùk', 'Ù', 'ä', '–', '—', 'é', '™', '=kk', 'f=k',
    'à', 'á', 'â', 'ã', 'ºz', 'º', 'í', '{k', '{', '=', '«',
    'Nî', 'Vî', 'Bî', 'Mî', '<î', '|', 'K', '}',
    'J', 'Vª', 'Mª', '<ªª', 'Nª', 'Ø', 'Ý', 'nzZ', 'æ', 'ç', 'Á', 'xz', '#', ':',
    'v‚', 'vkW', 'vks', 'vkS', 'vk', 'v', 'b±', 'Ã', 'bZ', 'b', 'm', 'Å', ',s', ',', '_',
    'ô', 'd', 'Dk', 'D', '[k', '[', 'x', 'Xk', 'X', '?k', '?', '³',
    'pkS', 'p', 'Pk', 'P', 'N', 't', 'Tk', 'T', '>', '÷', '¥',
    'ê', 'ë', 'V', 'B', 'ì', 'ï', 'M+', '<+', 'M', '<', '.k', '.',
    'r', 'Rk', 'R', 'Fk', 'F', ')', 'n', '/k', 'धk', '/', 'Ë', 'è', 'u', 'Uk', 'U',
    'i', 'Ik', 'I', 'Q', '¶', 'c', 'Ck', 'C', 'Hk', 'H', 'e', 'Ek', 'E',
    ';', '¸', 'j', 'y', 'Yk', 'Y', 'G', 'o', 'Ok', 'O',
    "'k", "'", '"k', '"', 'l', 'Lk', 'L', 'g',
    'È', 'z',
    'Ì', 'Í', 'Î', 'Ï', 'Ñ', 'Ò', 'Ó', 'Ô', 'Ö', 'Ø', 'Ù', 'Ük', 'Ü',
    '‚', 'kW', 'ks', 'kS', 'k', 'h', 'q', 'w', '`', 's', 'S',
    'a', '¡', '%', 'W', '•', '·', '∙', '·', '~j', '~', '\\', '+', ' ः',
    '^', '*', 'Þ', 'ß', '(', '¼', '½', '¿', 'À', '¾', 'A', '-', '&', '&', 'Œ', ']', '~ ', '@'
  ];

  const ARRAY_TWO = [
    '॰', 'QZ+', 'sa', 'a', 'र्द्ध', 'Z', '"', '"', "'", "'",
    '०', '१', '२', '३', '४', '५', '६', '७', '८', '९',
    'फ़्', 'क़', 'ख़', 'ख़्', 'ग़', 'ज़्', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऱ', 'ऩ',
    'त्त', 'त्त्', 'क्त', 'दृ', 'कृ', 'न्न', 'न्न्', '=k', 'f=',
    'ह्न', 'ह्य', 'हृ', 'ह्म', 'ह्र', 'ह्', 'द्द', 'क्ष', 'क्ष्', 'त्र', 'त्र्',
    'छ्य', 'ट्य', 'ठ्य', 'ड्य', 'ढ्य', 'द्य', 'ज्ञ', 'द्व',
    'श्र', 'ट्र', 'ड्र', 'ढ्र', 'छ्र', 'क्र', 'फ्र', 'र्द्र', 'द्र', 'प्र', 'प्र', 'ग्र', 'रु', 'रू',
    'ऑ', 'ऑ', 'ओ', 'औ', 'आ', 'अ', 'ईं', 'ई', 'ई', 'इ', 'उ', 'ऊ', 'ऐ', 'ए', 'ऋ',
    'क्क', 'क', 'क', 'क्', 'ख', 'ख्', 'ग', 'ग', 'ग्', 'घ', 'घ्', 'ङ',
    'चौ', 'च', 'च', 'च्', 'छ', 'ज', 'ज', 'ज्', 'झ', 'झ्', 'ञ',
    'ट्ट', 'ट्ठ', 'ट', 'ठ', 'ड्ड', 'ड्ढ', 'ड़', 'ढ़', 'ड', 'ढ', 'ण', 'ण्',
    'त', 'त', 'त्', 'थ', 'थ्', 'द्ध', 'द', 'ध', 'ध', 'ध्', 'ध्', 'ध्', 'न', 'न', 'न्',
    'प', 'प', 'प्', 'फ', 'फ्', 'ब', 'ब', 'ब्', 'भ', 'भ्', 'म', 'म', 'म्',
    'य', 'य्', 'र', 'ल', 'ल', 'ल्', 'ळ', 'व', 'व', 'व्',
    'श', 'श्', 'ष', 'ष्', 'स', 'स', 'स्', 'ह',
    'ीं', '्र',
    'द्द', 'ट्ट', 'ट्ठ', 'ड्ड', 'कृ', 'भ', '्य', 'ड्ढ', 'झ्', 'क्र', 'त्त्', 'श', 'श्',
    'ॉ', 'ॉ', 'ो', 'ौ', 'ा', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै',
    'ं', 'ँ', 'ः', 'ॅ', 'ऽ', 'ऽ', 'ऽ', 'ऽ', '्र', '्', '?', '़', ':',
    '‘', '’', '“', '”', ';', '(', ')', '{', '}', '=', '।', '.', '-', 'µ', '॰', ',', '् ', '/'
  ];

  const KNOWN_ENGLISH_WORDS = new Set([
    'nlb', 'ihhl', 'to', 'new', 'consolidate', 'consolidated', 'report', 'success',
    'pending', 'at', 'jta', 'as', 'due', 'vdo', 'land', 'allotment', 'work', 'ts', 'fs',
    'sbm', 'odf', 'plus', 'csc', 'rrc', 'aip', 'gp', 'ps', 'uc', 'bpl', 'apl', 'lwm', 'swm',
    'ffc', 'nrega', 'green', 'yello', 'yellow', 'red', 'zone', 'zones', 'total', 'sr', 'no',
    'sno', 'target', 'sanctioned', 'geo', 'tagged', 'tag', 'paid', 'payment', 'percantage',
    'percentage', 'aspiring', 'rising', 'model', 'village', 'door', 'collection', 'year',
    'complete', 'completed', 'geotagged', 'sanction', 'issued', 'cancelled', 'not', 'start',
    'in', 'progress', 'plinth', 'level', 'lintle', 'lintel', 'roof', 'final', 'form',
    'propsal', 'proposal', 'sent', 'sdm', 'office', 'allotted', 'under', 'construction',
    'head', 'name', 'of', 'physical', 'status', 'financial', 'expenditure', 'from', 'average',
    'block', 'overall', 'achievement', 'date', 'tendor', 'tender', 'open', 'firm', 'rate',
    'owner', 'mobile', 'order', 'timeline', 'amount', 'yes', 'soak', 'pit', 'compost',
    'individual', 'assest', 'asset', 'combine', 'category', 'done', 'offline', 'online',
    'bsr', 'cancel', 'deogarh', 'rajsamand',
    'april', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]);

  function looksLikeKrutiDev(text) {
    if (text == null) return false;
    const s = String(text).trim();
    if (!s) return false;
    const hasDevanagari = /[\u0900-\u097F]/.test(s);
    if (/[Øç¼½±ÆÇÉÊÙ]/.test(s)) return true;
    if (/fnukad|iapk;r|xzke|'kkSpky;|fuekZ\.k|LoPN|fjiksVZ|lfefr|nsox<\+|jktleUn|;ksx|Hkqxrku|fcykuke|vkaxuokM|lkeqnkf;d|ekWfuVfjax|dkWih|vkWuykbZu/.test(s)) {
      return true;
    }
    if (hasDevanagari) return false;
    const krutiTokens = [
      /\b(ds|dk|dh|esa|ls|ij|gS|gSa|ugha|rFkk|,oa|Jh|xzke|iapk;r|dk;Z|lfefr|ftyk|fodkl|LoPN|Hkkjr|fe'ku|çxfr|fjiksVZ|fnukad|;ksx|dqy|y\{;|Loh—r|Hkqxrku|fcykuke|dkWih|vkWuykbZu|odZ|vkWMZj|Vs\.Mj)\b/,
      /[a-zA-Z]\+[a-zA-Z]?/,
      /[a-zA-Z];[a-zA-Z]/,
      /'kk|"kk|ksM\+|kSM\+|pkS|fd;k|x;k|tkjh|orZeku/
    ];
    return krutiTokens.some((re) => re.test(s));
  }

  function rawKrutiToUnicode(input) {
    if (input == null || input === '') return '';
    let modified = String(input);

    for (let i = 0; i < ARRAY_ONE.length; i++) {
      const from = ARRAY_ONE[i];
      const to = ARRAY_TWO[i];
      let idx = modified.indexOf(from);
      while (idx !== -1) {
        modified = modified.replace(from, to);
        idx = modified.indexOf(from);
      }
    }

    modified = modified.replace(/±/g, 'Zं');
    modified = modified.replace(/Æ/g, 'र्f');

    let posI = modified.indexOf('f');
    while (posI !== -1) {
      const nextChar = modified.charAt(posI + 1);
      if (!nextChar) break;
      modified = modified.replace('f' + nextChar, nextChar + 'ि');
      posI = modified.indexOf('f', posI + 1);
    }

    modified = modified.replace(/Ç/g, 'fa');
    modified = modified.replace(/É/g, 'र्fa');

    posI = modified.indexOf('fa');
    while (posI !== -1) {
      const nextChar = modified.charAt(posI + 2);
      if (!nextChar) break;
      modified = modified.replace('fa' + nextChar, nextChar + 'िं');
      posI = modified.indexOf('fa', posI + 2);
    }

    modified = modified.replace(/Ê/g, 'ीZ');

    let posWrongEe = modified.indexOf('ि्');
    while (posWrongEe !== -1) {
      const consNext = modified.charAt(posWrongEe + 2);
      if (!consNext) break;
      modified = modified.replace('ि्' + consNext, '्' + consNext + 'ि');
      posWrongEe = modified.indexOf('ि्', posWrongEe + 2);
    }

    const matras = 'अ आ इ ई उ ऊ ए ऐ ओ औ ऑ ा ि ी ु ू ृ े ै ो ौ ॉ ं : ँ ॅ';
    let posR = modified.indexOf('Z');
    let safety = 0;
    while (posR > 0 && safety < 500) {
      safety++;
      let probPos = posR - 1;
      let ch = modified.charAt(probPos);
      while (probPos > 0 && matras.indexOf(ch) !== -1) {
        probPos -= 1;
        ch = modified.charAt(probPos);
      }
      while (probPos >= 2 && modified.charAt(probPos - 1) === '्') {
        probPos -= 2;
      }
      const target = modified.substring(probPos, posR);
      modified =
        modified.substring(0, probPos) +
        'र्' +
        target +
        modified.substring(posR + 1);
      posR = modified.indexOf('Z');
    }

    modified = modified.replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    modified = modified.replace(/दिनांक:-/g, 'दिनांक :-');
    return modified;
  }

  function isPureEnglishOrCodeToken(token) {
    const t = token.trim();
    if (!t) return true;
    if (/^[₹$0-9.,%+\-*/()=\s:]+$/.test(t)) return true;
    if (/^(Work|AS|TS|FS|SPL|Spl)\s*[/\-]\s*[0-9]/i.test(t)) return true;
    const clean = t.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
    if (clean && KNOWN_ENGLISH_WORDS.has(clean) && !/[;+Øç¼½]/.test(t)) {
      return true;
    }
    return false;
  }

  function convertTextSmart(text, forceKruti = false) {
    if (text == null || text === '') return '';
    if (typeof text === 'number' || typeof text === 'boolean') return String(text);

    const str = String(text).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    if (/^[\d\s.,%+\-*/():₹]+$/.test(str.trim())) return str;
    if (/^(Work|AS|TS|FS|SPL|Spl)\s*[/\-]\s*\d/i.test(str.trim())) return str;
    if (/^(Pending At JTA|Pending At VDO|AS Due at VDO|Land Allotment Due|Complete|Work In Progress|Cancelled|Not Start|Plinth Level|Lintle Level|Roof Level|Done|Due|Yes|No|Total|TOTAL|Green Zone|Yello Zone|Yellow Zone|Red Zone|BSR|AS Due|TS Due|No Target)$/i.test(str.trim())) {
      return str;
    }

    const shouldConvert = forceKruti || looksLikeKrutiDev(str);
    if (!shouldConvert) return str;

    return str
      .split(/\r?\n/)
      .map((line) => {
        if (!line.trim()) return line;
        const parts = line.match(/\S+|\s+/g) || [line];
        const segments = [];
        for (const part of parts) {
          if (/^\s+$/.test(part)) {
            if (segments.length > 0) {
              segments[segments.length - 1].text += part;
            } else {
              segments.push({ isEng: true, text: part });
            }
            continue;
          }
          const isEng = isPureEnglishOrCodeToken(part);
          if (segments.length > 0 && segments[segments.length - 1].isEng === isEng) {
            segments[segments.length - 1].text += part;
          } else {
            segments.push({ isEng, text: part });
          }
        }
        return segments
          .map((seg) => (seg.isEng ? seg.text : rawKrutiToUnicode(seg.text)))
          .join('');
      })
      .join('\n');
  }

  if (!root.KrutiDevConverter) {
    root.KrutiDevConverter = {
      looksLikeKrutiDev,
      rawKrutiToUnicode,
      convertTextSmart
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PART 2: 14-Sheet / 19-Page Excel VBA Block Report Renderer & PDF Exporter
     (Enhanced High-Contrast "Chamak" Edition: 300+ DPI PNG + Stem Darkening)
  ═══════════════════════════════════════════════════════════════════════════ */
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

  const PX_PER_WCH = 7.5;
  const PX_PER_PT = 1.3333;

  let blockPayload = null;
  let activeSheetFilter = 'ALL';
  let isExportingPdf = false;

  function ensureBlockPrintStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('block-report-container') && !document.getElementById('gpsel')) {
      document.querySelectorAll('link[rel="stylesheet"]').forEach((lnk) => {
        const href = lnk.getAttribute('href') || '';
        if (href.includes('style.css')) {
          lnk.disabled = true;
          if (lnk.parentNode) lnk.parentNode.removeChild(lnk);
        }
      });
    }
    let style = document.getElementById('block-report-auto-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'block-report-auto-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
  @page {
    size: letter landscape;
    margin: 12mm 14mm;
  }
  @page block-portrait {
    size: letter portrait;
    margin: 15mm 16mm;
  }
  @page block-landscape {
    size: letter landscape;
    margin: 12mm 14mm;
  }

  .excel-print-page {
    background: #ffffff;
    color: #000000;
    font-family: 'Calibri', 'Noto Sans Devanagari', 'Arial', sans-serif;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  .excel-sheet-tbl {
    border-collapse: collapse;
    table-layout: fixed;
    background: #ffffff;
    color: #000000;
    border: none !important;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .excel-sheet-tbl td, .excel-sheet-tbl th {
    padding: 1px 3px;
    line-height: 1.15;
    word-break: normal;
    overflow-wrap: break-word;
    color: #000000;
    font-family: 'Calibri', 'Noto Sans Devanagari', 'Arial', sans-serif;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  .excel-sheet-tbl td.nowrap-cell {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
  }
  .excel-acct-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 4px;
    white-space: nowrap;
    padding: 0 2px;
  }
  .excel-acct-cell .rupee-sym { font-weight: 600; }
  .excel-acct-cell .rupee-val { text-align: right; margin-left: auto; }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
    }
    .no-print, .header, .upload-bar, .status-bar, .gp-bar, .action-buttons, .sheet-tabs-bar, .block-sheet-bar, .pdf-modal, .print-header, #debug-panel {
      display: none !important;
    }
    .container, .content, #block-report-container, .block-sheet-section {
      max-width: none !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: visible !important;
    }
    .excel-page-card {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
      background: #ffffff !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
      page-break-after: always !important;
      break-after: page !important;
    }
    .excel-page-card.portrait {
      page: block-portrait !important;
    }
    .excel-page-card.landscape {
      page: block-landscape !important;
    }
    .block-sheet-section:last-of-type .excel-page-card:last-of-type {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  }
`;
  }

  function escHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function ensureUnicodeText(text, forceKruti = false) {
    if (text === null || text === undefined || text === '') return '';
    let s = String(text).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    return convertTextSmart(s, forceKruti).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
  }

  function normalizePayloadForExcelVba(payload) {
    if (!payload || !Array.isArray(payload.sheets)) return payload;

    let reportDateShort = '06-Nov-2026';
    const sumSheet = payload.sheets.find((s) => s.name && s.name.trim().toLowerCase() === 'summary');
    if (sumSheet && Array.isArray(sumSheet.rows)) {
      for (const r of sumSheet.rows) {
        for (const c of r.cells || []) {
          if (c.v && /^\d{2}\s+[A-Za-z]+\s+\d{4}$/.test(String(c.v).trim())) {
            const parts = String(c.v).trim().split(/\s+/);
            if (parts.length === 3) {
              reportDateShort = `${parts[0]}-${parts[1].slice(0, 3)}-${parts[2]}`;
            }
          }
        }
      }
    }

    for (const s of payload.sheets) {
      const sName = (s.name || '').trim().toLowerCase();
      const isRightNumSheet =
        sName.startsWith('csc ') ||
        sName.includes('target aip') ||
        sName.includes('financial');

      const rows = s.rows || [];
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const cells = row.cells || [];
        const gridCellCount = cells.filter(
          (c) => (c.bd && c.bd[0] + c.bd[1] + c.bd[2] + c.bd[3] >= 2) || c.bg
        ).length;
        const isGridRow = gridCellCount >= 2;

        for (const c of cells) {
          if (sName === 'summary' && c.bg === '#D9E1F2') {
            c.bg = '#E4DFEC';
          }
          if (isGridRow) {
            c.bd = [1, 1, 1, 1];
          }
          if (c.fg && c.fg.toUpperCase() !== '#FFFFFF') {
            delete c.fg;
          }
          if (c.v && typeof c.v === 'string') {
            if (/Date\s*:\s*\S+/.test(c.v)) {
              c.v = c.v.replace(/Date\s*:\s*\S+/, `Date : ${reportDateShort}`);
            }
            if (sName.includes('ihhl data combine') && rIdx === 1 && c.c === 22 && /^\d{2}-\d{2}-\d{4}$/.test(c.v.trim())) {
              c.v = reportDateShort;
            }
          }
          const txt = String(c.v ?? '').trim();
          const isNum = /^-?[\d,]+(\.\d+)?$/.test(txt);
          if (isRightNumSheet && rIdx >= 2 && isNum && !c.cur && (!c.cs || c.cs === 1)) {
            c.al = 'right';
          }
        }
      }
    }
    return payload;
  }

  const EMBEDDED_BLOCK_REPORT_GZ_B64 = "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";

  async function decodeEmbeddedBlockReport() {
    if (!EMBEDDED_BLOCK_REPORT_GZ_B64 || typeof DecompressionStream === 'undefined') return null;
    try {
      const binStr = atob(EMBEDDED_BLOCK_REPORT_GZ_B64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const text = await new Response(ds.readable).text();
      return JSON.parse(text);
    } catch (e) {
      console.warn('Embedded fallback decode warning:', e);
      return null;
    }
  }

  async function loadBlockReportData(forceServerRefresh = false) {
    if (forceServerRefresh) {
      try {
        await fetch('/api/refresh', { method: 'POST' });
      } catch (_) {}
    }
    const candidateUrls = [
      `data/block-report.json?t=${Date.now()}`,
      `./data/block-report.json?t=${Date.now()}`,
      `/SBM-Report/data/block-report.json?t=${Date.now()}`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success === true && Array.isArray(data.sheets)) {
            blockPayload = normalizePayloadForExcelVba(data);
            return blockPayload;
          }
        }
      } catch (_) {}
    }
    const embedded = await decodeEmbeddedBlockReport();
    if (embedded && embedded.success === true) {
      blockPayload = normalizePayloadForExcelVba(embedded);
      return blockPayload;
    }
    throw new Error('block-report.json लोड नहीं हो सका');
  }

  function isTotalRow(row) {
    if (!row || !Array.isArray(row.cells)) return false;
    for (let i = 0; i < Math.min(row.cells.length, 4); i++) {
      const txt = ensureUnicodeText(row.cells[i].v || '').trim();
      if (/^(total|योग|कुल योग)$/i.test(txt)) {
        return true;
      }
    }
    return false;
  }

  function isRowEmpty(row) {
    if (!row || !Array.isArray(row.cells)) return true;
    return row.cells.every((c) => (!c.v || String(c.v).trim() === '') && !c.bd && !c.bg);
  }

  function splitSheetIntoPrintPages(sheet) {
    const rows = sheet.rows || [];
    if (rows.length === 0) return [];

    const nameNorm = sheet.name.trim().toLowerCase();

    if (nameNorm === 'summary') {
      let splitIdx = rows.findIndex((r) =>
        (r.cells || []).some((c) => String(c.v || '').includes('2024-25') && String(c.v || '').includes('CSC'))
      );
      if (splitIdx === -1) {
        splitIdx = rows.findIndex((r) => r.r >= 31);
      }
      if (splitIdx > 0) {
        let p1End = splitIdx;
        while (p1End > 1 && isRowEmpty(rows[p1End - 1])) {
          p1End--;
        }
        const page1Rows = rows.slice(0, p1End);
        const page2Rows = rows.slice(splitIdx);
        return [
          {
            sheetName: sheet.name,
            pagePart: 1,
            totalParts: 2,
            orientation: 'portrait',
            cols: sheet.cols,
            rows: page1Rows
          },
          {
            sheetName: sheet.name,
            pagePart: 2,
            totalParts: 2,
            orientation: 'portrait',
            cols: sheet.cols,
            rows: page2Rows
          }
        ];
      }
      return [
        {
          sheetName: sheet.name,
          pagePart: 1,
          totalParts: 1,
          orientation: 'portrait',
          cols: sheet.cols,
          rows
        }
      ];
    }

    const orientation = sheet.orientation === 'portrait' ? 'portrait' : 'landscape';

    const tableBlocks = [];
    let blockStart = 0;

    for (let i = 0; i < rows.length; i++) {
      if (i - blockStart >= 8 && isTotalRow(rows[i])) {
        const remainingNonEmpty = rows.slice(i + 1).filter((r) => !isRowEmpty(r)).length;
        if (remainingNonEmpty >= 5) {
          tableBlocks.push(rows.slice(blockStart, i + 1));
          let nextStart = i + 1;
          while (nextStart < rows.length && isRowEmpty(rows[nextStart])) {
            nextStart++;
          }
          blockStart = nextStart;
          i = nextStart - 1;
        }
      }
    }

    if (tableBlocks.length > 0) {
      if (blockStart < rows.length) {
        const tail = rows.slice(blockStart).filter((r, idx, arr) => !(idx === arr.length - 1 && isRowEmpty(r)));
        if (tail.length > 0) tableBlocks.push(tail);
      }
      return tableBlocks.map((blockRows, idx) => ({
        sheetName: sheet.name,
        pagePart: idx + 1,
        totalParts: tableBlocks.length,
        orientation,
        cols: sheet.cols,
        rows: blockRows
      }));
    }

    return [
      {
        sheetName: sheet.name,
        pagePart: 1,
        totalParts: 1,
        orientation,
        cols: sheet.cols,
        rows
      }
    ];
  }

  function getPageRenderMetrics(page) {
    const cols = page.cols || [];
    const totalExcelWidth = cols.reduce((acc, c) => acc + Math.max(c.width || 10, 4), 0) || 100;
    const captureWidthPx = Math.round(totalExcelWidth * PX_PER_WCH);
    const sLower = (page.sheetName || '').trim().toLowerCase();

    if (sLower === 'summary' || page.orientation === 'portrait') {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: page.pagePart === 2 ? 26.1 : 21.3,
        targetWidthMm: 179.8,
        maxHeightMm: 238.0,
        effScale: 0.98,
        screenZoom: 1.0
      };
    }

    if (sLower === 'odf plus') {
      return {
        captureWidthPx,
        leftMm: 33.0,
        topMm: 20.3,
        targetWidthMm: 226.8,
        maxHeightMm: 175.0,
        effScale: 0.97,
        screenZoom: 0.96
      };
    }

    if (sLower.startsWith('csc ')) {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: 19.8,
        targetWidthMm: 242.7,
        maxHeightMm: 176.0,
        effScale: 0.77,
        screenZoom: 0.88
      };
    }

    if (sLower.includes('rrc')) {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: 20.0,
        targetWidthMm: 240.4,
        maxHeightMm: 176.0,
        effScale: 0.625,
        screenZoom: 0.78
      };
    }

    if (sLower.includes('ihhl data combine')) {
      return {
        captureWidthPx,
        leftMm: 6.5,
        topMm: 19.8,
        targetWidthMm: 266.5,
        maxHeightMm: 176.0,
        effScale: 0.425,
        screenZoom: 0.54
      };
    }

    if (sLower.includes('tender')) {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: 19.3,
        targetWidthMm: 243.5,
        maxHeightMm: 176.0,
        effScale: 0.532,
        screenZoom: 0.68
      };
    }

    if (sLower.includes('target aip')) {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: 20.0,
        targetWidthMm: 241.0,
        maxHeightMm: 176.0,
        effScale: 0.652,
        screenZoom: 0.82
      };
    }

    if (sLower.includes('financial')) {
      return {
        captureWidthPx,
        leftMm: 17.8,
        topMm: 29.7,
        targetWidthMm: 232.9,
        maxHeightMm: 165.0,
        effScale: 0.492,
        screenZoom: 0.66
      };
    }

    return {
      captureWidthPx,
      leftMm: 17.7,
      topMm: 30.3,
      targetWidthMm: 231.6,
      maxHeightMm: 165.0,
      effScale: 1.245,
      screenZoom: 1.12
    };
  }

  function getRowDefaultPt(sheetLower, rIdx, row, isGridRow) {
    if (row.ht && row.ht > 0) return row.ht;
    if (sheetLower === 'odf plus' && (row.r === 3 || row.r === 4)) return 14;
    if (sheetLower.startsWith('csc ') && row.r === 2) return 14;
    if (sheetLower.includes('target aip') && (row.r === 1 || row.r === 2)) return 14;
    if (!isGridRow && rIdx === 0) return 18;
    return 15;
  }

  function computeCellFontPx(sheetLower, cell, rawText, isGridRow, rIdx) {
    const pt = cell.sz || 11;
    const hasDevanagari = /[\u0900-\u097F]/.test(rawText);

    if (sheetLower === 'summary') {
      if (pt >= 30) return 42;
      if (pt >= 15.5) return 19;
      if (pt >= 13.5) return 17.5;
      if (pt >= 11.8) return 15;
      return 14;
    }

    if (sheetLower.includes('rrc')) {
      if (pt >= 19) return 24;
      if (pt >= 15) return hasDevanagari ? 15.6 : 18;
      if (pt >= 13.5) return hasDevanagari ? 14.6 : 16.5;
      return 14.2;
    }

    if (sheetLower.includes('ihhl data combine')) {
      if (pt >= 25) return 31;
      if (pt >= 21) return 25;
      if (pt >= 19) return hasDevanagari ? 21 : 23.5;
      if (pt >= 17) return 21;
      if (pt >= 15) return hasDevanagari ? 17.2 : 19;
      if (pt >= 13.5) return 17;
      if (pt >= 12.5) return 15.5;
      return 14.5;
    }

    if (sheetLower.includes('tender')) {
      if (pt >= 20) return 27;
      if (!isGridRow && rIdx > 2) return 18;
      return hasDevanagari ? 16.2 : 18;
    }

    if (sheetLower.startsWith('csc ')) {
      if (pt >= 13.5 && hasDevanagari) return 16.2;
      if (pt >= 13.5) return 17.5;
      return 14.2;
    }

    if (sheetLower.includes('target aip') || sheetLower.includes('financial')) {
      if (pt >= 18) return 25;
      if (pt >= 13.5) return 17.5;
      if (pt <= 10.5) return 12.5;
      return 14;
    }

    if (pt >= 17) return 23;
    if (pt >= 13.5) return 18.5;
    if (pt <= 10.5) return hasDevanagari ? 12.4 : 13.2;
    return 14.2;
  }

  function buildPrintPageHtml(page, forPdfCapture = false) {
    const cols = page.cols || [];
    const colCount = cols.length || 1;
    const metrics = getPageRenderMetrics(page);
    const sheetLower = (page.sheetName || '').trim().toLowerCase();
    const isIhhlCombine = sheetLower.includes('ihhl data combine');
    const is7ColAssetSheet =
      colCount === 7 &&
      (sheetLower.includes('soak pit') || sheetLower.includes('compost pit') || sheetLower.includes('individual'));

    const colWidthsPx = cols.map((c) => Math.round(Math.max(c.width || 10, 4) * PX_PER_WCH));
    const tableWidthPx = colWidthsPx.reduce((a, b) => a + b, 0);

    // Scale-compensated border thickness so even 42% scaled sheets have razor-sharp jet-black borders in PDF
    const effScale = metrics.effScale || 1;
    const innerBorderPx = forPdfCapture
      ? Math.max(1.35, Math.round((1.22 / effScale) * 10) / 10)
      : 1.2;
    const outerBorderPx = forPdfCapture
      ? Math.max(2.0, Math.round(innerBorderPx * 1.55 * 10) / 10)
      : 1.85;

    const rows = page.rows || [];
    const rowIsGrid = rows.map((row) => {
      if (isRowEmpty(row)) return false;
      const cells = row.cells || [];
      const cnt = cells.filter(
        (c) => (c.bd && c.bd[0] + c.bd[1] + c.bd[2] + c.bd[3] >= 2) || c.bg
      ).length;
      return cnt >= 2;
    });

    const rowHeightsPx = rows.map((row, rIdx) => {
      const pt = getRowDefaultPt(sheetLower, rIdx, row, rowIsGrid[rIdx]);
      return Math.round(pt * PX_PER_PT);
    });

    const pageZoomStyle = !forPdfCapture && metrics.screenZoom && metrics.screenZoom !== 1
      ? `zoom:${metrics.screenZoom};`
      : '';

    let html = `<div class="excel-print-page ${page.orientation} ${forPdfCapture ? 'pdf-capture-mode' : ''}" data-sheet="${escHtml(page.sheetName)}" data-orientation="${page.orientation}" style="${pageZoomStyle}">`;
    html += `<table class="excel-sheet-tbl" style="width:${tableWidthPx}px;min-width:${tableWidthPx}px;max-width:${tableWidthPx}px;border:none !important">`;
    html += `<colgroup>`;
    for (const wPx of colWidthsPx) {
      html += `<col style="width:${wPx}px">`;
    }
    html += `</colgroup><tbody>`;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const rawCells = row.cells || [];
      const rowHtPx = rowHeightsPx[rIdx];
      const isGrid = rowIsGrid[rIdx];
      const prevIsGrid = rIdx > 0 ? rowIsGrid[rIdx - 1] : false;
      const nextIsGrid = rIdx + 1 < rows.length ? rowIsGrid[rIdx + 1] : false;
      const isTopOfBlock = isGrid && !prevIsGrid;

      if (isRowEmpty(row)) {
        html += `<tr class="excel-spacer-row" style="height:${rowHtPx}px"><td colspan="${colCount}" style="border:none !important;padding:0 !important;background:transparent !important;height:${rowHtPx}px"></td></tr>`;
        continue;
      }

      const processedCells = [];
      for (let cIdx = 0; cIdx < rawCells.length; cIdx++) {
        const cell = { ...rawCells[cIdx] };
        const maxRemainingRows = rows.length - rIdx;
        if (cell.rs && cell.rs > maxRemainingRows) {
          cell.rs = maxRemainingRows;
        }

        const isBorderless = (!cell.bd || cell.bd[0] + cell.bd[1] + cell.bd[2] + cell.bd[3] === 0) && !cell.bg && !isGrid;

        if (isBorderless && (!cell.cs || cell.cs === 1) && (!cell.rs || cell.rs === 1)) {
          let extraSpan = 0;
          while (cIdx + 1 < rawCells.length) {
            const nextC = rawCells[cIdx + 1];
            const nextEmpty = !nextC.v || String(nextC.v).trim() === '';
            const nextBorderless =
              (!nextC.bd || nextC.bd[0] + nextC.bd[1] + nextC.bd[2] + nextC.bd[3] === 0) &&
              !nextC.bg &&
              (!nextC.rs || nextC.rs === 1) &&
              (!nextC.cs || nextC.cs === 1);
            const expectedNextCol = cell.c + extraSpan + 1;
            if (nextEmpty && nextBorderless && nextC.c === expectedNextCol) {
              extraSpan++;
              cIdx++;
            } else {
              break;
            }
          }
          if (extraSpan > 0) {
            cell.cs = 1 + extraSpan;
          }
        }

        processedCells.push(cell);
      }

      html += `<tr style="height:${rowHtPx}px">`;

      for (const cell of processedCells) {
        const rs = cell.rs && cell.rs > 1 ? cell.rs : 1;
        const cs = cell.cs && cell.cs > 1 ? cell.cs : 1;
        const attrs = [];
        if (rs > 1) attrs.push(`rowspan="${rs}"`);
        if (cs > 1) attrs.push(`colspan="${cs}"`);

        let spanHtPx = 0;
        for (let k = 0; k < rs && rIdx + k < rowHeightsPx.length; k++) {
          spanHtPx += rowHeightsPx[rIdx + k];
        }

        const rawText = ensureUnicodeText(cell.v ?? '');
        const trimmedText = rawText.trim();

        const styles = [`height:${spanHtPx}px`];
        const endRowIdx = rIdx + rs - 1;
        const cellTouchesBottomOfBlock = isGrid && (endRowIdx + 1 >= rows.length || !rowIsGrid[endRowIdx + 1]);
        const cellTouchesLeftOfBlock = isGrid && cell.c === 1;
        const cellTouchesRightOfBlock = isGrid && cell.c + cs - 1 >= colCount;

        if (isGrid) {
          const topBorder = `${isTopOfBlock ? outerBorderPx : innerBorderPx}px solid #000000`;
          const bottomBorder = `${cellTouchesBottomOfBlock ? outerBorderPx : innerBorderPx}px solid #000000`;
          const leftBorder = `${cellTouchesLeftOfBlock ? outerBorderPx : innerBorderPx}px solid #000000`;
          const rightBorder = `${cellTouchesRightOfBlock ? outerBorderPx : innerBorderPx}px solid #000000`;
          styles.push(`border-top:${topBorder} !important`);
          styles.push(`border-right:${rightBorder} !important`);
          styles.push(`border-bottom:${bottomBorder} !important`);
          styles.push(`border-left:${leftBorder} !important`);
        } else if (cell.bd) {
          const [bt, br, bb, bl] = cell.bd;
          styles.push(`border-top:${bt ? `${innerBorderPx}px solid #000000` : 'none'} !important`);
          styles.push(`border-right:${br ? `${innerBorderPx}px solid #000000` : 'none'} !important`);
          styles.push(`border-bottom:${bb ? `${nextIsGrid ? outerBorderPx : innerBorderPx}px solid #000000` : 'none'} !important`);
          styles.push(`border-left:${bl ? `${innerBorderPx}px solid #000000` : 'none'} !important`);
        } else {
          styles.push('border:none !important');
        }

        let bg = cell.bg || null;
        if (sheetLower === 'summary' && bg === '#D9E1F2') {
          bg = '#E4DFEC';
        }
        if (isIhhlCombine && rIdx >= 5 && !isTotalRow(row)) {
          if (cell.c === 12 && trimmedText === '0') {
            bg = bg || '#00B050';
          } else if ((cell.c === 17 || cell.c === 16) && /^-\d/.test(trimmedText)) {
            bg = bg || '#ED7D31';
          }
        }
        if (trimmedText === 'Pending At JTA') {
          bg = bg || '#E5B8B7';
        } else if (trimmedText === 'AS Due at VDO') {
          bg = bg || '#FF0000';
        }

        if (bg) {
          styles.push(`background-color:${bg} !important`);
        } else {
          styles.push('background-color:transparent !important');
        }

        const fgColor = trimmedText === 'AS Due at VDO' ? '#FFFFFF' : '#000000';
        styles.push(`color:${fgColor} !important`);

        const fontPx = computeCellFontPx(sheetLower, cell, rawText, isGrid, rIdx);
        styles.push(`font-size:${fontPx}px !important`);

        // Stem-darkened crisp font weights for Excel VBA "chamak"
        const isHeaderCell = isGrid && (isTopOfBlock || (rIdx <= 3 && (bg || rs > 1 || cs > 1)));
        if (cell.b) {
          styles.push('font-weight:700 !important');
          if (fgColor === '#000000') styles.push('-webkit-text-stroke:0.2px #000000');
        } else if (isHeaderCell || (!isGrid && fontPx >= 17)) {
          styles.push('font-weight:600 !important');
          if (fgColor === '#000000') styles.push('-webkit-text-stroke:0.15px #000000');
        } else {
          styles.push('font-weight:500 !important');
          if (fgColor === '#000000') styles.push('-webkit-text-stroke:0.1px #000000');
        }
        if (cell.i) styles.push('font-style:italic');
        if (cell.st) styles.push('text-decoration:line-through');

        const isRightNumSheet =
          sheetLower.startsWith('csc ') ||
          sheetLower.includes('target aip') ||
          sheetLower.includes('financial');
        const isPlainNumber = /^-?[\d,]+(\.\d+)?$/.test(trimmedText);

        let hAlign = cell.al || 'left';
        if (isRightNumSheet && rIdx >= 2 && isPlainNumber && !cell.cur && cs === 1) {
          hAlign = 'right';
        }
        styles.push(`text-align:${hAlign} !important`);
        if (hAlign === 'right') {
          styles.push('padding-right:4px !important');
        } else if (hAlign === 'left' && isGrid) {
          styles.push('padding-left:4px !important');
        }

        const vAlign = cell.val || 'middle';
        styles.push(`vertical-align:${vAlign === 'center' ? 'middle' : vAlign} !important`);

        const isNumberOrPct = /^-?[\d,]+(\.\d+)?%?$/.test(trimmedText);
        const isOneLine7ColHeader =
          is7ColAssetSheet &&
          rIdx === 1 &&
          !trimmedText.includes('हाउसहोल्ड बिन');
        const isFooterSummaryCell = !isGrid && rIdx >= rows.length - 2 && cs >= 1 && trimmedText.length > 0;
        const shouldNoWrap =
          !trimmedText.includes('\n') &&
          (isNumberOrPct ||
            cell.cur ||
            isOneLine7ColHeader ||
            isFooterSummaryCell ||
            /^(Green Zone|Yello Zone|Yellow Zone|Red Zone|Complete|Done|Due|AS Due|TS Due|No Target|TOTAL|Total|योग|DEOGARH|Pending At JTA|Land Allotment Due)$/i.test(trimmedText));

        if (shouldNoWrap) {
          attrs.push('class="nowrap-cell"');
        }

        let innerHtml = '';
        if (cell.cur && rawText !== '') {
          const cleanVal = rawText.replace(/^₹\s*/, '').trim();
          innerHtml = `<div class="excel-acct-cell"><span class="rupee-sym">₹</span><span class="rupee-val">${escHtml(cleanVal)}</span></div>`;
        } else {
          innerHtml = escHtml(rawText).replace(/\r?\n/g, '<br>');
        }

        html += `<td ${attrs.join(' ')} style="${styles.join(';')}">${innerHtml}</td>`;
      }

      html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    return html;
  }

  function renderBlockDashboard() {
    ensureBlockPrintStyles();
    const container = document.getElementById('block-report-container');
    if (!container || !blockPayload) return;

    const pdfNameEl = document.getElementById('block-pdf-name');
    if (pdfNameEl) {
      pdfNameEl.textContent = `${blockPayload.pdfName || 'SBM Report'}.pdf`;
    }

    const metaEl = document.getElementById('block-cloud-meta');
    if (metaEl && blockPayload.meta) {
      metaEl.textContent = `अंतिम अपडेट: ${blockPayload.meta.lastUpdatedDisplay || 'अभी'} • Sheets: ${blockPayload.sheets.length}/${BLOCK_REPORT_SHEETS.length} • v${blockPayload.meta.version || '--'}`;
    }

    const tabsEl = document.getElementById('block-sheet-tabs');
    if (tabsEl) {
      let tabsHtml = `<button class="sheet-tab ${activeSheetFilter === 'ALL' ? 'active' : ''}" onclick="BlockReport.selectSheetTab('ALL')">📑 सभी 14 शीट्स (${blockPayload.sheets.length})</button>`;
      blockPayload.sheets.forEach((s, idx) => {
        const isAct = activeSheetFilter === s.name;
        const badge = s.orientation === 'portrait' ? 'Portrait' : 'Landscape';
        tabsHtml += `<button class="sheet-tab ${isAct ? 'active' : ''}" onclick="BlockReport.selectSheetTab('${escHtml(s.name)}')">${idx + 1}. ${escHtml(s.name)} <small>(${badge})</small></button>`;
      });
      tabsEl.innerHTML = tabsHtml;
    }

    const sheetsToRender =
      activeSheetFilter === 'ALL'
        ? blockPayload.sheets
        : blockPayload.sheets.filter((s) => s.name === activeSheetFilter);

    let outHtml = '';
    sheetsToRender.forEach((sheet) => {
      const pages = splitSheetIntoPrintPages(sheet);
      outHtml += `<div class="block-sheet-section">`;
      outHtml += `<div class="block-sheet-bar no-print">
        <div class="block-sheet-title">
          <span class="sheet-num-badge">Sheet ${blockPayload.sheets.indexOf(sheet) + 1}</span>
          <strong>${escHtml(sheet.name)}</strong>
          <span class="sheet-orient-pill">${sheet.orientation === 'portrait' ? '📄 Portrait' : '📐 Landscape'} (${pages.length} ${pages.length > 1 ? 'Pages' : 'Page'})</span>
        </div>
        <button class="btn-sheet-pdf" onclick="BlockReport.exportSingleSheetPDF('${escHtml(sheet.name)}')">⬇ केवल यह शीट PDF</button>
      </div>`;

      pages.forEach((p) => {
        outHtml += `<div class="excel-page-card ${p.orientation}">`;
        outHtml += buildPrintPageHtml(p, false);
        outHtml += `</div>`;
      });
      outHtml += `</div>`;
    });

    container.innerHTML = outHtml;
  }

  function showPdfModal(show, progress = 0, title = 'ब्लॉक रिपोर्ट PDF तैयार हो रही है…', subtitle = 'कृपया प्रतीक्षा करें…') {
    const modal = document.getElementById('pdfModal');
    if (!modal) return;
    if (show) {
      modal.style.display = 'flex';
      const tEl = document.getElementById('pdfModalTitle');
      const sEl = document.getElementById('pdfModalSub');
      const bEl = document.getElementById('pdfProgressBar');
      if (tEl) tEl.innerText = title;
      if (sEl) sEl.innerText = subtitle;
      if (bEl) bEl.style.width = Math.min(100, Math.max(0, progress)) + '%';
    } else {
      modal.style.display = 'none';
    }
  }

  /* High-Contrast Stem-Darkening & Crispness Filter for Excel VBA "Chamak" */
  function enhanceCanvasForPrint(canvas) {
    if (!canvas) return canvas;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Snap near-white background pixels to 100% pure bright white (#FFFFFF)
        if (r > 244 && g > 244 && b > 244) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
          continue;
        }

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;

        if (chroma <= 18) {
          // Neutral greyscale pixel (border line or black text stroke on white background)
          if (maxC < 125) {
            // Core of border or text glyph -> snap to 100% pure jet-black (#000000)
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
          } else if (maxC < 230) {
            // Anti-aliased edge -> apply strong stem-darkening curve
            const norm = (maxC - 125) / 105;
            const curved = Math.round(Math.pow(norm, 1.8) * 230);
            d[i] = curved;
            d[i + 1] = curved;
            d[i + 2] = curved;
          }
        } else {
          // Colored pixel: check if it is black text/border over a colored fill (yellow, green, lavender, blue, pink, orange)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const isRedFill = r > 180 && g < 55 && b < 55;
          if (!isRedFill && lum < 105) {
            const factor = lum < 65 ? 0 : Math.pow((lum - 65) / 40, 1.7) * 0.5;
            d[i] = Math.round(r * factor);
            d[i + 1] = Math.round(g * factor);
            d[i + 2] = Math.round(b * factor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (_) {}
    return canvas;
  }

  async function capturePrintPageToCanvas(page, scale = 3.0) {
    ensureBlockPrintStyles();
    const metrics = getPageRenderMetrics(page);
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-16000px';
    wrapper.style.width = metrics.captureWidthPx + 'px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.zIndex = '-1';
    wrapper.innerHTML = buildPrintPageHtml(page, true);

    document.body.appendChild(wrapper);
    await new Promise((r) => setTimeout(r, 80));
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    let canvas = null;
    try {
      const captureScale = metrics.captureWidthPx > 1900 ? 2.6 : scale;
      canvas = await html2canvas(wrapper, {
        scale: captureScale,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      enhanceCanvasForPrint(canvas);
    } finally {
      document.body.removeChild(wrapper);
    }
    return canvas;
  }

  async function exportSheetsToPdf(sheetsList, customFileName = null) {
    if (isExportingPdf) return;
    if (!sheetsList || sheetsList.length === 0) {
      alert('PDF बनाने के लिए कोई शीट उपलब्ध नहीं है।');
      return;
    }

    isExportingPdf = true;
    showPdfModal(true, 5, 'ब्लॉक रिपोर्ट PDF तैयार हो रही है…', 'HD क्रिस्प (Excel VBA क्वालिटी) पेज तैयार किए जा रहे हैं…');

    try {
      const allPrintPages = [];
      for (const sheet of sheetsList) {
        const pages = splitSheetIntoPrintPages(sheet);
        allPrintPages.push(...pages);
      }

      if (allPrintPages.length === 0) {
        throw new Error('कोई प्रिंट पेज नहीं मिला।');
      }

      const { jsPDF } = root.jspdf;
      const firstPage = allPrintPages[0];
      const doc = new jsPDF({
        orientation: firstPage.orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'letter',
        compress: true
      });

      for (let i = 0; i < allPrintPages.length; i++) {
        const page = allPrintPages[i];
        const pct = Math.round(((i + 0.5) / allPrintPages.length) * 95);
        showPdfModal(
          true,
          pct,
          `HD PDF तैयार हो रही है… (${i + 1}/${allPrintPages.length})`,
          `शीट: ${page.sheetName}${page.totalParts > 1 ? ` (पेज ${page.pagePart}/${page.totalParts})` : ''}`
        );

        if (i > 0) {
          doc.addPage('letter', page.orientation === 'portrait' ? 'portrait' : 'landscape');
        }

        const canvas = await capturePrintPageToCanvas(page, 3.0);
        if (!canvas) continue;

        const metrics = getPageRenderMetrics(page);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        let renderW = metrics.targetWidthMm || pageWidth - 35.6;
        let renderH = (canvas.height * renderW) / canvas.width;
        const maxH = metrics.maxHeightMm || pageHeight - (metrics.topMm || 20) - 18;

        if (renderH > maxH) {
          renderH = maxH;
          renderW = (canvas.width * renderH) / canvas.height;
        }

        const xOffset = metrics.leftMm !== undefined ? metrics.leftMm : (pageWidth - renderW) / 2;
        const yOffset = metrics.topMm !== undefined ? metrics.topMm : 20;

        // Use lossless PNG with FlateDecode compression so colors stay 100% vibrant and borders/text stay razor-sharp!
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', xOffset, yOffset, renderW, renderH, undefined, 'FAST');

        await new Promise((r) => setTimeout(r, 45));
      }

      const baseName = (customFileName || (blockPayload && blockPayload.pdfName) || 'SBM Report').replace(/\.pdf$/i, '');
      showPdfModal(true, 100, 'PDF डाउनलोड हो रही है…', `${baseName}.pdf`);
      doc.save(`${baseName}.pdf`);
    } catch (err) {
      console.error('Block PDF export error:', err);
      alert('PDF बनाने में त्रुटि: ' + err.message);
    } finally {
      isExportingPdf = false;
      showPdfModal(false);
    }
  }

  async function exportBlockReportPDF(forceReload = false) {
    try {
      if (!blockPayload || forceReload) {
        showPdfModal(true, 5, 'ब्लॉक रिपोर्ट डेटा लोड हो रहा है…', 'कृपया प्रतीक्षा करें…');
        await loadBlockReportData(false);
      }
      await exportSheetsToPdf(blockPayload.sheets, blockPayload.pdfName);
    } catch (err) {
      showPdfModal(false);
      alert('ब्लॉक रिपोर्ट लोड करने में त्रुटि: ' + err.message);
    }
  }

  async function exportSingleSheetPDF(sheetName) {
    if (!blockPayload) {
      await loadBlockReportData(false);
    }
    const target = (blockPayload.sheets || []).find((s) => s.name === sheetName);
    if (!target) {
      alert(`शीट "${sheetName}" नहीं मिली।`);
      return;
    }
    const fileName = `${blockPayload.pdfName || 'SBM Report'} - ${sheetName}`;
    await exportSheetsToPdf([target], fileName);
  }

  async function handleLocalWorkbookUpload(file) {
    if (!file) return;
    const statusEl = document.getElementById('block-file-status');
    if (statusEl) {
      statusEl.textContent = `⏳ "${file.name}" पढ़ी जा रही है…`;
      statusEl.className = 'file-status-pill loading';
    }
    try {
      const arrayBuf = await file.arrayBuffer();
      const wb = root.XLSX.read(new Uint8Array(arrayBuf), {
        type: 'array',
        cellNF: true,
        cellStyles: true,
        cellDates: false
      });

      let pdfName = '';
      const idxSheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === 'sheet_index');
      if (idxSheetName && wb.Sheets[idxSheetName]) {
        const i2 = wb.Sheets[idxSheetName]['I2'];
        if (i2 && (i2.w || i2.v)) {
          pdfName = ensureUnicodeText(String(i2.w || i2.v).trim());
        }
      }
      if (!pdfName) {
        pdfName = file.name.replace(/\.(xlsm|xlsx|xls)$/i, '');
      }

      const extractedSheets = [];
      for (const reqName of BLOCK_REPORT_SHEETS) {
        const reqNorm = reqName.trim().toLowerCase();
        const actualName = wb.SheetNames.find((n) => n.trim().toLowerCase() === reqNorm);
        if (!actualName) continue;
        const ws = wb.Sheets[actualName];
        const ref = ws['!ref'] || 'A1:I25';
        const range = root.XLSX.utils.decode_range(ref);
        const merges = (ws['!merges'] || []).map((m) => ({
          r1: m.s.r + 1,
          c1: m.s.c + 1,
          r2: m.e.r + 1,
          c2: m.e.c + 1
        }));

        const mergeMap = new Map();
        for (const m of merges) {
          for (let rr = m.r1; rr <= m.r2; rr++) {
            for (let cc = m.c1; cc <= m.c2; cc++) {
              mergeMap.set(`${rr},${cc}`, { ...m, isOrigin: rr === m.r1 && cc === m.c1 });
            }
          }
        }

        let maxR = 1;
        let maxC = 1;
        for (let R = range.s.r; R <= Math.min(range.e.r, 120); R++) {
          for (let C = range.s.c; C <= Math.min(range.e.c, 30); C++) {
            const addr = root.XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[addr];
            if (cell && cell.v !== undefined && cell.v !== '') {
              if (R + 1 > maxR) maxR = R + 1;
              if (C + 1 > maxC) maxC = C + 1;
            }
          }
        }

        const cols = [];
        const wsCols = ws['!cols'] || [];
        for (let c = 1; c <= maxC; c++) {
          const wObj = wsCols[c - 1];
          cols.push({ col: c, width: (wObj && wObj.wch) || 11 });
        }

        const wsRows = ws['!rows'] || [];
        const rows = [];
        for (let r = 1; r <= maxR; r++) {
          const rowCells = [];
          const rObj = wsRows[r - 1];
          const ht = (rObj && (rObj.hpt || rObj.hpx)) || null;
          for (let c = 1; c <= maxC; c++) {
            const mInfo = mergeMap.get(`${r},${c}`);
            if (mInfo && !mInfo.isOrigin) continue;
            const addr = root.XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
            const cell = ws[addr];
            const rawStr = cell ? String(cell.w !== undefined ? cell.w : cell.v ?? '') : '';
            const text = ensureUnicodeText(rawStr);
            const cellObj = {
              c,
              v: text,
              bd: r >= 2 ? [1, 1, 1, 1] : undefined,
              al: typeof (cell && cell.v) === 'number' ? 'center' : 'left'
            };
            if (mInfo) {
              if (mInfo.r2 > mInfo.r1) cellObj.rs = mInfo.r2 - mInfo.r1 + 1;
              if (mInfo.c2 > mInfo.c1) {
                cellObj.cs = mInfo.c2 - mInfo.c1 + 1;
                cellObj.al = 'center';
              }
            }
            rowCells.push(cellObj);
          }
          rows.push({ r, ht, cells: rowCells });
        }

        extractedSheets.push({
          name: actualName,
          orientation: actualName.trim().toLowerCase() === 'summary' ? 'portrait' : 'landscape',
          colCount: cols.length,
          rowCount: rows.length,
          cols,
          rows
        });
      }

      blockPayload = normalizePayloadForExcelVba({
        success: true,
        pdfName,
        requestedSheets: BLOCK_REPORT_SHEETS,
        foundSheetNames: extractedSheets.map((s) => s.name),
        missingSheets: [],
        sheets: extractedSheets,
        meta: {
          version: 'local-upload',
          lastUpdatedDisplay: `लोकल फ़ाइल: ${file.name}`
        }
      });

      activeSheetFilter = 'ALL';
      renderBlockDashboard();
      if (statusEl) {
        statusEl.textContent = `✓ "${file.name}" सफलतापूर्वक लोड हो गई (${extractedSheets.length} शीट्स)`;
        statusEl.className = 'file-status-pill ok';
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = `❌ फ़ाइल पढ़ने में त्रुटि: ${err.message}`;
        statusEl.className = 'file-status-pill err';
      }
    }
  }

  async function initBlockPage(forceRefresh = false) {
    const statusEl = document.getElementById('block-file-status');
    const metaEl = document.getElementById('block-cloud-meta');
    if (statusEl) {
      statusEl.textContent = forceRefresh ? '☁️ ताज़ा ब्लॉक रिपोर्ट सिंक हो रही है…' : '☁️ ब्लॉक रिपोर्ट लोड हो रही है…';
      statusEl.className = 'file-status-pill loading';
    }
    try {
      await loadBlockReportData(forceRefresh);
      renderBlockDashboard();
      if (statusEl) {
        statusEl.textContent = `☁️ ब्लॉक रिपोर्ट तैयार ✓ (${blockPayload.sheets.length} Sheets / 19 Pages)`;
        statusEl.className = 'file-status-pill ok';
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = '❌ ब्लॉक रिपोर्ट लोड नहीं हो सकी';
        statusEl.className = 'file-status-pill err';
      }
      if (metaEl) {
        metaEl.textContent = err.message + ' (या ऊपर "📂 लोकल .xlsm चुनें" बटन से अपनी .xlsm फ़ाइल चुनें)';
      }
    }
  }

  function selectSheetTab(sheetName) {
    activeSheetFilter = sheetName;
    renderBlockDashboard();
  }

  function printBlockReport() {
    ensureBlockPrintStyles();
    window.print();
  }

  root.BlockReport = {
    printBlockReport,
    BLOCK_REPORT_SHEETS,
    loadBlockReportData,
    initBlockPage,
    selectSheetTab,
    exportBlockReportPDF,
    exportSingleSheetPDF,
    handleLocalWorkbookUpload,
    splitSheetIntoPrintPages,
    buildPrintPageHtml,
    getPageRenderMetrics,
    enhanceCanvasForPrint
  };
})(typeof window !== 'undefined' ? window : this);
