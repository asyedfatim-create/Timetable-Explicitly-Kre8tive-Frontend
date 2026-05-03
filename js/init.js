/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — init.js
   §26  DOM READY
   §27  EXPOSE FUNCTIONS ON window
═══════════════════════════════════════════════════════════════ */

/* §26  DOM READY */
document.addEventListener('DOMContentLoaded', async ()=>{

  /* Login */
  const loginBtn = document.querySelector('.login-btn');
  if(loginBtn) loginBtn.addEventListener('click', handleLogin);

  /* Role card selection */
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', function(){
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');

      const role  = this.querySelector('.role-name')?.textContent || 'User';
      const email = this.dataset.email || '';
      const pass  = this.dataset.pass  || '';

      const emailEl = document.querySelector('.login-right .form-input[type="email"]');
      const passEl  = document.querySelector('.login-right .form-input[type="password"]');
      if(emailEl) emailEl.value = email;
      if(passEl)  passEl.value  = pass;

      const btn = document.querySelector('.login-btn');
      if(btn) btn.textContent = `Sign In as ${role} →`;
    });
  });

  /* Notification filter buttons */
  const filterMap=['all','coral','teal','gold','amber'];
  document.querySelectorAll('#notif .nf-btn').forEach((btn,i)=>{
    const filter=filterMap[i]||'all';
    btn.dataset.filter=filter;
    btn.addEventListener('click',()=>setNotifFilter(filter));
  });

  /* Mark all read */
  document.querySelector('#notif .btn-ghost')?.addEventListener('click', markAllRead);

  /* Clash suggestion buttons */
  document.querySelectorAll('.sug-btn').forEach(btn=>{
    btn.addEventListener('click',function(){
      const card=this.closest('.sug-card');
      const day =card?.querySelector('.sug-day')?.textContent||'—';
      const time=card?.querySelector('.sug-time')?.textContent||'—';
      showToast(`✓ Slot applied: ${day} · ${time}`,'success');
      pushNotification('Clash Slot Applied',`Alternative slot ${day} · ${time} has been applied.`,'teal');
    });
  });

  /* Request submit buttons */
  document.querySelector('#tab-makeup .submit-btn')?.addEventListener('click',()=>submitRequest('makeup'));
  document.querySelector('#tab-merge  .submit-btn')?.addEventListener('click',()=>submitRequest('merge'));
  document.querySelector('#tab-cancel .submit-btn')?.addEventListener('click',()=>submitRequest('cancel'));

  /* Publish modal overlay close */
  document.getElementById('publishModal')?.addEventListener('click',function(e){ if(e.target===this) closePublishModal(); });

  /* TT page filters */
  document.getElementById('ttBatchFilter')?.addEventListener('change', onTTBatchChange);
  document.getElementById('ttSectionFilter')?.addEventListener('change', onTTSectionChange);

  /* Wire Export PDF buttons */
  document.querySelectorAll('.btn-ghost').forEach(btn=>{
    if(btn.textContent.includes('Export PDF')) btn.addEventListener('click',()=>exportPDF());
  });

  /* Wire Export CSV buttons */
  document.querySelectorAll('.btn-ghost').forEach(btn=>{
    if(btn.textContent.includes('Export CSV')){
      const page=btn.closest('.page')?.id||'';
      const pageMap={teachers:'teachers',rooms:'rooms',courses:'courses',sections:'sections'};
      btn.addEventListener('click',()=>exportManage(pageMap[page]||page));
    }
  });

  /* Inject Back buttons */
  _injectBackButtons();

  /* Hide all nav except login initially */
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\s*\(\s*['""]([^'""]+)['"]/);
    const pageId = match?match[1]:'';
    if(pageId!=='login') btn.style.display='none';
  });

  /* ── Try to restore session from saved token ── */
  const restored = await restoreSession();
  if(restored){
    const firstPage = APP.currentRole==='admin'?'dash': APP.currentRole==='teacher'?'dash-teacher':'dash-student';
    goPage(firstPage);
  }
});

