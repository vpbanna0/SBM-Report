/**
 * block-report.js (or block_report.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Client-Side Block Report Renderer & Exact Excel-Format PDF Exporter
 * Replicates the Excel VBA macro `Sub SaveSheetsAsPDF()`
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

  // Auto-inject print table styles into document.head so PDF capture works even if style.css is not modified
  function ensureBlockPrintStyles() {
    if (typeof document === 'undefined' || document.getElementById('block-report-auto-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-report-auto-styles';
    style.textContent = `
      .excel-print-page { background: #ffffff; color: #000000; font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif; width: 100%; }
      .excel-sheet-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #000000; }
      .excel-sheet-tbl td, .excel-sheet-tbl th { padding: 4px 5px; line-height: 1.25; word-wrap: break-word; overflow-wrap: break-word; color: #000000; font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif; }
      .excel-sheet-tbl.dense-sheet td { padding: 3px 3px; line-height: 1.18; }
      .excel-acct-cell { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 4px; }
      .excel-acct-cell .rupee-sym { font-weight: 500; }
      .excel-acct-cell .rupee-val { text-align: right; margin-left: auto; }
    `;
    document.head.appendChild(style);
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
    if (root.KrutiDevConverter) {
      return root.KrutiDevConverter.convertTextSmart(String(text), forceKruti);
    }
    return String(text);
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

  function splitSheetIntoPrintPages(sheet) {
    const rows = sheet.rows || [];
    if (rows.length === 0) return [];

    const isSummary = sheet.name.trim().toLowerCase() === 'summary';
    if (isSummary && rows.length > 29) {
      const page1Rows = rows.filter((r) => r.r <= 30);
      const page2Rows = rows.filter((r) => r.r > 30);
      const pages = [];
      if (page1Rows.length > 0) {
        pages.push({
          sheetName: sheet.name,
          pagePart: 1,
          totalParts: page2Rows.length > 0 ? 2 : 1,
          orientation: 'portrait',
          cols: sheet.cols,
          rows: page1Rows
        });
      }
      if (page2Rows.length > 0) {
        pages.push({
          sheetName: sheet.name,
          pagePart: 2,
          totalParts: 2,
          orientation: 'portrait',
          cols: sheet.cols,
          rows: page2Rows
        });
      }
      return pages;
    }

    const orientation = sheet.orientation === 'portrait' ? 'portrait' : 'landscape';
    if (rows.length <= 42) {
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

    const headerRows = rows.slice(0, 3);
    const bodyRows = rows.slice(3);
    const chunkSize = 32;
    const pages = [];
    const totalParts = Math.ceil(bodyRows.length / chunkSize);
    for (let i = 0; i < bodyRows.length; i += chunkSize) {
      const chunk = bodyRows.slice(i, i + chunkSize);
      pages.push({
        sheetName: sheet.name,
        pagePart: pages.length + 1,
        totalParts,
        orientation,
        cols: sheet.cols,
        rows: [...headerRows, ...chunk]
      });
    }
    return pages;
  }

  function buildPrintPageHtml(page, forPdfCapture = false) {
    const cols = page.cols || [];
    const totalExcelWidth = cols.reduce((acc, c) => acc + Math.max(c.width || 10, 4), 0) || 100;
    const isDenseSheet = cols.length >= 13;
    const baseFontPx = isDenseSheet ? 10.5 : page.orientation === 'portrait' ? 12 : 11.5;

    let html = `<div class="excel-print-page ${page.orientation} ${forPdfCapture ? 'pdf-capture-mode' : ''}" data-sheet="${escHtml(page.sheetName)}" data-orientation="${page.orientation}">`;
    html += `<table class="excel-sheet-tbl ${isDenseSheet ? 'dense-sheet' : ''}">`;
    html += `<colgroup>`;
    for (const col of cols) {
      const pct = ((Math.max(col.width || 10, 4) / totalExcelWidth) * 100).toFixed(2);
      html += `<col style="width:${pct}%">`;
    }
    html += `</colgroup><tbody>`;

    for (const row of page.rows) {
      const cells = row.cells || [];
      const allEmptyAndBorderless = cells.every(
        (c) => (!c.v || String(c.v).trim() === '') && !c.bd && !c.bg
      );
      if (allEmptyAndBorderless) {
        const spacerHt = row.ht ? Math.min(Math.round(row.ht * 0.8), 16) : 10;
        html += `<tr class="excel-spacer-row" style="height:${spacerHt}px"><td colspan="${cols.length}" style="border:none;padding:0;height:${spacerHt}px"></td></tr>`;
        continue;
      }

      const rowStyle = row.ht ? `style="min-height:${Math.round(row.ht * 1.1)}px"` : '';
      html += `<tr ${rowStyle}>`;

      for (const cell of cells) {
        const attrs = [];
        if (cell.rs && cell.rs > 1) attrs.push(`rowspan="${cell.rs}"`);
        if (cell.cs && cell.cs > 1) attrs.push(`colspan="${cell.cs}"`);

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

        if (cell.bg) styles.push(`background-color:${cell.bg}`);
        if (cell.fg) styles.push(`color:${cell.fg}`);

        if (cell.sz) {
          if (cell.sz >= 30) {
            styles.push('font-size:28px;line-height:1.25;padding:6px 4px');
          } else if (cell.sz >= 17) {
            styles.push('font-size:18px;line-height:1.25;padding:5px 4px');
          } else if (cell.sz >= 15) {
            styles.push('font-size:15.5px;line-height:1.25');
          } else if (cell.sz >= 13.5) {
            styles.push(`font-size:${isDenseSheet ? 11.5 : 13.5}px;line-height:1.25`);
          } else if (cell.sz <= 9) {
            styles.push('font-size:9.5px');
          } else {
            styles.push(`font-size:${baseFontPx}px`);
          }
        } else {
          styles.push(`font-size:${baseFontPx}px`);
        }

        if (cell.b) styles.push('font-weight:700');
        if (cell.i) styles.push('font-style:italic');
        if (cell.st) styles.push('text-decoration:line-through');

        const hAlign = cell.al || 'left';
        styles.push(`text-align:${hAlign}`);
        const vAlign = cell.val || 'middle';
        styles.push(`vertical-align:${vAlign === 'center' ? 'middle' : vAlign}`);

        const rawText = ensureUnicodeText(cell.v ?? '');
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
    const wrapper = document.createElement('div');
    const isPortrait = page.orientation === 'portrait';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-12000px';
    wrapper.style.width = isPortrait ? '880px' : '1280px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = isPortrait ? '18px 24px' : '14px 20px';
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
          `शीट: ${page.sheetName}${page.totalParts > 1 ? ` (भाग ${page.pagePart}/${page.totalParts})` : ''}`
        );

        if (i > 0) {
          doc.addPage('a4', page.orientation === 'portrait' ? 'portrait' : 'landscape');
        }

        const canvas = await capturePrintPageToCanvas(page, 2);
        if (!canvas) continue;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = page.orientation === 'portrait' ? 10 : 8;
        const marginY = page.orientation === 'portrait' ? 10 : 8;
        const availW = pageWidth - marginX * 2;
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

        await new Promise((r) => setTimeout(r, 60));
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
    }
  }

  function selectSheetTab(sheetName) {
    activeSheetFilter = sheetName;
    renderBlockDashboard();
  }

  root.BlockReport = {
    BLOCK_REPORT_SHEETS,
    loadBlockReportData,
    initBlockPage,
    selectSheetTab,
    exportBlockReportPDF,
    exportSingleSheetPDF,
    handleLocalWorkbookUpload
  };
})(typeof window !== 'undefined' ? window : this);
