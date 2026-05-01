(function() {
  let currentExcelData = null;
  let currentSheetNames = null;
  let isCloudSyncing = false;
  let dataMode = 'server';

  function shouldPreferStaticData() {
    const host = window.location.hostname;
    return host && host !== 'localhost' && host !== '127.0.0.1';
  }

  function formatMetaTime(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return 'अभी';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function applyRuntimeModeUI(meta) {
    const titleEl = document.querySelector('.cloud-title');
    const copyEl = document.querySelector('.cloud-copy');
    const refreshBtn = document.getElementById('btnRefresh');

    if (meta?.source === 'github-pages-snapshot') {
      if (titleEl) titleEl.textContent = '☁️ Published GitHub Snapshot';
      if (copyEl) copyEl.textContent = 'Latest published workbook snapshot se report load hoti hai. Naya data GitHub Actions workflow se publish hota hai.';
      if (refreshBtn) refreshBtn.style.display = 'none';
      dataMode = 'static';
      return;
    }

    if (titleEl) titleEl.textContent = '☁️ Secure OneDrive Sync';
    if (copyEl) copyEl.textContent = 'Workbook browser me link dikhaye bina server-side protected OneDrive source se load hota hai.';
    if (refreshBtn) refreshBtn.style.display = '';
    dataMode = 'server';
  }

  function applyWorkbookPayload(result) {
    const previousGp = document.getElementById('gpsel')?.value || '';
    currentExcelData = result.sheets;
    currentSheetNames = result.sheetNames;
    DataHandler.setWorkbookData(currentExcelData, currentSheetNames);
    applyRuntimeModeUI(result.meta);
    renderCloudMeta(result.meta);

    const gpSelect = document.getElementById('gpsel');
    if (!gpSelect) return;

    const hasPreviousGp = Array.from(gpSelect.options).some((option) => option.value === previousGp);
    if (hasPreviousGp) {
      gpSelect.value = previousGp;
    } else if (gpSelect.options.length > 1) {
      gpSelect.selectedIndex = 1;
    }

    if (gpSelect.value) {
      DataHandler.renderAll();
    }
  }

  async function loadServerWorkbook(refresh = false) {
    const response = await fetch('/api/load-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Secure OneDrive sync विफल रहा।');
    }
    return result;
  }

  async function loadStaticWorkbook() {
    const response = await fetch(`data/workbook.json?ts=${Date.now()}`, { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Published workbook snapshot नहीं मिला।');
    }
    return result;
  }

  async function loadExcel(refresh = false) {
    let result;

    if (shouldPreferStaticData()) {
      try {
        result = await loadStaticWorkbook();
      } catch (staticError) {
        result = await loadServerWorkbook(refresh);
      }
    } else {
      try {
        result = await loadServerWorkbook(refresh);
      } catch (serverError) {
        result = await loadStaticWorkbook();
      }
    }

    applyWorkbookPayload(result);
  }

  function renderCloudMeta(meta) {
    const metaEl = document.getElementById('cloud-meta');
    if (!metaEl) return;

    if (!meta) {
      metaEl.textContent = 'Server-side protected OneDrive source active';
      return;
    }

    const formattedTime = formatMetaTime(meta.fetchedAt);
    if (meta.source === 'github-pages-snapshot') {
      const publishedTime = formatMetaTime(meta.publishedAt);
      metaEl.textContent = `GitHub Pages snapshot • source sync ${formattedTime} • published ${publishedTime} • v${meta.version || '--'}`;
      return;
    }

    const syncType = meta.cached ? 'cache sync' : 'fresh sync';
    metaEl.textContent = `Secure OneDrive source • ${syncType} • ${formattedTime} • v${meta.version || '--'}`;
  }

  function setSyncButtonsState(loading, refreshMode = false) {
    const loadBtn = document.getElementById('btnFetch');
    const refreshBtn = document.getElementById('btnRefresh');
    const staticMode = dataMode === 'static';
    if (loadBtn) {
      loadBtn.disabled = loading;
      loadBtn.textContent = loading
        ? (staticMode ? '⏳ डेटा रीलोड हो रहा है…' : (refreshMode ? '⏳ डेटा लोड हो रहा है…' : '⏳ Sync हो रहा है…'))
        : (staticMode ? '↻ डेटा रीलोड करें' : '☁️ डेटा लोड करें');
    }
    if (refreshBtn) {
      refreshBtn.style.display = staticMode ? 'none' : '';
      refreshBtn.disabled = loading;
      refreshBtn.textContent = loading && refreshMode ? '⏳ Refresh हो रहा है…' : '↻ ताज़ा सिंक';
    }
  }

  window.syncCloudData = async function(forceRefresh = false) {
    if (isCloudSyncing) return;
    isCloudSyncing = true;
    setSyncButtonsState(true, forceRefresh);
    DataHandler.setStatus('☁️ डेटा लोड हो रहा है…', 'loading');

    try {
      await loadExcel(forceRefresh);
      DataHandler.setStatus(
        dataMode === 'static'
          ? '☁️ Published snapshot लोड हो गया ✓'
          : (forceRefresh ? '☁️ Secure OneDrive refresh पूरा हुआ ✓' : '☁️ Secure OneDrive data लोड हो गया ✓'),
        'ok'
      );
    } catch (err) {
      console.error(err);
      DataHandler.setStatus('❌ Secure OneDrive data लोड नहीं हो सका', 'err');
      const metaEl = document.getElementById('cloud-meta');
      if (metaEl) metaEl.textContent = err.message;
    } finally {
      isCloudSyncing = false;
      setSyncButtonsState(false, forceRefresh);
    }
  };

  window.addEventListener('load', () => {
    void window.syncCloudData(false);
  });

  // 🔥 FIX: Error-free capturing by using isolated wrappers 🔥
  async function captureElementSafely(element, scale=2) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '1350px'; 
    wrapper.style.backgroundColor = 'white';
    wrapper.style.padding = '20px';
    
    wrapper.appendChild(element); 
    document.body.appendChild(wrapper); 
    
    await new Promise(r => setTimeout(r, 100)); 
    await document.fonts?.ready;
    
    let canvas = null;
    try {
      canvas = await html2canvas(wrapper, { scale, backgroundColor: '#ffffff', logging: false, useCORS: true });
    } catch(e) { console.error(e); }
    
    document.body.removeChild(wrapper); 
    return canvas;
  }

  function showModal(show, progress=0, title='PDF तैयार हो रही है…', subtitle='कृपया प्रतीक्षा करें…') {
    const modal = document.getElementById('pdfModal');
    if (!modal) return;
    if (show) {
      modal.style.display = 'flex';
      document.getElementById('pdfModalTitle').innerText = title;
      document.getElementById('pdfModalSub').innerText = subtitle;
      const bar = document.getElementById('pdfProgressBar');
      if (bar) bar.style.width = Math.min(100, progress) + '%';
    } else {
      modal.style.display = 'none';
    }
  }

  // 🔥 PDF EXPORT: Centered & Edge Margin Fixed 🔥
  window.exportCurrentGP = async function() {
    const gp = document.getElementById('gpsel').value;
    if (!gp) { alert('कृपया GP चुनें।'); return; }
    showModal(true, 10, 'PDF तैयार हो रही है…', 'पहला पेज बन रहा है...');
    try {
      const s1 = document.getElementById('s1');
      const s2 = document.getElementById('s2');
      const s3 = document.getElementById('s3');
      const s4 = document.getElementById('s4');
      if (!s1 || !s2 || !s3 || !s4) throw new Error('सभी सेक्शन नहीं मिले');
      
      const page1Div = document.createElement('div');
      page1Div.appendChild(s1.cloneNode(true));
      page1Div.appendChild(s2.cloneNode(true));
      page1Div.appendChild(s3.cloneNode(true));

      const page2Div = document.createElement('div');
      page2Div.appendChild(s4.cloneNode(true));

      showModal(true, 40, 'PDF तैयार हो रही है…', 'पेज 1 कैप्चर हो रहा है...');
      const canvas1 = await captureElementSafely(page1Div, 2);
      
      showModal(true, 70, 'PDF तैयार हो रही है…', 'पेज 2 कैप्चर हो रहा है...');
      const canvas2 = await captureElementSafely(page2Div, 2);

      if (!canvas1 || !canvas2) throw new Error('Canvas capture failed');
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 14; 
      const imgWidth = pageWidth - 2 * margin;
      
      const addImageToDoc = (canvas, isFirstPage, pageNum, totalPages) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const finalHeight = Math.min(imgHeight, pageHeight - 32);
        const finalWidth = (canvas.width * finalHeight) / canvas.height;
        const xOffset = (pageWidth - finalWidth) / 2; 
        const yOffset = margin + 10; 
        
        doc.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
        
        // ✅ Fixed date format — manual, no locale cut-off issue
        const now = new Date();
        const day = String(now.getDate()).padStart(2,'0');
        const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
        const yr  = now.getFullYear();
        let   hr  = now.getHours();
        const ap  = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12 || 12;
        const mi  = String(now.getMinutes()).padStart(2,'0');
        const dateTime = `${day}-${mon}-${yr}  ${hr}:${mi} ${ap}`;

        // ✅ Header separator line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(margin, margin + 3, pageWidth - margin, margin + 3);

        // ✅ GP name — left aligned
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`GP: ${gp}`, margin, margin);

        // ✅ Title — center, every page (not just first)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Swachh Bharat Mission (Gramin) Pragati Report', pageWidth / 2, margin, { align: 'center' });

        // ✅ Date — right aligned using align option (no manual width calc)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(dateTime, pageWidth - margin, margin, { align: 'right' });

        // ✅ Footer separator line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - margin + 1, pageWidth - margin, pageHeight - margin + 1);

        // ✅ Footer page number — center aligned using align option
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - margin + 5, { align: 'center' });
      };
      
      addImageToDoc(canvas1, true, 1, 2);
      doc.addPage();
      addImageToDoc(canvas2, false, 2, 2);
      
      doc.save(`SBM_Report_${gp}.pdf`);
      showModal(false);
    } catch(err) {
      console.error(err);
      showModal(false);
      alert('PDF बनाने में त्रुटि: ' + err.message);
    }
  };

  window.exportAllGPs = async function() {
    const sel = document.getElementById('gpsel');
    const options = Array.from(sel.options).filter(opt => opt.value !== '');
    if (options.length === 0) { alert('कोई GP उपलब्ध नहीं है।'); return; }
    showModal(true, 0, 'सभी GP के लिए PDF बन रहा है…', 'कृपया प्रतीक्षा करें…');
    const { jsPDF } = window.jspdf;
    let combinedDoc = null;
    let isFirst = true;
    for (let i=0; i<options.length; i++) {
      const gp = options[i].value;
      sel.value = gp;
      DataHandler.renderAll();
      await new Promise(r => setTimeout(r, 400));
      
      const s1 = document.getElementById('s1'); const s2 = document.getElementById('s2');
      const s3 = document.getElementById('s3'); const s4 = document.getElementById('s4');
      if (!s1 || !s2 || !s3 || !s4) continue;
      
      const page1Div = document.createElement('div');
      page1Div.appendChild(s1.cloneNode(true)); page1Div.appendChild(s2.cloneNode(true)); page1Div.appendChild(s3.cloneNode(true));
      const canvas1 = await captureElementSafely(page1Div, 2);
      
      const page2Div = document.createElement('div');
      page2Div.appendChild(s4.cloneNode(true));
      const canvas2 = await captureElementSafely(page2Div, 2);
      
      if (!canvas1 || !canvas2) continue;
      
      if (isFirst) { combinedDoc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); isFirst = false; } 
      else { combinedDoc.addPage(); }
      
      const pageWidth = combinedDoc.internal.pageSize.getWidth();
      const pageHeight = combinedDoc.internal.pageSize.getHeight();
      const margin = 14; const imgWidth = pageWidth - 2 * margin;
      
      const addImg = (canvas, isFirstPage, pageNum) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const finalHeight = Math.min(imgHeight, pageHeight - 32);
        const finalWidth = (canvas.width * finalHeight) / canvas.height;
        const xOffset = (pageWidth - finalWidth) / 2;
        
        combinedDoc.addImage(imgData, 'JPEG', xOffset, margin + 10, finalWidth, finalHeight, undefined, 'FAST');
        
        // ✅ Fixed date format — manual, no locale cut-off issue
        const now = new Date();
        const day = String(now.getDate()).padStart(2,'0');
        const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
        const yr  = now.getFullYear();
        let   hr  = now.getHours();
        const ap  = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12 || 12;
        const mi  = String(now.getMinutes()).padStart(2,'0');
        const dateTime = `${day}-${mon}-${yr}  ${hr}:${mi} ${ap}`;

        // ✅ Header separator line
        combinedDoc.setDrawColor(0, 0, 0);
        combinedDoc.setLineWidth(0.4);
        combinedDoc.line(margin, margin + 3, pageWidth - margin, margin + 3);

        // ✅ GP name — left
        combinedDoc.setFont('helvetica', 'normal');
        combinedDoc.setFontSize(10);
        combinedDoc.setTextColor(0, 0, 0);
        combinedDoc.text(`GP: ${gp}`, margin, margin);

        // ✅ Title — center, every page
        combinedDoc.setFont('helvetica', 'bold');
        combinedDoc.setFontSize(11);
        combinedDoc.text('Swachh Bharat Mission (Gramin) Pragati Report', pageWidth / 2, margin, { align: 'center' });

        // ✅ Date — right aligned using align option (no manual width calc)
        combinedDoc.setFont('helvetica', 'normal');
        combinedDoc.setFontSize(10);
        combinedDoc.text(dateTime, pageWidth - margin, margin, { align: 'right' });

        // ✅ Footer separator line
        combinedDoc.setDrawColor(0, 0, 0);
        combinedDoc.setLineWidth(0.4);
        combinedDoc.line(margin, pageHeight - margin + 1, pageWidth - margin, pageHeight - margin + 1);

        // ✅ Footer page number — center
        combinedDoc.setFont('helvetica', 'normal');
        combinedDoc.setFontSize(9);
        combinedDoc.text(`Page ${pageNum} of 2`, pageWidth / 2, pageHeight - margin + 5, { align: 'center' });
      };
      
      addImg(canvas1, true, 1);
      combinedDoc.addPage();
      addImg(canvas2, false, 2);
      showModal(true, Math.round(((i+1)/options.length)*100), `PDF बन रहा है... (${i+1}/${options.length})`, `GP: ${gp}`);
    }
    if (combinedDoc) {
      combinedDoc.save(`SBM_Report_All_GPs_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.pdf`);
    }
    showModal(false);
  }

  window.renderAll = function() { DataHandler.renderAll(); };
  window.toggleDebug = function() {
    const body = document.getElementById('dbg-body');
    body.style.display = body.style.display !== 'block' ? 'block' : 'none';
  };
})();
