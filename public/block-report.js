/* ═══════════════════════════════════════════════════════════
   block-report.js — Block SBM Report
   workbook.json → HTML tables → jsPDF (GP Report jaisa)
   No LibreOffice, No Python, No Azure — pure browser PDF
═══════════════════════════════════════════════════════════ */

const BlockReport = (() => {

  const TARGET_SHEETS = [
    'Summary', 'ODF Plus', 'CSC 23-24', 'CSC 24-25', 'CSC 25-26',
    'RRC Updated (4)', 'All IHHL Data Combine', 'Tender Report 25-26',
    'Target AIP 26-27', 'AIP 26-27 Financial', 'Soak Pit 26-27',
    'Compost Pit 26-27', 'Individual assest 26-27'
  ];

  let pdfTitle  = 'Block_SBM_Report';
  let allSheets = {};
  let activeTab = null;

  // ── Helpers ──────────────────────────────────────────────
  const norm = s => String(s ?? '').toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');

  function findKey(target) {
    const t = norm(target);
    return Object.keys(allSheets).find(k => norm(k) === t)
        || Object.keys(allSheets).find(k => norm(k).includes(t) || t.includes(norm(k)))
        || null;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function setStatus(msg, type = '') {
    const el = document.getElementById('statusMsg');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-pill' + (type ? ' ' + type : '');
  }

  function showModal(show, pct = 0, title = '', sub = '') {
    const m = document.getElementById('pdfModal');
    if (!m) return;
    m.style.display = show ? 'flex' : 'none';
    if (show) {
      document.getElementById('pdfModalTitle').textContent = title;
      document.getElementById('pdfModalSub').textContent = sub;
      document.getElementById('pdfProgressBar').style.width = Math.min(100, pct) + '%';
    }
  }

  // ── Data Load ────────────────────────────────────────────
  async function init() {
    setStatus('डेटा लोड हो रहा है…');
    try {
      let result = null;

      // GitHub Pages: static workbook.json
      try {
        const r = await fetch(`data/workbook.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (r.ok) { result = await r.json(); if (!result?.sheets) result = null; }
      } catch (_) {}

      // Local server fallback
      if (!result?.sheets) {
        const r = await fetch('/api/load-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: false })
        });
        result = await r.json();
      }

      if (!result?.sheets) throw new Error('workbook data नहीं मिला');

      allSheets = result.sheets;

      // PDF naam: Sheet_Index row-1 col-I (index 8)
      const idxKey = Object.keys(allSheets).find(k => k.toLowerCase().includes('sheet_index'));
      if (idxKey && allSheets[idxKey]?.[1]?.[8]) {
        pdfTitle = String(allSheets[idxKey][1][8]).trim() || pdfTitle;
      }
      const badge = document.getElementById('pdfBadge');
      if (badge) { badge.textContent = '📄 ' + pdfTitle; badge.style.display = ''; }

      renderAll();
      buildTabs();
      setStatus('✅ डेटा लोड हो गया', 'ok');
      document.getElementById('btnPDF').disabled = false;

    } catch (err) {
      console.error(err);
      setStatus('❌ ' + err.message, 'err');
      document.getElementById('reportContent').innerHTML =
        `<div class="placeholder"><div class="placeholder-icon">❌</div>
         <div class="placeholder-text">${esc(err.message)}</div></div>`;
    }
  }

  // ── Render one sheet as HTML table ───────────────────────
  function makeTable(rows) {
    if (!rows?.length) return '<p class="no-rows">कोई डेटा नहीं</p>';
    const header   = rows[0] || [];
    const bodyRows = rows.slice(1);
    const cols     = header.length || (bodyRows[0]?.length ?? 0);

    let html = '<div class="tbl-wrap"><table><thead><tr>';
    for (let c = 0; c < cols; c++)
      html += `<th>${esc(String(header[c] ?? ''))}</th>`;
    html += '</tr></thead><tbody>';

    bodyRows.forEach(row => {
      html += '<tr>';
      for (let c = 0; c < cols; c++)
        html += `<td>${esc(String(row?.[c] ?? ''))}</td>`;
      html += '</tr>';
    });
    return html + '</tbody></table></div>';
  }

  // ── Render all target sheets ──────────────────────────────
  function renderAll() {
    const container = document.getElementById('reportContent');
    container.innerHTML = '';
    let found = 0;

    TARGET_SHEETS.forEach(name => {
      const key  = findKey(name);
      const rows = key ? allSheets[key] : null;

      const block = document.createElement('div');
      block.className      = 'sheet-block';
      block.id             = 'sheet-' + norm(name);
      block.dataset.name   = name;

      if (!rows?.length) {
        block.innerHTML =
          `<div class="sheet-title">📋 ${esc(name)}</div>
           <p class="no-rows">⚠️ Sheet नहीं मिली: "${esc(name)}"</p>`;
      } else {
        found++;
        block.innerHTML =
          `<div class="sheet-title">📋 ${esc(name)}</div>${makeTable(rows)}`;
      }
      container.appendChild(block);
    });

    setStatus(`✅ ${found} / ${TARGET_SHEETS.length} sheets मिलीं`, 'ok');
  }

  // ── Tabs ─────────────────────────────────────────────────
  function buildTabs() {
    const el = document.getElementById('sheetTabs');
    if (!el) return;
    el.innerHTML = '';
    el.style.display = 'flex';

    const allBtn = document.createElement('button');
    allBtn.className   = 'tab-btn active';
    allBtn.textContent = 'सभी Sheets';
    allBtn.onclick = () => { showAll(); setActive(allBtn); };
    el.appendChild(allBtn);

    TARGET_SHEETS.forEach(name => {
      const btn = document.createElement('button');
      btn.className   = 'tab-btn';
      btn.textContent = name;
      btn.onclick = () => { showOnly(norm(name)); setActive(btn); };
      el.appendChild(btn);
    });
    activeTab = null;
  }

  function setActive(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  function showAll()     { activeTab = null; document.querySelectorAll('.sheet-block').forEach(b => b.classList.remove('hidden')); }
  function showOnly(id)  { activeTab = id;   document.querySelectorAll('.sheet-block').forEach(b => b.classList.toggle('hidden', b.id !== 'sheet-' + id)); }

  // ── PDF Download — GP Report jaisa ───────────────────────
  async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert('jsPDF load nahi hua, page refresh karo'); return; }

    const allBlocks = [...document.querySelectorAll('.sheet-block')];
    const blocks    = allBlocks.filter(b => !b.querySelector('.no-rows'));
    if (!blocks.length) { alert('Pehle data load karo'); return; }

    const btn = document.getElementById('btnPDF');
    btn.disabled = true;

    // Temporarily show hidden blocks for capture
    const wasHidden = [];
    allBlocks.forEach(b => {
      if (b.classList.contains('hidden')) {
        b.classList.remove('hidden');
        wasHidden.push(b);
      }
    });

    try {
      const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pgW    = doc.internal.pageSize.getWidth();
      const pgH    = doc.internal.pageSize.getHeight();
      const margin = 12;
      let   first  = true;

      const dateStr = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      for (let i = 0; i < blocks.length; i++) {
        const block     = blocks[i];
        const sheetName = block.dataset.name || ('Sheet ' + (i + 1));
        const pct       = Math.round((i / blocks.length) * 90);

        showModal(true, pct, `PDF बन रही है… (${i + 1}/${blocks.length})`, sheetName);

        // Isolated wrapper for capture
        const wrapper = document.createElement('div');
        wrapper.style.cssText = [
          'position:absolute', 'top:-9999px', 'left:-9999px',
          'width:1400px', 'background:#fff', 'padding:12px 16px',
          "font-family:'Noto Sans Devanagari',Poppins,sans-serif",
          'font-size:11px', 'color:#000'
        ].join(';');
        wrapper.appendChild(block.cloneNode(true));
        document.body.appendChild(wrapper);
        await new Promise(r => setTimeout(r, 200));

        let canvas = null;
        try {
          canvas = await html2canvas(wrapper, {
            scale: 1.8, backgroundColor: '#ffffff',
            logging: false, useCORS: true,
            scrollX: 0, scrollY: 0
          });
        } catch (e) { console.error(e); }
        document.body.removeChild(wrapper);
        if (!canvas) continue;

        if (!first) doc.addPage();
        first = false;

        // Fit image to page
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const availW  = pgW - 2 * margin;
        const availH  = pgH - margin * 2 - 16;
        const ratio   = canvas.width / canvas.height;
        let iW = availW, iH = iW / ratio;
        if (iH > availH) { iH = availH; iW = iH * ratio; }
        const xOff = (pgW - iW) / 2;

        doc.addImage(imgData, 'JPEG', xOff, margin + 12, iW, iH, undefined, 'FAST');

        // Header
        doc.setDrawColor(0); doc.setLineWidth(0.4);
        doc.line(margin, margin + 3, pgW - margin, margin + 3);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
        doc.text('Swachh Bharat Mission (Gramin) — Block Level Report', pgW / 2, margin, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text(pdfTitle, margin, margin);
        doc.text(dateStr, pgW - margin, margin, { align: 'right' });

        // Footer
        doc.setLineWidth(0.4);
        doc.line(margin, pgH - margin + 1, pgW - margin, pgH - margin + 1);
        doc.setFontSize(9);
        doc.text(`${sheetName}  |  Page ${doc.getNumberOfPages()}`, pgW / 2, pgH - margin + 5, { align: 'center' });
      }

      showModal(true, 98, 'PDF save हो रही है…', '');
      doc.save(`${pdfTitle}.pdf`);
      showModal(false);

    } catch (err) {
      console.error(err);
      showModal(false);
      alert('PDF Error: ' + err.message);
    } finally {
      btn.disabled = false;
      wasHidden.forEach(b => b.classList.add('hidden'));
      showModal(false);
      if (activeTab) showOnly(activeTab);
    }
  }

  return { init, downloadPDF };
})();
