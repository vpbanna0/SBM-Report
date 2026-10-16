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
    size: A4 landscape;
    margin: 6mm 8mm;
  }
  @page block-portrait {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  @page block-landscape {
    size: A4 landscape;
    margin: 6mm 8mm;
  }

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
    border: none !important;
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
  .excel-sheet-tbl.wide-13col td {
    padding: 3.5px 5px;
    line-height: 1.2;
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
      zoom: 1 !important;
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
      max-width: 190mm !important;
    }
    .excel-page-card.landscape {
      page: block-landscape !important;
      max-width: 281mm !important;
    }
    .block-sheet-section:last-of-type .excel-page-card:last-of-type {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .excel-print-page {
      width: 100% !important;
      margin: 0 auto !important;
      overflow: visible !important;
    }
    .excel-sheet-tbl {
      width: 100% !important;
      margin: 0 auto !important;
      border-collapse: collapse !important;
      border: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .excel-sheet-tbl.compact-7col {
      max-width: 244mm !important;
    }
    .excel-sheet-tbl tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      min-height: 0 !important;
      height: auto !important;
    }
    .excel-sheet-tbl tr.excel-spacer-row,
    .excel-sheet-tbl tr.excel-spacer-row td {
      height: 5px !important;
      max-height: 5px !important;
      min-height: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
    }
    /* Portrait Summary print typography */
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-body {
      font-size: 8pt !important;
      padding: 1.8px 3.5px !important;
      line-height: 1.1 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-sec {
      font-size: 9.5pt !important;
      padding: 2px 3.5px !important;
      line-height: 1.12 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-sub {
      font-size: 11.5pt !important;
      padding: 3px 4px !important;
      line-height: 1.18 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-title {
      font-size: 16pt !important;
      padding: 2px 4px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 7-col compact print typography */
    .excel-sheet-tbl.compact-7col td.cell-sz-body {
      font-size: 8.5pt !important;
      padding: 2.2px 5px !important;
      line-height: 1.14 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-sec {
      font-size: 9.5pt !important;
      padding: 2.5px 5px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-sub {
      font-size: 11pt !important;
      padding: 2.5px 5px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-title {
      font-size: 15pt !important;
      padding: 3px 5px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 8-11 col medium print typography */
    .excel-sheet-tbl.med-sheet td.cell-sz-body {
      font-size: 8pt !important;
      padding: 2px 3.5px !important;
      line-height: 1.12 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-sec {
      font-size: 9pt !important;
      padding: 2px 4px !important;
      line-height: 1.14 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-sub {
      font-size: 11pt !important;
      padding: 2.5px 4px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-title {
      font-size: 15pt !important;
      padding: 3px 4px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 12-14 col (RRC Updated 4) print typography */
    .excel-sheet-tbl.wide-13col td.cell-sz-body {
      font-size: 6.8pt !important;
      padding: 1.5px 2.5px !important;
      line-height: 1.08 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-sec {
      font-size: 8pt !important;
      padding: 1.8px 3px !important;
      line-height: 1.1 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-sub {
      font-size: 10pt !important;
      padding: 2px 3px !important;
      line-height: 1.12 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-title {
      font-size: 14pt !important;
      padding: 2.5px 3px !important;
      line-height: 1.12 !important;
    }
    /* Landscape 15-21 col dense (All IHHL Combine, Target AIP, Financial) print typography */
    .excel-sheet-tbl.dense-sheet td.cell-sz-body,
    .excel-sheet-tbl.dense-sheet td.cell-sz-sm {
      font-size: 5.8pt !important;
      padding: 1.2px 1.8px !important;
      line-height: 1.04 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-sec {
      font-size: 7.2pt !important;
      padding: 1.5px 2px !important;
      line-height: 1.08 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-sub {
      font-size: 9.5pt !important;
      padding: 2px 2.5px !important;
      line-height: 1.1 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-title {
      font-size: 13pt !important;
      padding: 2px 3px !important;
      line-height: 1.12 !important;
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


  const EMBEDDED_BLOCK_REPORT_GZ_B64 = "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";

  async function decodeEmbeddedBlockReport() {
    if (!EMBEDDED_BLOCK_REPORT_GZ_B64 || typeof DecompressionStream === "undefined") return null;
    try {
      const binStr = atob(EMBEDDED_BLOCK_REPORT_GZ_B64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const ds = new DecompressionStream("gzip");
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const text = await new Response(ds.readable).text();
      return JSON.parse(text);
    } catch (e) {
      console.warn("Embedded fallback decode warning:", e);
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
            blockPayload = data;
            return data;
          }
        }
      } catch (_) {}
    }
    const embedded = await decodeEmbeddedBlockReport();
    if (embedded && embedded.success === true) {
      blockPayload = embedded;
      return embedded;
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
    const isWide13Col = colCount >= 12 && colCount < 15;
    const isCompact7Col = colCount <= 7 && page.orientation === 'landscape';
    const isMedSheet = !isDenseSheet && !isWide13Col && !isCompact7Col && page.orientation === 'landscape';
    const sheetLower = (page.sheetName || '').trim().toLowerCase();
    const isIhhlCombine = sheetLower.includes('ihhl data combine');

    const tblClasses = ['excel-sheet-tbl'];
    if (isDenseSheet) tblClasses.push('dense-sheet');
    else if (isWide13Col) tblClasses.push('wide-13col');
    else if (isCompact7Col) tblClasses.push('compact-7col');
    else if (isMedSheet) tblClasses.push('med-sheet');

    let html = `<div class="excel-print-page ${page.orientation} ${forPdfCapture ? 'pdf-capture-mode' : ''}" data-sheet="${escHtml(page.sheetName)}" data-orientation="${page.orientation}">`;
    html += `<table class="${tblClasses.join(' ')}" style="border:none !important">`;
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
        html += `<tr class="excel-spacer-row" style="height:${spacerHt}px"><td colspan="${colCount}" style="border:none !important;padding:0 !important;background:transparent !important;height:${spacerHt}px"></td></tr>`;
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

        if (isBorderless && (!cell.cs || cell.cs === 1) && (!cell.rs || cell.rs === 1)) {
          let extraSpan = 0;
          while (cIdx + 1 < rawCells.length) {
            const nextC = rawCells[cIdx + 1];
            const nextEmpty = !nextC.v || String(nextC.v).trim() === '';
            const nextBorderless = !nextC.bd && !nextC.bg && (!nextC.rs || nextC.rs === 1) && (!nextC.cs || nextC.cs === 1);
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

      const rowIsTotal = isTotalRow(row);
      const rowStyle = '';
      html += `<tr ${rowStyle}>`;

      for (const cell of processedCells) {
        const attrs = [];
        if (cell.rs && cell.rs > 1) attrs.push(`rowspan="${cell.rs}"`);
        if (cell.cs && cell.cs > 1) attrs.push(`colspan="${cell.cs}"`);

        const rawText = ensureUnicodeText(cell.v ?? '');
        const trimmedText = rawText.trim();

        const styles = [];
        if (cell.bd) {
          const [bt, br, bb, bl] = cell.bd;
          styles.push(`border-top:${bt ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-right:${br ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-bottom:${bb ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-left:${bl ? '1px solid #000' : 'none'} !important`);
        } else {
          styles.push('border:none !important');
        }

        let bg = cell.bg || null;
        if (isIhhlCombine && rIdx >= 5 && !rowIsTotal) {
          if (cell.c === 12 && trimmedText === '0') {
            bg = bg || '#00B050';
          } else if ((cell.c === 17 || cell.c === 16) && /^-\d/.test(trimmedText)) {
            bg = bg || '#ED7D31';
          }
        }

        if (bg) {
          styles.push(`background-color:${bg} !important`);
        } else {
          styles.push('background-color:transparent !important');
        }
        styles.push(`color:${cell.fg || '#000000'} !important`);

        let szClass = 'cell-sz-body';
        if (cell.sz) {
          if (cell.sz >= 28) {
            szClass = 'cell-sz-title';
            styles.push('font-size:26px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 17) {
            szClass = 'cell-sz-sub';
            styles.push('font-size:18px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 15) {
            szClass = 'cell-sz-sec';
            styles.push('font-size:15px;line-height:1.2');
          } else if (cell.sz >= 13.5) {
            szClass = 'cell-sz-sec';
            styles.push(`font-size:${isDenseSheet ? 11.5 : 13.5}px;line-height:1.2`);
          } else if (cell.sz <= 9) {
            szClass = 'cell-sz-sm';
            styles.push('font-size:9.5px');
          } else {
            styles.push(`font-size:${baseFontPx}px`);
          }
        } else {
          styles.push(`font-size:${baseFontPx}px`);
        }

        if (cell.b || rowIsTotal) styles.push('font-weight:700 !important');
        if (cell.i) styles.push('font-style:italic');
        if (cell.st) styles.push('text-decoration:line-through');

        const hAlign = cell.al || 'left';
        styles.push(`text-align:${hAlign} !important`);
        const vAlign = cell.val || 'middle';
        styles.push(`vertical-align:${vAlign === 'center' ? 'middle' : vAlign} !important`);

        const isNumberOrPct = /^-?[\d,]+(\.\d+)?%?$/.test(trimmedText);
        const isSingleWordOrShortName =
          trimmedText.length > 0 &&
          trimmedText.length <= 20 &&
          !trimmedText.includes('\n') &&
          (isNumberOrPct ||
            cell.cur ||
            /^(Green Zone|Yello Zone|Yellow Zone|Red Zone|Complete|Done|Due|AS Due|TS Due|No Target|TOTAL|Total|योग|DEOGARH)$/i.test(trimmedText) ||
            (isDenseSheet && rIdx >= 4 && cell.c <= 2));

        const cellClasses = [szClass];
        if (isSingleWordOrShortName) {
          cellClasses.push('nowrap-cell');
        }
        attrs.push(`class="${cellClasses.join(' ')}"`);

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
          <span class="sheet-orient-pill">${sheet.orientation === 'portrait' ? '📄 A4 Portrait' : '📐 A4 Landscape'} (${pages.length} ${pages.length > 1 ? 'Pages' : 'Page'})</span>
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

  async function capturePrintPageToCanvas(page, scale = 2) {
    ensureBlockPrintStyles();
    const metrics = getPageRenderMetrics(page);
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-14000px';
    wrapper.style.width = metrics.captureWidthPx + 'px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = metrics.paddingCss;
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
      canvas = await html2canvas(wrapper, {
        scale,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
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
    showPdfModal(true, 5, 'ब्लॉक रिपोर्ट PDF तैयार हो रही है…', 'सभी 14 शीट्स के पेज तैयार किए जा रहे हैं…');

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
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < allPrintPages.length; i++) {
        const page = allPrintPages[i];
        const pct = Math.round(((i + 0.5) / allPrintPages.length) * 95);
        showPdfModal(
          true,
          pct,
          `PDF तैयार हो रही है… (${i + 1}/${allPrintPages.length})`,
          `शीट: ${page.sheetName}${page.totalParts > 1 ? ` (पेज ${page.pagePart}/${page.totalParts})` : ''}`
        );

        if (i > 0) {
          doc.addPage('a4', page.orientation === 'portrait' ? 'portrait' : 'landscape');
        }

        const canvas = await capturePrintPageToCanvas(page, 2);
        if (!canvas) continue;

        const metrics = getPageRenderMetrics(page);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = page.orientation === 'portrait' ? 10 : 8;
        const marginY = page.orientation === 'portrait' ? 10 : 9;
        const availW = Math.min(pageWidth - marginX * 2, metrics.maxPdfWidthMm || pageWidth - marginX * 2);
        const availH = pageHeight - marginY * 2;

        let renderW = availW;
        let renderH = (canvas.height * renderW) / canvas.width;
        if (renderH > availH) {
          renderH = availH;
          renderW = (canvas.width * renderH) / canvas.height;
        }

        const xOffset = (pageWidth - renderW) / 2;
        const yOffset = marginY;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', xOffset, yOffset, renderW, renderH, undefined, 'FAST');

        await new Promise((r) => setTimeout(r, 50));
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

        const rows = [];
        for (let r = 1; r <= maxR; r++) {
          const rowCells = [];
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
          rows.push({ r, cells: rowCells });
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

      blockPayload = {
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
      };

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
        statusEl.textContent = `☁️ ब्लॉक रिपोर्ट तैयार ✓ (${blockPayload.sheets.length} Sheets)`;
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
    handleLocalWorkbookUpload
  };
})(typeof window !== 'undefined' ? window : this);
