/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — teacher-init.js  [FIXED]
   Teacher dashboard — pulls REAL data from API.
═══════════════════════════════════════════════════════════════ */

const TEACHER_STATE = {
  profile: {},
  stats: { todayClasses:0, weekClasses:0, cancellations:0, pendingRequests:0 },
  schedule: [],
  requests: [],
  notifications: [],
};

/* ════════════════════════════════════════════
   MAIN LOADER — called by navigation._onPageEnter
════════════════════════════════════════════ */
async function loadTeacherDashboardData(){
  try {
    /* Load all shared data (courses, sections, timetable) */
    await loadAllData();

    /* Teacher profile */
    let profile = {};
    try {
      const pRes = await API.get('/auth/me');
      profile = pRes.data || pRes || {};
    } catch(e){}
    TEACHER_STATE.profile = profile;

    /* Fetch requests made by this teacher */
    let myRequests = [];
    try {
      const rRes = await API.get('/requests');
      myRequests = (rRes.data || []).filter(r =>
        !r.teacherName || r.teacherName === profile.name ||
        !r.teacherId   || r.teacherId   === profile.id
      );
    } catch(e){}
    TEACHER_STATE.requests = myRequests;

    /* Derive stats from real timetable data */
    _computeTeacherStats(profile, myRequests);

    /* Render UI sections */
    _renderTeacherStatCards();
    _renderTeacherTodaySchedule(profile);
    _renderTeacherRequestList(myRequests);
    _renderTeacherWeeklyChart(profile);
    _renderTeacherNotifications(myRequests);

    /* Badge updates */
    _updateTeacherBadges(myRequests);

    /* Update profile header elements */
    safeSet('teacherName',  profile.name  || 'Teacher');
    safeSet('teacherDept',  profile.dept  || profile.department || '');
    safeSet('teacherEmail', profile.email || '');

    /* Set current date */
    const dateEl = document.getElementById('currentDate');
    if(dateEl){
      dateEl.textContent = new Date().toLocaleDateString('en-US',
        { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }

  } catch(err){
    console.error('loadTeacherDashboardData failed:', err);
  }
}

function _computeTeacherStats(profile, myRequests){
  const myName = profile.name || '';
  const today  = new Date();
  const todayDow = today.getDay(); /* 0=Sun … 6=Sat */
  const todayIdx = (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  /* Count slots assigned to this teacher */
  let todayCount = 0, weekCount = 0;
  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    if(entry.teacher !== myName) return;
    weekCount++;
    const dayIdx = parseInt(key.split('-')[0]);
    if(dayIdx === todayIdx) todayCount++;
  });

  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  const cancelCount  = myRequests.filter(r => r.type   === 'cancel').length;

  TEACHER_STATE.stats = {
    todayClasses:    todayCount,
    weekClasses:     weekCount,
    cancellations:   cancelCount,
    pendingRequests: pendingCount,
  };
}

function _renderTeacherStatCards(){
  const s = TEACHER_STATE.stats;
  safeSet('todayClasses',  s.todayClasses);
  safeSet('weekClasses',   s.weekClasses);
  safeSet('myCancellations', s.cancellations);
  safeSet('myPending',     s.pendingRequests);
}

function _renderTeacherTodaySchedule(profile){
  const container = document.getElementById('teacherTodaySchedule');
  if(!container) return;

  const myName  = profile.name || '';
  const today   = new Date();
  const todayDow= today.getDay();
  const todayIdx= (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  if(todayIdx === -1){
    container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text3)">No classes on weekends</td></tr>';
    return;
  }

  /* Gather all timetable entries for today */
  const todaySlots = [];
  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    if(entry.teacher !== myName) return;
    const [dayIdx, slotIdx, secIdx] = key.split('-').map(Number);
    if(dayIdx === todayIdx){
      todaySlots.push({ slotIdx, entry, secIdx });
    }
  });
  todaySlots.sort((a,b) => a.slotIdx - b.slotIdx);

  if(todaySlots.length === 0){
    container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text3);font-size:.85rem">No classes scheduled for today</td></tr>';
    return;
  }

  const header = '<tr><th>Time</th><th>Course</th><th>Room</th><th>Section</th></tr>';
  const rows = todaySlots.map(({ slotIdx, entry }) => `
    <tr>
      <td style="font-weight:600;color:var(--gold-lt);font-size:.82rem">${SLOT_LABELS[slotIdx] || ''}</td>
      <td>
        <div style="font-weight:600;color:var(--text)">${entry.name}</div>
        <div style="font-size:.72rem;color:var(--text3)">${entry.code}</div>
      </td>
      <td style="color:var(--text2);font-size:.82rem">${entry.room}</td>
      <td style="color:var(--text2);font-size:.82rem">${entry.section}</td>
    </tr>`).join('');

  container.innerHTML = header + rows;
  TEACHER_STATE.schedule = todaySlots;
}

