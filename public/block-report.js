```javascript
/**
 * block-report.js (or block_report.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Client-Side Block Report Renderer & Exact Excel-Format PDF Exporter
 * Replicates the Excel VBA macro `Sub SaveSheetsAsPDF()`:
 *  - Reads PDF filename from `Sheet_Index!I2`
 *  - Exports all 14 sheets (19 pages total) in exact Excel print format:
 *    * Pages 1–2:   Summary (A4 Portrait, split after CSC 2024-25)
 *    * Page 3:      ODF Plus (A4 Landscape)
 *    * Pages 4–7:   CSC 23-24, CSC 24-25, CSC 25-26, CSC 26-27 (A4 Landscape)
 *    * Page 8:      RRC Updated (4) (A4 Landscape)
 *    * Page 9:      All IHHL Data Combine (A4 Landscape, 21 cols full-width)
 *    * Page 10:     Tender Report 26-27 (A4 Landscape)
 *    * Page 11:     Target AIP 26-27 (A4 Landscape, 18 cols)
 *    * Pages 12–13: AIP 26-27 Financial (A4 Landscape, 2 stacked tables)
 *    * Page 14:     Soak Pit 26-27 (A4 Landscape)
 *    * Page 15:     Compost Pit 26-27 (A4 Landscape)
 *    * Pages 16–19: Individual assest 26-27 (A4 Landscape, 4 stacked tables)
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function (root) {
  'use strict';

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
    if (root.KrutiDevConverter) {
      s = root.KrutiDevConverter.convertTextSmart(s, forceKruti);
    }
    return s.replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
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

    // 1. Summary sheet: Portrait (2 pages — split right before CSC Progress Year 2025-26)
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

    // 2. Stacked multi-table sheets (AIP 26-27 Financial [2 tables], Individual assest 26-27 [4 tables])
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

    // 3. Single-table sheet: fits on 1 page
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
      const rowStyle = row.ht && !isDenseSheet ? `style="min-height:${Math.round(row.ht * 1.05)}px"` : '';
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
          styles.push(`border-top:${bt ? '1px solid #000' : 'none'}`);
          styles.push(`border-right:${br ? '1px solid #000' : 'none'}`);
          styles.push(`border-bottom:${bb ? '1px solid #000' : 'none'}`);
          styles.push(`border-left:${bl ? '1px solid #000' : 'none'}`);
        } else {
          styles.push('border:none');
        }

        let bg = cell.bg || null;
        if (isIhhlCombine && rIdx >= 5 && !rowIsTotal) {
          if (cell.c === 12 && trimmedText === '0') {
            bg = bg || '#00B050';
          } else if ((cell.c === 17 || cell.c === 16) && /^-\d/.test(trimmedText)) {
            bg = bg || '#ED7D31';
          }
        }

        if (bg) styles.push(`background-color:${bg}`);
        if (cell.fg) styles.push(`color:${cell.fg}`);

        if (cell.sz) {
          if (cell.sz >= 30) {
            styles.push('font-size:26px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 17) {
            styles.push('font-size:18px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 15) {
            styles.push('font-size:15px;line-height:1.2');
          } else if (cell.sz >= 13.5) {
            styles.push(`font-size:${isDenseSheet ? 11.5 : 13.5}px;line-height:1.2`);
          } else if (cell.sz <= 9) {
            styles.push('font-size:9.5px');
          } else {
            styles.push(`font-size:${baseFontPx}px`);
          }
        } else {
          styles.push(`font-size:${baseFontPx}px`);
        }

        if (cell.b || rowIsTotal) styles.push('font-weight:700');
        if (cell.i) styles.push('font-style:italic');
        if (cell.st) styles.push('text-decoration:line-through');

        const hAlign = cell.al || 'left';
        styles.push(`text-align:${hAlign}`);
        const vAlign = cell.val || 'middle';
        styles.push(`vertical-align:${vAlign === 'center' ? 'middle' : vAlign}`);

        const isNumberOrPct = /^-?[\d,]+(\.\d+)?%?$/.test(trimmedText);
        const isSingleWordOrShortName =
          trimmedText.length > 0 &&
          trimmedText.length <= 20 &&
          !trimmedText.includes('\n') &&
          (isNumberOrPct ||
            cell.cur ||
            /^(Green Zone|Yello Zone|Yellow Zone|Red Zone|Complete|Done|Due|AS Due|TS Due|No Target|TOTAL|Total|योग|DEOGARH)$/i.test(trimmedText) ||
            (isDenseSheet && rIdx >= 4 && cell.c <= 2));

        if (isSingleWordOrShortName) {
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
  
