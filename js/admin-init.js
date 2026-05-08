/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — admin-init.js  [FIXED]
   Admin dashboard initialization — pulls REAL data from API.
   Also exports loadAnalyticsData() used by navigation.js.
═══════════════════════════════════════════════════════════════ */

/* ── Local state ── */
const ADMIN_STATE = {
  stats: {},
  recentActivity: [],
  pendingApprovals: [],
  notifications: [],
  analyticsData: null,
};

/* ════════════════════════════════════════════
   DASHBOARD INIT
════════════════════════════════════════════ */
async function loadAdminDashboardData(){
  try {
    /* 1. Stats from /dashboard/stats */
    let stats = {};
    try {
      const res = await API.get('/dashboard/stats');
      stats = res || {};
    } catch(e){ console.warn('Dashboard stats fetch failed:', e); }

    /* 2. Pending requests count from /requests?status=pending */
    let pendingCount = 0;
    try {
      const rRes = await API.get('/requests?status=pending');
      pendingCount = (rRes.data || []).length;
    } catch(e){}

    /* 3. Populate stat cards */
    _renderAdminStatCards(stats, pendingCount);

    /* 4. Populate mini-charts on dashboard (uses timetable data) */
    _renderAdminMiniCharts();

    /* 5. Recent activity from requests */
    await _renderAdminRecentActivity();

  } catch(err){
    console.error('loadAdminDashboardData failed:', err);
  }
}

function _renderAdminStatCards(stats, pendingCount){
  /* Map backend stat structure → display */
  const t = stats.teachers   || {};
  const r = stats.rooms      || {};
  const c = stats.courses    || {};
  const s = stats.sections   || {};
  const tt= stats.timetable  || {};

  /* Teachers card */
  safeSet('statTeachersTotal',  t.total   ?? '—');
  safeSet('statTeachersActive', t.active  ?? '—');
  safeSet('statTeachersLeave',  t.onLeave ?? '—');
  safeSet('statTeachersLoad',   t.avgLoad ? t.avgLoad + '/wk' : '—');

  /* Rooms card */
  safeSet('statRoomsTotal',    r.total          ?? '—');
  safeSet('statRoomsAvail',    r.available      ?? '—');
  safeSet('statRoomsCapacity', r.totalCapacity  ?? '—');
  safeSet('statRoomsUtil',     r.avgUtilization ? r.avgUtilization + '%' : '—');

  /* Courses card */
  safeSet('statCoursesTotal',    c.total    ?? '—');
  safeSet('statCoursesCore',     c.core     ?? '—');
  safeSet('statCoursesElective', c.elective ?? '—');
  safeSet('statCoursesLab',      c.lab      ?? '—');

  /* Sections card */
  safeSet('statSectionsTotal',    s.total          ?? '—');
  safeSet('statSectionsStudents', s.totalStudents   ?? '—');
  safeSet('statSectionsAvg',      s.avgPerSection   ?? '—');
  safeSet('statSectionsNearFull', s.nearFull        ?? '—');

  /* Timetable / clash / pending */
  safeSet('statTTSlots',   tt.totalSlots ?? Object.keys(timetableData||{}).length || '—');
  safeSet('statTTClashes', tt.clashCount ?? '0');
  safeSet('statTTStatus',  tt.status     ?? '—');
  safeSet('statPending',   pendingCount  ?? '—');

  /* Badges in sidebar */
  safeSet('clashCount',  tt.clashCount ?? 0);
  safeSet('reqCount',    pendingCount);
  safeSet('pendingCount', `${pendingCount} waiting`);

  ADMIN_STATE.stats = { ...stats, pendingRequests: pendingCount };
}