function _renderTeacherRequestList(requests){
  const container = document.getElementById('myRequestList');
  if(!container) return;

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'approved');

  if(pending.length === 0){
    container.innerHTML = '<div class="empty-state" style="padding:1rem;text-align:center;color:var(--text3);font-size:.82rem">No active requests</div>';
    return;
  }

  container.innerHTML = pending.map(r => {
    const statusColor = r.status === 'approved' ? 'var(--teal)' : r.status === 'rejected' ? 'var(--coral)' : 'var(--amber)';
    return `
      <div class="req-item" style="display:flex;align-items:flex-start;gap:.75rem;padding:.75rem 0;border-bottom:1px solid #F1F5F9">
        <div class="req-type" style="font-size:.7rem;font-weight:700;padding:.2rem .5rem;background:var(--amber-dim);color:var(--amber);border-radius:5px;white-space:nowrap">${r.type}</div>
        <div class="req-details" style="flex:1;min-width:0">
          <div class="req-title" style="font-weight:600;color:var(--text);font-size:.85rem">${r.course||''} ${r.section?`- ${r.section}`:''}</div>
          <div class="req-desc" style="font-size:.78rem;color:var(--text2);margin:.2rem 0">${r.reason||r.detail||''}</div>
          <div class="req-meta" style="font-size:.72rem;color:${statusColor};font-weight:600">
            Status: ${r.status}
            ${r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('en-PK',{month:'short',day:'numeric'})}` : ''}
          </div>
        </div>
        ${r.status === 'pending' ? `
          <button class="btn btn-coral btn-sm" onclick="cancelMyRequest(${r.id})" style="font-size:.72rem;padding:.25rem .55rem;border-radius:7px">Cancel</button>
        ` : ''}
      </div>`;
  }).join('');
}

async function cancelMyRequest(id){
  try {
    await API.delete(`/requests/${id}`);
    showToast('Request cancelled', 'success');
    await loadTeacherDashboardData();
  } catch(e){
    showToast(e.message || 'Could not cancel request', 'error');
  }
}

function _renderTeacherWeeklyChart(profile){
  const chartEl = document.getElementById('teacherWeeklyChart');
  if(!chartEl) return;

  const myName = profile.name || '';
  const daySlotCounts = [0,0,0,0,0];

  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    if(entry.teacher !== myName) return;
    const dayIdx = parseInt(key.split('-')[0]);
    if(dayIdx >= 0 && dayIdx < 5) daySlotCounts[dayIdx]++;
  });

  const maxVal = Math.max(...daySlotCounts, 1);
  chartEl.innerHTML = ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => {
    const pct = Math.round((daySlotCounts[i] / maxVal) * 90);
    return `
      <div class="bar-wrap" style="display:flex;flex-direction:column;align-items:center;gap:.3rem;flex:1">
        <div class="bar" style="height:${pct || 4}%;background:var(--gold-lt);border-radius:4px 4px 0 0;min-height:4px;width:60%;transition:height .4s ease" title="${daySlotCounts[i]} classes"></div>
        <div class="bar-label" style="font-size:.68rem;color:var(--text3)">${d}</div>
      </div>`;
  }).join('');
}

function _renderTeacherNotifications(requests){
  /* Show latest request status changes as notifications */
  const notifList = document.getElementById('teacherNotifList') || document.getElementById('notifList');
  if(!notifList) return;

  const recent = requests.slice(0, 5);
  if(recent.length === 0){
    notifList.innerHTML = '<div style="padding:.75rem;text-align:center;color:var(--text3);font-size:.82rem">No notifications</div>';
    return;
  }

  notifList.innerHTML = recent.map(r => {
    const color = r.status === 'approved' ? 'var(--teal)' : r.status === 'rejected' ? 'var(--coral)' : 'var(--amber)';
    const icon  = r.status === 'approved' ? '✅' : r.status === 'rejected' ? '✕' : '⏳';
    return `
      <div class="activity-item" style="display:flex;gap:.75rem;padding:.6rem 0;border-bottom:1px solid #F1F5F9">
        <div class="activity-dot" style="background:${color};min-width:8px;height:8px;border-radius:50%;margin-top:.35rem"></div>
        <div>
          <div class="activity-text" style="font-size:.82rem;color:var(--text)"><strong>${icon} ${r.type} request</strong> — ${r.course||''}</div>
          <div class="activity-time" style="font-size:.72rem;color:var(--text3);margin-top:.15rem">Status: ${r.status}</div>
        </div>
      </div>`;
  }).join('');

  TEACHER_STATE.notifications = recent;
}

function _updateTeacherBadges(requests){
  const pending = requests.filter(r => r.status === 'pending').length;
  safeSet('reqCount', pending);
  safeSet('myPending', pending);
}

/* ── Load request history panel ── */
function loadRequestHistory(){
  _renderTeacherRequestList(TEACHER_STATE.requests);
}

/* Populate request form dropdowns for teacher */
function _applyReqTabVisibility(){
  /* Hide admin-only elements for teachers */
  if(APP.currentRole !== 'admin'){
    document.getElementById('adminReqNote')?.classList.remove('hidden');
  }
}

/* ── Auto-refresh ── */
setInterval(async () => {
  if(APP.currentRole !== 'teacher') return;
  const page = document.querySelector('.page.active')?.id;
  if(page === 'dash-teacher') await loadTeacherDashboardData();
}, 30000);
