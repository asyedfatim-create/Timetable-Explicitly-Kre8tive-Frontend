/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — navigation.js
   §13  PAGE NAVIGATION + BACK BUTTON
═══════════════════════════════════════════════════════════════ */

function show(id, btn){
  if(id !== 'login' && !ROLE_ACCESS[APP.currentRole]?.includes(id)){
    showToast('Access denied.', 'error'); return;
  }
  APP.prevPage = _currentPage();
  _activatePage(id);
  _syncTopNav(id);
  if(btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  window.scrollTo(0, 0);
  _onPageEnter(id);
}

function goPage(id){
  const allowed = ROLE_ACCESS[APP.currentRole] || ['login'];
  if(id !== 'login' && !allowed.includes(id)){ showToast('Access denied', 'error'); return; }
  APP.prevPage = _currentPage();
  _activatePage(id);
  _syncTopNav(id);
  window.scrollTo(0, 0);
  _onPageEnter(id);
}

function _syncTopNav(id){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/show\(\s*['"]([^'"]+)['"]/);
    btn.classList.toggle('active', !!(m && m[1] === id));
  });
}

function goBack(){
  if(APP.prevPage&&APP.prevPage!==_currentPage()){
    goPage(APP.prevPage);
  } else {
    const home = APP.currentRole==='admin'?'dash': APP.currentRole==='teacher'?'dash-teacher':'dash-student';
    goPage(home);
  }
}

function _currentPage(){
  const active = document.querySelector('.page.active');
  return active?active.id:'login';
}

function sidebarNav(item, pageId){
  const sidebar = item.closest('.sidebar');
  if(sidebar) sidebar.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  item.classList.add('active');
  goPage(pageId);
}

function _activatePage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function _onPageEnter(id){
  switch(id){
    case 'makett':   buildGrid(); break;
    case 'teachers': renderTeacherTable(); populateTeacherCourseDropdown(); break;
    case 'rooms':    renderRoomTable(); break;
    case 'courses':  renderCourseTable(); break;
    case 'sections': renderSectionTable(); break;
    case 'notif':    renderNotifFeed(); break;
    case 'tt':       renderTimetableView(); break;
    case 'clash':    renderClashPage(); break;
    case 'req':      _applyReqTabVisibility(); break;
    case 'dash':     renderDashPendingRequests(); renderDashTTPreview(); break;
  }
}