function _renderAdminMiniCharts(){
  /* Use actual timetableData to show filled vs empty slots */
  const total = 5 * 7; /* 5 days × 7 slots */
  const filled = Object.keys(timetableData || {}).length;
  const pct = total ? Math.round((filled / total) * 100) : 0;

  const el = document.getElementById('dashTTFillPct');
  if(el) el.textContent = pct + '%';

  const bar = document.getElementById('dashTTFillBar');
  if(bar) bar.style.width = pct + '%';
}

async function _renderAdminRecentActivity(){
  /* Pull from /requests (latest approved/rejected + pending) */
  try {
    const res = await API.get('/requests');
    const items = (res.data || []).slice(0, 8);
    const container = document.getElementById('recentActivity');
    if(!container) return;

    if(items.length === 0){
      container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text3);font-size:.82rem">No recent activity</div>';
      return;
    }

    container.innerHTML = items.map(r => {
      const color = r.status === 'approved' ? 'var(--teal)'
                  : r.status === 'rejected' ? 'var(--coral)'
                  : 'var(--amber)';
      const icon  = r.status === 'approved' ? '✅'
                  : r.status === 'rejected' ? '✕'
                  : '⏳';
      return `
        <div class="activity-item">
          <div class="activity-dot" style="background:${color}"></div>
          <div>
            <div class="activity-text"><strong>${icon} ${r.teacherName||r.teacher||'Teacher'}</strong> — ${r.type} · ${r.course||''}</div>
            <div class="activity-time">${r.createdAt ? new Date(r.createdAt).toLocaleString('en-PK',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Recently'}</div>
          </div>
        </div>`;
    }).join('');
    ADMIN_STATE.recentActivity = items;
  } catch(e){
    console.warn('Recent activity load failed:', e);
  }
}

/* ════════════════════════════════════════════
   ANALYTICS — loads real data from API
════════════════════════════════════════════ */
async function loadAnalyticsData(){
  try {
    /* Fetch stats + requests in parallel */
    const [statsRes, reqRes] = await Promise.allSettled([
      API.get('/dashboard/stats'),
      API.get('/requests'),
    ]);

    const stats   = statsRes.status === 'fulfilled'  ? (statsRes.value  || {}) : {};
    const allReqs = reqRes.status   === 'fulfilled'  ? (reqRes.value?.data || []) : [];

    /* Update analytics KPI cards */
    _renderAnalyticsKPIs(stats, allReqs);

    /* Weekly performance chart */
    _renderAnalyticsWeeklyChart(allReqs);

    /* Cancellation breakdown donut */
    _renderCancellationDonut(allReqs);

    /* Teacher performance table */
    _renderTeacherPerformance();

    /* Room utilization bars */
    _renderRoomUtilization();

    /* Update header subtitle */
    const sub = document.querySelector('#analytics .analytics-sub');
    if(sub){
      const now = new Date();
      const month = now.toLocaleString('en',{month:'long', year:'numeric'});
      sub.textContent = `${month} · Live Data`;
    }

  } catch(err){
    console.error('loadAnalyticsData failed:', err);
    showToast('Could not load analytics data', 'error');
  }
}

function _renderAnalyticsKPIs(stats, allReqs){
  const tt = stats.timetable || {};
  const totalSlots = tt.totalSlots || Object.keys(timetableData || {}).length || 0;

  const approved  = allReqs.filter(r => r.status === 'approved').length;
  const cancelled = allReqs.filter(r => r.type   === 'cancel').length;
  const makeup    = allReqs.filter(r => r.type   === 'makeup').length;
  const pending   = allReqs.filter(r => r.status === 'pending').length;

  const completionPct = totalSlots ? Math.round(((totalSlots - cancelled) / totalSlots) * 100) : 0;

  /* KPI numbers */
  safeSet('analyticsKpiTotal',      totalSlots);
  safeSet('analyticsKpiConducted',  totalSlots - cancelled);
  safeSet('analyticsKpiCancelled',  cancelled);
  safeSet('analyticsKpiMakeup',     makeup);

  /* KPI subtexts */
  safeSet('analyticsKpiCompletionPct',    `${completionPct}% completion`);
  safeSet('analyticsKpiMakeupBreakdown',  `${approved} approved · ${pending} pending`);
}

