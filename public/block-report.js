```javascript
;(function (root) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
     PART 1: Kruti Dev (010/011/016) & DevLys (010/020) → Unicode Converter
     (Built directly into block-report.js so it works even standalone!)
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
      /\b(ds|dk|dh|esa|ls|ij|gS|gSa|ugha|rFkk|,oa|Jh|xzke|iapk;r|dk;Z|lfefr|ftyk|fodkl|LoPN|Hkkjr|fe'ku|çxfr|fjiksVZ|fnukad|;ksx|dqy|y{;|Loh—r|Hkqxrku|fcykuke|dkWih|vkWuykbZu|odZ|vkWMZj|Vs\.Mj)\b/,
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
     PART 2: 14-Sheet / 19-Page Block Report Renderer & PDF Exporter
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

  let blockPayload = null;
  let activeSheetFilter = 'ALL';
  let isExportingPdf = false;

  function ensureBlockPrintStyles() {
    if (typeof document === 'undefined') return;
    let style = document.getElementById('block-report-auto-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'block-report-auto-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .excel-print-page {
        background: #ffffff;
        color: #000000;
        font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif;
        width: 100%;
      }
      .excel-sheet-tbl {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
        background: #ffffff;
        color: #000000;
      }
      .excel-sheet-tbl td, .excel-sheet-tbl th {
        padding: 4px 6px;
        line-height: 1.25;
        word-break: normal;
        overflow-wrap: break-word;
        color: #000000;
        font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif;
      }
      .excel-sheet-tbl.compact-7col td {
        padding: 5px 8px;
        line-height: 1.28;
      }
      .excel-sheet-tbl.dense-sheet td {
        padding: 3px 4px;
        line-height: 1.15;
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
      }
      .excel-acct-cell .rupee-sym { font-weight: 500; }
      .excel-acct-cell .rupee-val { text-align: right; margin-left: auto; }
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

  async function loadBlockReportData(forceServerRefresh = false) {
    if (forceServerRefresh) {
      try {
        await fetch('/api/refresh', { method: 'POST' });
      } catch (_) {}
    }
    const url = `data/block-report.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {}
    if (!res.ok || !data || data.success !== true) {
      throw new Error((data && data.error) || `block-report.json लोड नहीं हो सका (HTTP ${res.status})`);
    }
    blockPayload = data;
    return data;
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
        (r.cells || []).some((c) => String(c.v || '').includes('2025-26') && String(c.v || '').includes('CSC'))
      );
      if (splitIdx === -1) {
        splitIdx = rows.findIndex((r) => r.r > 34);
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
    const colCount = (page.cols || []).length;
    const sheetLower = (page.sheetName || '').trim().toLowerCase();

    if (page.orientation === 'portrait') {
      return {
        captureWidthPx: 780,
        paddingCss: '10px 14px',
        baseFontPx: 12,
        maxPdfWidthMm: 190
      };
    }

    if (colCount <= 7) {
      return {
        captureWidthPx: 940,
        paddingCss: '8px 12px',
        baseFontPx: 13.5,
        maxPdfWidthMm: 244
      };
    }

    if (colCount === 8) {
      return {
        captureWidthPx: 1000,
        paddingCss: '8px 12px',
        baseFontPx: 13,
        maxPdfWidthMm: 248
      };
    }

    if (colCount <= 11) {
      return {
        captureWidthPx: 1140,
        paddingCss: '8px 12px',
        baseFontPx: 12,
        maxPdfWidthMm: 268
      };
    }

    if (colCount <= 14) {
      return {
        captureWidthPx: 1320,
        paddingCss: '8px 10px',
        baseFontPx: 11.5,
        maxPdfWidthMm: 277
      };
    }

    return {
      captureWidthPx: sheetLower.includes('financial') ? 1760 : 1680,
      paddingCss: '6px 8px',
      baseFontPx: 11,
      maxPdfWidthMm: 281
    };
  }

  function buildPrintPageHtml(page, forPdfCapture = false) {
    const cols = page.cols || [];
    const colCount = cols.length || 1;
    const totalExcelWidth = cols.reduce((acc, c) => acc + Math.max(c.width || 10, 4), 0) || 100;
    const metrics = getPageRenderMetrics(page);
    const baseFontPx = metrics.baseFontPx;
    const isDenseSheet = colCount >= 15;
    const isCompact7Col = colCount <= 7 && page.orientation === 'landscape';
    const sheetLower = (page.sheetName || '').trim().toLowerCase();
    const isIhhlCombine = sheetLower.includes('ihhl data combine');

    let html = `<div class="excel-print-page ${page.orientation} ${forPdfCapture ? 'pdf-capture-mode' : ''}" data-sheet="${escHtml(page.sheetName)}" data-orientation="${page.orientation}">`;
    html += `<table class="excel-sheet-tbl ${isDenseSheet ? 'dense-sheet' : ''} ${isCompact7Col ? 'compact-7col' : ''}">`;
    html += `<colgroup>`;
    for (const col of cols) {
      const pct = ((Math.max(col.width || 10, 4) / totalExcelWidth) * 100).toFixed(2);
      html += `<col style="width:${pct}%">`;
    }
    html += `</colgroup><tbody>`;

    const rows = page.rows || [];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const rawCells = row.cells || [];

      if (isRowEmpty(row)) {
        const spacerHt = row.ht ? Math.min(Math.round(row.ht * 0.65), 12) : 8;
        html += `<tr class="excel-spacer-row" style="height:${spacerHt}px"><td colspan="${colCount}" style="border:none;padding:0;height:${spacerHt}px"></td></tr>`;
        continue;
      }

      const processedCells = [];
      for (let cIdx = 0; cIdx < rawCells.length; cIdx++) {
        const cell = { ...rawCells[cIdx] };
        const maxRemainingRows = rows.length - rIdx;
        if (cell.rs && cell.rs > maxRemainingRows) {
          cell.rs = maxRemainingRows;
        }

        const hasText = cell.v !== null && cell.v !== undefined && String(cell.v).trim() !== '';
        const isBorderless = !cell.bd && !cell.bg;

        if (hasText && isBorderless && (!cell.cs || cell.cs === 1) && (!cell.rs || cell.rs === 1)) {
         
