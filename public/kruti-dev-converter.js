/**
 * kruti-dev-converter.js (or kruti_dev_converter.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Universal Kruti Dev (010 / 011 / 016) & DevLys (010 / 020) → Unicode
 * Devanagari converter for SBM-G Report (Node.js + Browser UMD).
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KrutiDevConverter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ARRAY_ONE = [
    'ñ', 'Q+Z', 'sas', 'aa', ')Z', 'ZZ', '‘', '’', '“', '”',
    'å', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹',
    '¶+', 'd+', '[+k', '[+', 'x+', 'T+', 't+', 'M+', '<+', 'Q+', ';+', 'j+', 'u+',
    'Ùk', 'Ù', 'ä', '–', '—', 'é', '™', '=kk', 'f=k',
    'à', 'á', 'â', 'ã', 'ºz', 'º', 'í', '{k', '{', '=', '«',
    'Nî', 'Vî', 'Bî', 'Mî', '<î', '|', 'K', '}',
    'J', 'Vª', 'Mª', '<ªª', 'Nª', 'Ø', 'Ý', 'nzZ', 'æ', 'ç', 'Á', 'xz', '#', ':',
    'v‚', 'vks', 'vkS', 'vk', 'v', 'b±', 'Ã', 'bZ', 'b', 'm', 'Å', ',s', ',', '_',
    'ô', 'd', 'Dk', 'D', '[k', '[', 'x', 'Xk', 'X', '?k', '?', '³',
    'pkS', 'p', 'Pk', 'P', 'N', 't', 'Tk', 'T', '>', '÷', '¥',
    'ê', 'ë', 'V', 'B', 'ì', 'ï', 'M+', '<+', 'M', '<', '.k', '.',
    'r', 'Rk', 'R', 'Fk', 'F', ')', 'n', '/k', 'धk', '/', 'Ë', 'è', 'u', 'Uk', 'U',
    'i', 'Ik', 'I', 'Q', '¶', 'c', 'Ck', 'C', 'Hk', 'H', 'e', 'Ek', 'E',
    ';', '¸', 'j', 'y', 'Yk', 'Y', 'G', 'o', 'Ok', 'O',
    "'k", "'", '"k', '"', 'l', 'Lk', 'L', 'g',
    'È', 'z',
    'Ì', 'Í', 'Î', 'Ï', 'Ñ', 'Ò', 'Ó', 'Ô', 'Ö', 'Ø', 'Ù', 'Ük', 'Ü',
    '‚', 'ks', 'kS', 'k', 'h', 'q', 'w', '`', 's', 'S',
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
    'ऑ', 'ओ', 'औ', 'आ', 'अ', 'ईं', 'ई', 'ई', 'इ', 'उ', 'ऊ', 'ऐ', 'ए', 'ऋ',
    'क्क', 'क', 'क', 'क्', 'ख', 'ख्', 'ग', 'ग', 'ग्', 'घ', 'घ्', 'ङ',
    'चौ', 'च', 'च', 'च्', 'छ', 'ज', 'ज', 'ज्', 'झ', 'झ्', 'ञ',
    'ट्ट', 'ट्ठ', 'ट', 'ठ', 'ड्ड', 'ड्ढ', 'ड़', 'ढ़', 'ड', 'ढ', 'ण', 'ण्',
    'त', 'त', 'त्', 'थ', 'थ्', 'द्ध', 'द', 'ध', 'ध', 'ध्', 'ध्', 'ध्', 'न', 'न', 'न्',
    'प', 'प', 'प्', 'फ', 'फ्', 'ब', 'ब', 'ब्', 'भ', 'भ्', 'म', 'म', 'म्',
    'य', 'य्', 'र', 'ल', 'ल', 'ल्', 'ळ', 'व', 'व', 'व्',
    'श', 'श्', 'ष', 'ष्', 'स', 'स', 'स्', 'ह',
    'ीं', '्र',
    'द्द', 'ट्ट', 'ट्ठ', 'ड्ड', 'कृ', 'भ', '्य', 'ड्ढ', 'झ्', 'क्र', 'त्त्', 'श', 'श्',
    'ॉ', 'ो', 'ौ', 'ा', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै',
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
    'april', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]);

  function isLegacyHindiFont(fontName) {
    if (!fontName) return false;
    const norm = String(fontName).toLowerCase().trim();
    return (
      norm.includes('kruti') ||
      norm.includes('devlys') ||
      norm.includes('dev lys') ||
      norm.includes('krutidev') ||
      norm.startsWith('k0') ||
      norm.startsWith('kd')
    );
  }

  function looksLikeKrutiDev(text) {
    if (text == null) return false;
    const s = String(text).trim();
    if (!s) return false;
    const hasDevanagari = /[\u0900-\u097F]/.test(s);
    if (/[Øç¼½±ÆÇÉÊÙ]/.test(s)) return true;
    if (/fnukad|iapk;r|xzke|'kkSpky;|fuekZ\.k|LoPN|fjiksVZ|lfefr|nsox<\+|jktleUn|;ksx|Hkqxrku|fcykuke|vkaxuokM|lkeqnkf;d|ekWfuVfjax/.test(s)) {
      return true;
    }
    if (hasDevanagari) return false;
    const krutiTokens = [
      /\b(ds|dk|dh|esa|ls|ij|gS|gSa|ugha|rFkk|,oa|Jh|xzke|iapk;r|dk;Z|lfefr|ftyk|fodkl|LoPN|Hkkjr|fe'ku|çxfr|fjiksVZ|fnukad|;ksx|dqy|y{;|Loh—r|Hkqxrku|fcykuke)\b/,
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

    const matras = 'अ आ इ ई उ ऊ ए ऐ ओ औ ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ';
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

    const str = String(text);
    if (/^[\d\s.,%+\-*/():₹]+$/.test(str.trim())) return str;
    if (/^(Work|AS|TS|FS|SPL|Spl)\s*[/\-]\s*\d/i.test(str.trim())) return str;
    if (/^(Pending At JTA|Pending At VDO|AS Due at VDO|Land Allotment Due|Complete|Work In Progress|Cancelled|Not Start|Plinth Level|Lintle Level|Roof Level|Done|Due|Yes|No|Total|Green Zone|Yello Zone|Yellow Zone|Red Zone)$/i.test(str.trim())) {
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

  function convertRichRuns(runs, defaultFontName) {
    if (!Array.isArray(runs) || runs.length === 0) return '';
    return runs
      .map((run) => {
        const fn = run.fontName || defaultFontName || '';
        const isKruti = isLegacyHindiFont(fn);
        return convertTextSmart(run.text || '', isKruti);
      })
      .join('');
  }

  return {
    isLegacyHindiFont,
    looksLikeKrutiDev,
    rawKrutiToUnicode,
    convertTextSmart,
    convertRichRuns
  };
});