function _renderAnalyticsWeeklyChart(allReqs){
  const chartEl = document.querySelector('#analytics .bar-chart');
  if(!chartEl) return;

  /* Group requests by week of current month */
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const totalSlotsPerWeek = 5 * 7; /* rough estimate */

  /* Compute cancellations per week */
  const weekCancels = [0,0,0,0];
  allReqs.filter(r=>r.type==='cancel').forEach(r=>{
    const d = r.createdAt ? new Date(r.createdAt) : null;
    if(d && d.getFullYear()===year && d.getMonth()===month){
      const week = Math.min(3, Math.floor((d.getDate()-1)/7));
      weekCancels[week]++;
    }
  });

  /* Scheduled is total timetable slots (constant per week) */
  const weekScheduled = [totalSlotsPerWeek, totalSlotsPerWeek, totalSlotsPerWeek, totalSlotsPerWeek];
  const weekConducted = weekScheduled.map((s,i) => Math.max(0, s - weekCancels[i]));
  const maxVal = Math.max(...weekScheduled, 1);

  chartEl.innerHTML = ['W1','W2','W3','W4'].map((label, i) => {
    const s = Math.round((weekScheduled[i]/maxVal)*100);
    const c = Math.round((weekConducted[i]/maxVal)*100);
    const x = Math.round((weekCancels[i]/maxVal)*100);
    return `
      <div style="flex:1">
        <div class="bc-group">
          <div class="bc-bar" style="height:${s}%;background:var(--gold-lt)" title="Scheduled: ${weekScheduled[i]}"></div>
          <div class="bc-bar" style="height:${c}%;background:var(--teal)"    title="Conducted: ${weekConducted[i]}"></div>
          <div class="bc-bar" style="height:${Math.max(x,2)}%;background:var(--coral)" title="Cancelled: ${weekCancels[i]}"></div>
        </div>
        <div class="bc-label">${label}</div>
      </div>`;
  }).join('');
}

function _renderCancellationDonut(allReqs){
  const cancels = allReqs.filter(r => r.type === 'cancel');
  const total   = cancels.length || 0;

  /* Categorise by whether reason was given or rescheduled */
  const noNotice   = cancels.filter(r => !r.reason || r.reason.trim() === '').length;
  const withNotice = cancels.filter(r =>  r.reason && r.reason.trim() !== '' && r.status !== 'approved').length;
  const rescheduled= cancels.filter(r =>  r.status === 'approved').length;

  /* Update donut SVG center text */
  const svgText = document.querySelector('#analytics .donut-wrap svg text:first-of-type');
  if(svgText) svgText.textContent = total;

  /* Update legend percentages */
  if(total > 0){
    safeSet('analyticsDonutNoNotice',   Math.round((noNotice/total)*100)+'%');
    safeSet('analyticsDonutWithNotice', Math.round((withNotice/total)*100)+'%');
    safeSet('analyticsDonutRescheduled',Math.round((rescheduled/total)*100)+'%');
  }
}

