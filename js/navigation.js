/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — navigation.js  [FIXED]
   §13  PAGE NAVIGATION + BACK BUTTON
   - Fixed: analytics page now loads real data on enter
   - Fixed: dash-teacher and dash-student also refresh on enter
═══════════════════════════════════════════════════════════════ */

async function show(id, btn){
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
  await _onPageEnter(id);
}

async function goPage(id){
  const allowed = ROLE_ACCESS[APP.currentRole] || ['login'];
  if(id !== 'login' && !allowed.includes(id)){ showToast('Access denied', 'error'); return; }
  APP.prevPage = _currentPage();
  _activatePage(id);
  _syncTopNav(id);
  window.scrollTo(0, 0);
  await _onPageEnter(id);
}

function _syncTopNav(id){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/show\(\s*['"]([^'"]+)['"]/);
    btn.classList.toggle('active', !!(m && m[1] === id));
  });
}

function goBack(){
  if(APP.prevPage && APP.prevPage !== _currentPage()){
    goPage(APP.prevPage);
  } else {
    const home = APP.currentRole === 'admin' ? 'dash'
               : APP.currentRole === 'teacher' ? 'dash-teacher' : 'dash-student';
    goPage(home);
  }
}

function _currentPage(){
  const active = document.querySelector('.page.active');
  return active ? active.id : 'login';
}

function sidebarNav(item, pageId){
  const sidebar = item.closest('.sidebar');
  if(sidebar) sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  goPage(pageId);
}

function _activatePage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

async function _onPageEnter(id){
  switch(id){

    /* ── Admin pages ── */
    case 'makett':
      await loadAllData();
      _populateBuilderDropdowns();
      buildGrid();
      break;

    case 'teachers':
      await _refreshIfStale();
      renderTeacherTable();
      populateTeacherCourseDropdown();
      break;

    case 'rooms':
      await _refreshIfStale();
      renderRoomTable();
      break;

    case 'courses':
      await _refreshIfStale();
      renderCourseTable();
      break;

    case 'sections':
      await _refreshIfStale();
      renderSectionTable();
      break;

    case 'notif':
      renderNotifFeed();
      break;

    case 'tt':
      /* Reload data so dropdowns + grid use fresh info */
      await loadAllData();
      renderTimetableView();
      break;

    case 'clash':
      renderClashPage();
      break;

    case 'req':
      _applyReqTabVisibility();
      /* Ensure dropdowns have real data */
      if(coursesData.length === 0 || sectionsData.length === 0) await loadAllData();
      populateRequestDropdowns();
      if(APP.currentRole === 'admin') renderAdminReqList();
      break;

    case 'dash':
      /* Admin dashboard: refresh stats + real pending requests */
      await loadAdminDashboardData();
      renderDashPendingRequests();
      renderDashTTPreview();
      break;

    /* ── Teacher dashboard ── */
    case 'dash-teacher':
      await loadTeacherDashboardData();
      break;

    /* ── Student dashboard ── */
    case 'dash-student':
      await loadStudentDashboardData();
      break;

    /* ── Analytics — load real data ── */
    case 'analytics':
      await loadAnalyticsData();
      break;
  }
}

/* ──────────────────────────────────────────
   Refresh global arrays only if they're empty
────────────────────────────────────────── */
async function _refreshIfStale(){
  if(teachersData.length === 0 && APP.currentRole === 'admin') await loadAllData();
  else if(coursesData.length === 0) await loadAllData();
}