function _injectBackButtons(){
  const pagesWithBack=['tt','clash','req','notif','analytics','makett','teachers','rooms','courses','sections'];
  pagesWithBack.forEach(pid=>{
    const page=document.getElementById(pid); if(!page) return;
    const header=page.querySelector('.main-header');
    if(!header||header.querySelector('.back-btn')) return;
    const btn=document.createElement('button');
    btn.className='btn btn-ghost back-btn';
    btn.style.marginRight='.5rem';
    btn.innerHTML='← Back';
    btn.addEventListener('click', goBack);
    header.insertBefore(btn, header.firstChild);
  });
}

/* §27  EXPOSE ALL FUNCTIONS ON window */
window.show               = show;
window.goPage             = goPage;
window.goBack             = goBack;
window.sidebarNav         = sidebarNav;
window.handleLogin        = handleLogin;
window.logoutUser         = logoutUser;

/* Core approval actions */
window.approveRequest     = approveRequest;
window.rejectRequest      = rejectRequest;

/* Clash */
window.resolveClash       = resolveClash;

/* Builder */
window.removeCell         = removeCell;
window.selectCell         = selectCell;
window.addClassToGrid     = addClassToGrid;
window.updateCourseColor  = updateCourseColor;
window.checkConflict      = checkConflict;
window.changeBatchView    = changeBatchView;
window.changeSectionView  = changeSectionView;
window.changeViewMode     = changeViewMode;
window.openPublishModal   = openPublishModal;
window.closePublishModal  = closePublishModal;
window.confirmPublish     = confirmPublish;
window.clearTimetable     = clearTimetable;
window.saveDraft          = saveDraft;

/* Notifications */
window.markRead           = markRead;
window.markAllRead        = markAllRead;
window.setNotifFilter     = setNotifFilter;

/* Requests */
window.switchTab          = switchTab;
window.submitRequest      = submitRequest;

/* TT view */
window.switchTTView       = switchTTView;
window.onTTBatchChange    = onTTBatchChange;
window.onTTSectionChange  = onTTSectionChange;

/* Export / sort */
window.exportPDF          = exportPDF;
window.exportManage       = exportManage;
window.sortManage         = sortManage;
window.comingSoon         = comingSoon;
window.openSettingsModal  = openSettingsModal;
window.toggleDarkMode     = toggleDarkMode;

/* Teachers */
window.openTeacherForm    = openTeacherForm;
window.editTeacher        = editTeacher;
window.saveTeacher        = saveTeacher;
window.cancelTeacherForm  = cancelTeacherForm;
window.deleteTeacher      = deleteTeacher;
window.viewTeacherTT      = viewTeacherTT;
window.teacherAddCourse   = teacherAddCourse;
window.renderTeacherTable = renderTeacherTable;

/* Rooms */
window.openRoomForm       = openRoomForm;
window.editRoom           = editRoom;
window.saveRoom           = saveRoom;
window.cancelRoomForm     = cancelRoomForm;
window.deleteRoom         = deleteRoom;
window.renderRoomTable    = renderRoomTable;

/* Courses */
window.openCourseForm     = openCourseForm;
window.editCourse         = editCourse;
window.saveCourse         = saveCourse;
window.cancelCourseForm   = cancelCourseForm;
window.deleteCourse       = deleteCourse;
window.renderCourseTable  = renderCourseTable;

/* Sections */
window.openSectionForm    = openSectionForm;
window.editSection        = editSection;
window.saveSection        = saveSection;
window.cancelSectionForm  = cancelSectionForm;
window.deleteSection      = deleteSection;
window.viewSectionTT      = viewSectionTT;
window.renderSectionTable = renderSectionTable;

/* Dashboard preview */
window.renderDashTTPreview     = renderDashTTPreview;
window.renderDashPendingRequests = renderDashPendingRequests;

/* Demo credentials log */
console.log('%cIBIT TAS v5.0 — API-Connected','color:#2563EB;font-weight:bold;font-size:14px');
console.log('Backend: http://localhost:8000');
console.log('Frontend: http://localhost:3000');
console.log('Admin:   admin@ibit.edu.pk   / 12345678');
console.log('Teacher: teacher@ibit.edu.pk / 12345678');
console.log('Student: student@ibit.edu.pk / 12345678');