function _renderTeacherPerformance(){
  const tbody = document.querySelector('#analytics .teacher-table');
  if(!tbody || teachersData.length === 0) return;

  /* Build rows from real teachersData */
  const rows = teachersData.slice(0, 8).map(t => {
    /* Use timetable data to calculate assigned slots */
    const assignedSlots = Object.values(timetableData || {}).filter(e => e.teacher === t.name).length;
    const load = t.load || 0;
    const rate = load ? Math.min(100, Math.round((assignedSlots / load) * 100)) : 0;
    const rateColor = rate >= 90 ? 'var(--teal)' : rate >= 70 ? 'var(--amber)' : 'var(--coral)';
    return `
      <tr>
        <td style="font-weight:600;color:var(--text)">${t.name}</td>
        <td>${load}</td>
        <td>${assignedSlots}</td>
        <td>${Math.max(0, load - assignedSlots)}</td>
        <td>
          <div class="perf-bar-wrap">
            <div class="perf-bar"><div class="perf-fill" style="width:${rate}%;background:${rateColor}"></div></div>
            <div class="perf-pct" style="color:${rateColor}">${rate}%</div>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.innerHTML = `
    <tr><th>Teacher</th><th>Scheduled</th><th>Conducted</th><th>Cancelled</th><th>Rate</th></tr>
    ${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:1rem">No teacher data available</td></tr>'}
  `;
}

function _renderRoomUtilization(){
  const container = document.querySelector('#analytics .analytics-bottom .chart-card:last-child > div:not([class])');
  if(!container || roomsData.length === 0) return;

  const sorted = [...roomsData].sort((a,b) => (b.util||0) - (a.util||0)).slice(0, 7);

  container.innerHTML = sorted.map(r => {
    const util = r.util || 0;
    const color = util >= 85 ? 'var(--gold-lt)' : util >= 65 ? 'var(--teal)' : util >= 45 ? 'var(--amber)' : 'var(--coral)';
    return `
      <div style="display:flex;align-items:center;gap:.75rem">
        <div style="font-size:.85rem;min-width:80px;color:var(--text)">${r.name}</div>
        <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden">
          <div style="width:${util}%;height:100%;background:${color};border-radius:4px;transition:width .5s ease"></div>
        </div>
        <div style="font-size:.78rem;font-weight:700;color:${color};min-width:34px;text-align:right">${util}%</div>
      </div>`;
  }).join('');

  /* Insight text */
  const topRoom = sorted[0];
  const insightEl = document.querySelector('#analytics .analytics-bottom .chart-card:last-child [style*="teal-dim"]');
  if(insightEl && topRoom){
    insightEl.querySelector('div:last-child').textContent =
      `${topRoom.name} has the highest utilization at ${topRoom.util}%.`+
      (topRoom.util >= 85 ? ` Consider redistributing classes to balance the load.` : ` Utilization looks healthy.`);
  }
}

/* ════════════════════════════════════════════
   REQUEST ACTIONS (admin approve/reject)
════════════════════════════════════════════ */
async function approveRequest(id){
  id = Number(id);
  try {
    const res = await API.patch(`/requests/${id}/approve`, {});
    showToast(`✓ ${res.message || 'Request approved'}`, 'success');
  } catch(err){
    showToast(err.message || 'Failed to approve', 'error'); return;
  }
  const req = APP.pendingRequests.find(r => r.id === id);
  if(req) req.status = 'approved';
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el => el.remove());
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
}

async function rejectRequest(id){
  id = Number(id);
  try {
    const res = await API.patch(`/requests/${id}/reject`, {});
    showToast(`✕ ${res.message || 'Request rejected'}`, 'error');
  } catch(err){
    showToast(err.message || 'Failed to reject', 'error'); return;
  }
  const req = APP.pendingRequests.find(r => r.id === id);
  if(req) req.status = 'rejected';
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el => el.remove());
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
}

/* ════════════════════════════════════════════
   AUTO-REFRESH every 30 s when admin is active
════════════════════════════════════════════ */
setInterval(async () => {
  if(APP.currentRole !== 'admin') return;
  const page = document.querySelector('.page.active')?.id;
  if(page === 'dash')      await loadAdminDashboardData();
  else if(page === 'analytics') await loadAnalyticsData();
}, 30000);

document.addEventListener('visibilitychange', () => {
  if(!document.hidden && APP.currentRole === 'admin'){
    const page = document.querySelector('.page.active')?.id;
    if(page === 'dash')      loadAdminDashboardData();
    else if(page === 'analytics') loadAnalyticsData();
  }
});

/* ── Utility ── */
function updateElement(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}
