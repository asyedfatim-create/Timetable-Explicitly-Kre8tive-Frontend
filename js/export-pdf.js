/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — export-pdf.js
   §8  EXPORT PDF
═══════════════════════════════════════════════════════════════ */

function exportPDF(){
  function _loadScript(src, cb){
    if(document.querySelector(`script[src="${src}"]`)){ cb(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=cb;
    document.head.appendChild(s);
  }

  showToast('⏳ Preparing PDF download…','success');

  _loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ()=>{
    _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', ()=>{

      const activePage = document.querySelector('.page.active');
      if(!activePage){ showToast('Nothing to export','error'); return; }

      const captureTarget =
        activePage.querySelector('.main-content') ||
        activePage.querySelector('.tt-page')      ||
        activePage.querySelector('.clash-page')   ||
        activePage.querySelector('.req-page')     ||
        activePage.querySelector('.notif-page')   ||
        activePage.querySelector('.analytics-page')||
        activePage.querySelector('.builder-page') ||
        activePage.querySelector('.manage-page')  ||
        activePage;

      window.scrollTo(0,0);
      captureTarget.scrollTop = 0;

      const hideEls = [...document.querySelectorAll('.header-actions, .back-btn, .builder-config > button')];
      hideEls.forEach(el=>{ el._pd = el.style.display; el.style.display='none'; });

      html2canvas(captureTarget, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureTarget.scrollWidth,
        windowHeight: captureTarget.scrollHeight,
      }).then(canvas=>{
        hideEls.forEach(el=>{ el.style.display = el._pd || ''; });

        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pageW = 210, pageH = 297;
        const imgW  = pageW;
        const imgH  = (canvas.height * pageW) / canvas.width;
        const pdf   = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });

        let yOff = 0, rem = imgH, page = 0;
        while(rem > 0){
          if(page > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOff, imgW, imgH);
          yOff += pageH; rem -= pageH; page++;
        }

        const dateStr = new Date().toISOString().slice(0,10);
        pdf.save(`IBIT-TAS_${activePage.id}_${dateStr}.pdf`);
        showToast('✅ PDF downloaded!','success');

      }).catch(err=>{
        hideEls.forEach(el=>{ el.style.display = el._pd || ''; });
        console.error('html2canvas error:', err);
        showToast('❌ PDF export failed. Try again.','error');
      });
    });
  });
}
