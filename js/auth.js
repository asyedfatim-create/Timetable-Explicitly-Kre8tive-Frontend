/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — auth.js
   §11  LOGIN (via API)
   §12  ROLE-BASED ACCESS + UI GUARD
   §25  LOGOUT
═══════════════════════════════════════════════════════════════ */

/* §11  LOGIN */
async function handleLogin(){
  const emailEl = document.querySelector('.login-right .form-input[type="email"]');
  const passEl  = document.querySelector('.login-right .form-input[type="password"]');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pass    = (passEl?.value||'').trim();
  const selectedRoleEl = document.querySelector('.login-right .role-card.selected .role-name');
  const selectedRole   = (selectedRoleEl?.textContent||'').toLowerCase();

  if(!email||!pass){ showToast('Please enter email and password','error'); return; }
  if(!selectedRole){ showToast('Please select a role','error'); return; }

  try {
    const res = await API.post('/auth/login', { email, password: pass, role: selectedRole });
    if(!res.success){ showToast(res.message||'Login failed','error'); return; }

    /* Store token */
    API.setToken(res.token);

    APP.currentRole = res.user.role;
    APP.currentUser = { id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role };

    showToast(`✓ Welcome, ${res.user.name}! Logged in as ${res.user.role}`,'success');

    /* Load all data from backend */
    await loadAllData();

    /* Seed notifications from backend */
    await _loadNotificationsFromAPI();

    /* Load pending requests for admin */
    if(res.user.role === 'admin'){
      await _loadRequestsFromAPI();
    }

    applyRoleAccess();
    const firstPage = res.user.role==='admin'?'dash': res.user.role==='teacher'?'dash-teacher':'dash-student';
    goPage(firstPage);

  } catch(err) {
    const msg = err.message || 'Login failed';
    showToast(msg, 'error');
  }
}

async function _loadNotificationsFromAPI(){
  try {
    const res = await API.get('/notifications');
    APP.notifications = (res.data||[]).map(n => ({
      id: n.id, title: n.title, msg: n.message, type: n.type,
      time: n.time ? new Date(n.time).toLocaleString() : timestamp(),
      unread: n.unread
    }));
    _updateNotifBadges();
  } catch(err) {
    console.warn('Could not load notifications:', err);
  }
}

async function _loadRequestsFromAPI(){
  try {
    const res = await API.get('/requests?status=pending');
    APP.pendingRequests = (res.data||[]).map(r => ({
      id: r.id, type: r.type, teacher: r.teacherName,
      detail: r.detail, course: r.course, section: r.section, status: r.status
    }));
    _updateRequestBadges();
  } catch(err) {
    console.warn('Could not load requests:', err);
  }
}

/* §12  ROLE-BASED ACCESS + UI GUARD */
function applyRoleAccess(){
  const allowed = ROLE_ACCESS[APP.currentRole]||['login'];
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\s*\(\s*['""]([^'""]+)['"]/);
    const pageId = match?match[1]:'';
    btn.style.display = (!pageId||pageId==='login'||!allowed.includes(pageId))?'none':'';
  });
  _applyReqTabVisibility();
}

function _applyReqTabVisibility(){
  const reqPage = document.getElementById('req');
  if(!reqPage) return;
 
  const formCard  = reqPage.querySelector('.form-card');
  const tabBar    = reqPage.querySelector('.req-type-tabs');
  const reqLayout = reqPage.querySelector('.req-layout');
  const adminNote = reqPage.querySelector('#adminReqNote');
 
  if(APP.currentRole === 'admin'){
    if(reqLayout) reqLayout.style.display = 'none';
    if(!adminNote){
      const note = document.createElement('div');
      note.id = 'adminReqNote';
      note.style.cssText = [
        'background:var(--gold-dim)',
        'border:1.5px solid rgba(29,78,216,.2)',
        'border-radius:14px',
        'padding:1.5rem 2rem',
        'margin-bottom:1.5rem',
        'color:var(--gold-lt)',
        'font-size:.9rem',
        'font-weight:600',
      ].join(';');
      note.innerHTML = '🛡️ <strong>Admin view:</strong> Review and approve/reject pending teacher requests below.';
      reqPage.querySelector('.req-page')?.appendChild(note);
    }
    renderAdminReqList();
  } else if(APP.currentRole === 'teacher'){
    if(reqLayout) reqLayout.style.display = '';
    document.getElementById('adminReqNote')?.remove();
    document.getElementById('adminPendingList')?.remove();
  }
}

/* §25  LOGOUT */
async function logoutUser(){
  try { await API.post('/auth/logout', {}); } catch(e) { /* ignore */ }
  API.clearToken();
  APP.currentRole='guest'; APP.currentUser=null;
  APP.notifications=[]; APP.pendingRequests=[];
  teachersData=[]; roomsData=[]; coursesData=[]; sectionsData=[];
  timetableData={}; APP.publishedTimetable={};
  COURSES=[]; TEACHERS=[]; ROOMS=[]; SECTIONS=[];
  notifActiveFilter='all';
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\s*\(\s*['""]([^'""]+)['"]/);
    const pageId = match?match[1]:'';
    btn.style.display=(pageId==='login')?'':'none';
    btn.classList.remove('active');
  });
  document.querySelectorAll('.sidebar-item').forEach(i=>{ i.style.display=''; i.classList.remove('active'); });
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('login').classList.add('active');
  document.getElementById('adminReqNote')?.remove();
  document.getElementById('adminPendingList')?.remove();
  showToast('Logged out successfully','');
}

/* Restore session on page load if token exists */
async function restoreSession(){
  const token = API.getToken();
  if(!token) return false;
  try {
    const user = await API.get('/auth/me');
    APP.currentRole = user.role;
    APP.currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await loadAllData();
    await _loadNotificationsFromAPI();
    if(user.role === 'admin') await _loadRequestsFromAPI();
    applyRoleAccess();
    return true;
  } catch(err) {
    API.clearToken();
    return false;
  }
}
