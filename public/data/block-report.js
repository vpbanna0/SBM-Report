/* ══════════════════════════════════════════════════════
   block-report.js  —  Block SBM Report
   Direct jsPDF download — GP Report jaise
══════════════════════════════════════════════════════ */

const BlockReport = (() => {

  const TARGET_SHEETS = [
    'Summary','ODF Plus','CSC 23-24','CSC 24-25','CSC 25-26',
    'RRC Updated (4)','All IHHL Data Combine','Tender Report 25-26',
    'Target AIP 26-27','AIP 26-27 Financial','Soak Pit 26-27',
    'Compost Pit 26-27','Individual assest 26-27'
  ];

  const PDF_NAME_SHEET = 'sheet_index';
  const PDF_NAME_ROW   = 1;
  const PDF_NAME_COL   = 8;

  let allSheets  = {};
  let sheetNames = [];
  let pdfTitle   = 'Block_SBM_Report';
  let activeSheet = null;

  function norm(s) {
    return String(s ?? '').toLowerCase().replace(/\s+/g,'_').replace(/[()]/g,'');
  }

  function findSheetKey(targetName) {
    const t = norm(targetName);
    return Object.keys(allSheets).find(k => norm(k) === t)
      || Object.keys(allSheets).find(k => norm(k).includes(t) || t.includes(norm(k)))
      || null;
  }

  function setStatus(msg, type='') {
    const el = document.getElementById('statusMsg');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-pill' + (type ? ' '+type : '');
  }

  function showLoading(show, msg='') {
    const el = document.getElementById('loadingOverlay');
    const msgEl = document.getElementById('loadingMsg');
    if (el) el.style.display = show ? 'flex' : 'none';
    if (msg && msgEl) msgEl.textContent = msg;
  }

  // ── DATA LOAD ──
  async function load() {
    showLoading(true, 'डेटा लोड हो रहा है…');
    setStatus('डेटा लोड हो रहा है…');
    document.getElementById('btnPDF').disabled = true;

    try {
      let result = null;

      try {
        const res = await fetch(`data/workbook.json?ts=${Date.now()}`, { cache:'no-store' });
        if (res.ok) { result = await res.json(); if (!result?.sheets) result = null; }
      } catch(_) {}

      if (!result) {
        const res = await fetch('/api/load-excel', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ refresh:false })
        });
        result = await res.json();
      }

      if (!result) throw new Error('डेटा नहीं मिला');

      allSheets  = result.sheets  || {};
      sheetNames = result.sheetNames || Object.keys(allSheets);

      extractPdfName();
      renderAllSheets();
      buildTabs();

      setStatus(`✅ डेटा लोड हो गया — ${sheetNames.length} sheets`, 'ok');
      document.getElementById('btnPDF').disabled = false;

    } catch(err) {
      console.error(err);
      setStatus('❌ ' + err.message, 'err');
      document.getElementById('reportContent').innerHTML =
        `<div class="placeholder"><div class="placeholder-icon">❌</div>
         <div class="placeholder-text">डेटा लोड नहीं हो सका।<br><small>${esc(err.message)}</small></div></div>`;
    } finally {
      showLoading(false);
    }
  }

  function extractPdfName() {
    const key = Object.keys(allSheets).find(k =>
      k.toLowerCase().includes('sheet_index') || k.toLowerCase().includes('sheetindex'));
    if (key && allSheets[key]?.[PDF_NAME_ROW]?.[PDF_NAME_COL]) {
      pdfTitle = String(allSheets[key][PDF_NAME_ROW][PDF_NAME_COL]).trim() || 'Block_SBM_Report';
    }
    const badge = document.getElementById('pdfNameBadge');
    if (badge) { badge.textContent = '📄 '+pdfTitle; badge.style.display=''; }
    const pd = document.getElementById('printPdfName');
    if (pd) pd.textContent = pdfTitle;
    const dt = document.getElementById('printDate');
    if (dt) {
      dt.textContent = new Date().toLocaleString('en-IN',
        {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});
    }
  }

  // ── RENDER TABLES ──
  function renderAllSheets() {
    const container = document.getElementById('reportContent');
    container.innerHTML = '';
    let found = 0;

    TARGET_SHEETS.forEach(targetName => {
      const key  = findSheetKey(targetName);
      const rows = key ? allSheets[key] : null;

      const block = document.createElement('div');
      block.className = 'sheet-block';
      block.id = 'sheet-'+norm(targetName);
      block.dataset.sheetName = targetName;

      if (!rows || rows.length === 0) {
        block.innerHTML =
          `<div class="sheet-title">📋 ${esc(targetName)}</div>
           <p class="no-rows">⚠️ Sheet नहीं मिली: "${esc(targetName)}"</p>`;
      } else {
        found++;
        block.innerHTML =
          `<div class="sheet-title">📋 ${esc(targetName)}</div>
           <div class="tbl-wrap">${buildTable(rows)}</div>`;
      }
      container.appendChild(block);
    });

    setStatus(`✅ ${found} / ${TARGET_SHEETS.length} sheets मिलीं`, 'ok');
  }

  function buildTable(rows) {
    if (!rows?.length) return '<p class="no-rows">कोई डेटा नहीं</p>';
    const MAX = 2000;
    const disp = rows.slice(0, MAX);
    const colCount = (disp[0]||[]).length;
    let html = '<table><thead><tr>';
    (disp[0]||[]).forEach(c => { html += `<th>${esc(String(c??''))}</th>`; });
    html += '</tr></thead><tbody>';
    disp.slice(1).forEach(row => {
      html += '<tr>';
      for (let c=0; c<colCount; c++) html += `<td>${esc(String(row[c]??''))}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table>';
    if (rows.length > MAX) html += `<p class="no-rows">⚠️ केवल ${MAX} rows दिखाई जा रही हैं</p>`;
    return html;
  }

  // ── TABS ──
  function buildTabs() {
    const tabsEl = document.getElementById('sheetTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    tabsEl.style.display = 'flex';

    const allTab = document.createElement('button');
    allTab.className = 'tab-btn active';
    allTab.textContent = 'सभी Sheets';
    allTab.onclick = () => showAll(allTab);
    tabsEl.appendChild(allTab);

    TARGET_SHEETS.forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.textContent = name;
      btn.onclick = () => showOnly(norm(name), btn);
      tabsEl.appendChild(btn);
    });
    activeSheet = null;
  }

  function showAll(tab) {
    activeSheet = null;
    document.querySelectorAll('.sheet-block').forEach(b => b.classList.remove('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tab.classList.add('active');
  }
  function showOnly(id, tab) {
    activeSheet = id;
    document.querySelectorAll('.sheet-block').forEach(b => b.classList.toggle('hidden', b.id !== 'sheet-'+id));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tab.classList.add('active');
  }

  // ══════════════════════════════════════════════
  //  DIRECT jsPDF DOWNLOAD  (GP Report jaisa)
  // ══════════════════════════════════════════════
  async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert('jsPDF लोड नहीं हुआ, पेज refresh करें।'); return; }

    const blocks = [...document.querySelectorAll('.sheet-block')];
    if (!blocks.length) { alert('पहले डेटा लोड करें।'); return; }

    const btn = document.getElementById('btnPDF');
    btn.disabled = true;
    showLoading(true, 'PDF बन रही है…');

    // Sab sheets temporarily show karo capture ke liye
    blocks.forEach(b => b.classList.remove('hidden'));

    try {
      const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a3' });
      const pgW  = doc.internal.pageSize.getWidth();
      const pgH  = doc.internal.pageSize.getHeight();
      const margin = 12;
      let   isFirst = true;

      const now = new Date();
      const dateStr = now.toLocaleString('en-IN',
        {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});

      for (let i=0; i<blocks.length; i++) {
        const block = blocks[i];
        const sheetName = block.dataset.sheetName || ('Sheet '+(i+1));

        // Skip "not found" sheets
        if (block.querySelector('.no-rows')) continue;

        showLoading(true, `PDF बन रही है… (${i+1}/${blocks.length}) — ${sheetName}`);

        // Clone + isolate for capture
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1600px;background:white;padding:16px;font-family:Noto Sans Devanagari,Poppins,sans-serif;font-size:12px;';
        wrapper.appendChild(block.cloneNode(true));
        document.body.appendChild(wrapper);
        await new Promise(r => setTimeout(r,150));

        let canvas = null;
        try {
          canvas = await html2canvas(wrapper, {
            scale:1.8, backgroundColor:'#ffffff', logging:false, useCORS:true
          });
        } catch(e) { console.error(e); }
        document.body.removeChild(wrapper);

        if (!canvas) continue;

        if (!isFirst) doc.addPage();
        isFirst = false;

        // Image ko page pe fit karo
        const imgData   = canvas.toDataURL('image/jpeg', 0.92);
        const availW    = pgW - 2*margin;
        const availH    = pgH - margin*2 - 14;
        const imgAspect = canvas.width / canvas.height;
        let   iW = availW;
        let   iH = iW / imgAspect;
        if (iH > availH) { iH = availH; iW = iH * imgAspect; }
        const xOff = (pgW - iW) / 2;

        doc.addImage(imgData,'JPEG', xOff, margin+10, iW, iH, undefined,'FAST');

        // Header line
        doc.setDrawColor(0); doc.setLineWidth(0.4);
        doc.line(margin, margin+3, pgW-margin, margin+3);

        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,0,0);
        doc.text('Swachh Bharat Mission (Gramin) — Block Level Report', pgW/2, margin, {align:'center'});

        doc.setFont('helvetica','normal'); doc.setFontSize(9);
        doc.text(pdfTitle, margin, margin);
        doc.text(dateStr, pgW-margin, margin, {align:'right'});

        // Footer line
        doc.setDrawColor(0); doc.setLineWidth(0.4);
        doc.line(margin, pgH-margin+1, pgW-margin, pgH-margin+1);

        doc.setFontSize(9);
        doc.text(`${sheetName}  |  Page ${doc.getNumberOfPages()}`, pgW/2, pgH-margin+5, {align:'center'});
      }

      doc.save(`${pdfTitle}.pdf`);

    } catch(err) {
      console.error(err);
      alert('PDF बनाने में त्रुटि: ' + err.message);
    } finally {
      showLoading(false);
      btn.disabled = false;
      // Restore tab state
      if (activeSheet) {
        document.querySelectorAll('.sheet-block').forEach(b =>
          b.classList.toggle('hidden', b.id !== 'sheet-'+activeSheet));
      }
    }
  }

  function esc(s) {
    return String(s??'').replace(/[&<>"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  return { load, downloadPDF };
})();
