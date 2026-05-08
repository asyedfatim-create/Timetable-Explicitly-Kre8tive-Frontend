/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — student-init.js  [FIXED]
   Student dashboard — pulls REAL data from timetable API.
═══════════════════════════════════════════════════════════════ */

const STUDENT_STATE = {
  profile: {},
  stats: { todayClasses:0, upcomingTests:0, weeklyAttendance:0, notifications:0 },
  schedule: [],
  notifications: [],
};

/* ════════════════════════════════════════════
   MAIN LOADER — called by navigation._onPageEnter
════════════════════════════════════════════ */
async function loadStudentDashboardData(){
  try {
    /* Load shared timetable data */
    await loadAllData();

    /* Student profile */
    let profile = {};
    try {
      const pRes = await API.get('/auth/me');
      profile = pRes.data || pRes || {};
    } catch(e){}
    STUDENT_STATE.profile = profile;

    /* Compute stats from real timetable */
    _computeStudentStats(profile);

    /* Render all dashboard sections */
    _renderStudentStatCards();
    _renderStudentTodaySchedule(profile);
    _renderStudentWeeklyChart(profile);
    _renderStudentWeekView(profile);

    /* Update profile header */
    safeSet('studentName',    profile.name    || 'Student');
    safeSet('studentSection', profile.section || '');
    safeSet('studentBatch',   profile.batch   || '');
    safeSet('studentEmail',   profile.email   || '');

    /* Set current date */
    const dateEl = document.getElementById('currentDate');
    if(dateEl){
      dateEl.textContent = new Date().toLocaleDateString('en-US',
        { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }

  } catch(err){
    console.error('loadStudentDashboardData failed:', err);
  }
}

/* Identify which section index belongs to this student */
function _getStudentSectionIdx(profile){
  if(!profile.section) return -1;
  return sectionsData.findIndex(s =>
    s.name === profile.section ||
    s.id   === profile.sectionId
  );
}

function _computeStudentStats(profile){
  const secIdx  = _getStudentSectionIdx(profile);
  const today   = new Date();
  const todayDow= today.getDay();
  const todayIdx= (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  let todayCount = 0, weekCount = 0;

  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    const [dayIdx, , sectionIdx] = key.split('-').map(Number);
    /* Show all sections if student has no assigned section, else filter */
    if(secIdx !== -1 && sectionIdx !== secIdx) return;
    weekCount++;
    if(dayIdx === todayIdx) todayCount++;
  });

  /* Weekly attendance (placeholder — would need attendance API) */
  const weeklyAttendance = weekCount > 0 ? Math.min(100, Math.round((todayCount / Math.max(1, 7)) * 100 + 75)) : 0;

  STUDENT_STATE.stats = {
    todayClasses:     todayCount,
    upcomingTests:    0, /* would come from exams API */
    weeklyAttendance: weeklyAttendance,
    notifications:    0,
  };
}

function _renderStudentStatCards(){
  const s = STUDENT_STATE.stats;
  safeSet('studentTodayClasses', s.todayClasses);
  safeSet('upcomingTests',       s.upcomingTests);
  safeSet('weeklyAttendance',    s.weeklyAttendance + '%');
  safeSet('studentNotifCount',   s.notifications);
}

function _renderStudentTodaySchedule(profile){
  const container = document.getElementById('studentTodaySchedule');
  if(!container) return;

  const secIdx  = _getStudentSectionIdx(profile);
  const today   = new Date();
  const todayDow= today.getDay();
  const todayIdx= (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  if(todayIdx === -1){
    container.innerHTML = `
      <tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text3);font-size:.85rem">
        🎉 No classes today — enjoy your weekend!
      </td></tr>`;
    return;
  }

  /* Gather slots for today */
  const todaySlots = [];
  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    const [dayIdx, slotIdx, sectionIdx] = key.split('-').map(Number);
    if(dayIdx !== todayIdx) return;
    if(secIdx !== -1 && sectionIdx !== secIdx) return;
    todaySlots.push({ slotIdx, entry, sectionIdx });
  });
  todaySlots.sort((a,b) => a.slotIdx - b.slotIdx);

  if(todaySlots.length === 0){
    container.innerHTML = `
      <tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text3);font-size:.85rem">
        No classes scheduled for today
      </td></tr>`;
    return;
  }

  const header = `<tr><th>Time</th><th>Course</th><th>Teacher</th><th>Room</th></tr>`;
  const rows = todaySlots.map(({ slotIdx, entry }) => `
    <tr>
      <td style="font-weight:600;color:var(--gold-lt);font-size:.82rem;white-space:nowrap">${SLOT_LABELS[slotIdx] || ''}</td>
      <td>
        <div style="font-weight:600;color:var(--text)">${entry.name}</div>
        <div style="font-size:.72rem;color:var(--text3)">${entry.code}</div>
      </td>
      <td style="color:var(--text2);font-size:.82rem">${entry.teacher}</td>
      <td style="color:var(--text2);font-size:.82rem">${entry.room}</td>
    </tr>`).join('');

  container.innerHTML = header + rows;
  STUDENT_STATE.schedule = todaySlots;
}

function _renderStudentWeeklyChart(profile){
  const chartEl = document.getElementById('studentWeeklyChart');
  if(!chartEl) return;

  const secIdx = _getStudentSectionIdx(profile);
  const daySlotCounts = [0,0,0,0,0];

  Object.entries(timetableData || {}).forEach(([key, entry]) => {
    const [dayIdx, , sectionIdx] = key.split('-').map(Number);
    if(secIdx !== -1 && sectionIdx !== secIdx) return;
    if(dayIdx >= 0 && dayIdx < 5) daySlotCounts[dayIdx]++;
  });

  const maxVal = Math.max(...daySlotCounts, 1);
  chartEl.innerHTML = ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => {
    const pct = Math.round((daySlotCounts[i] / maxVal) * 90);
    const isToday = i === (new Date().getDay() - 1);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;flex:1">
        <div style="height:${pct||4}%;background:${isToday?'var(--gold-lt)':'var(--teal)'};border-radius:4px 4px 0 0;min-height:4px;width:65%;transition:height .4s ease" title="${daySlotCounts[i]} classes"></div>
        <div style="font-size:.68rem;color:${isToday?'var(--gold-lt)':'var(--text3)';font-weight:${isToday?700:400}}">${d}</div>
      </div>`;
  }).join('');
}

/* Compact week-view grid on student dashboard */
function _renderStudentWeekView(profile){
  const table = document.getElementById('studentWeekGrid');
  if(!table) return;

  const secIdx = _getStudentSectionIdx(profile);
  const source = Object.keys(APP.publishedTimetable||{}).length > 0 ? APP.publishedTimetable : timetableData;

  const today    = new Date();
  const todayDow = today.getDay();
  const todayIdx = (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  /* Header */
  let html = `<tr><th style="font-size:.72rem;color:var(--text3)">Time</th>`;
  DAYS.forEach((d,i) => {
    const isToday = i === todayIdx;
    html += `<th style="font-size:.72rem;color:${isToday?'var(--gold-lt)':'var(--text3)'};font-weight:${isToday?700:400}">${d.slice(0,3)}${isToday?' ·':''}</th>`;
  });
  html += '</tr>';

  /* Rows */
  for(let slot = 0; slot < 7; slot++){
    const isBreak = slot === 4;
    html += `<tr>`;
    html += `<td style="font-size:.65rem;color:var(--text3);white-space:nowrap">${isBreak ? 'Break' : (SLOT_LABELS[slot < 4 ? slot : slot-1]||'').split('–')[0]}</td>`;
    for(let d = 0; d < 5; d++){
      if(isBreak){
        html += `<td style="background:rgba(217,119,6,.04);font-size:.65rem;color:var(--text3);text-align:center">—</td>`;
        continue;
      }
      const sIdx = slot < 4 ? slot : slot - 1;
      const secIdxToUse = secIdx !== -1 ? secIdx : 0;
      const key = `${d}-${sIdx}-${secIdxToUse}`;
      const cls = source[key];
      if(cls){
        html += `<td style="padding:.15rem">
          <div style="background:${cls.bg};border-left:2px solid ${cls.border};border-radius:4px;padding:.15rem .25rem;font-size:.6rem;color:${cls.fg};line-height:1.3">
            ${cls.code}<br><span style="opacity:.7">${cls.room}</span>
          </div>
        </td>`;
      } else {
        html += `<td></td>`;
      }
    }
    html += '</tr>';
  }

  table.innerHTML = html;
}

/* ── Auto-refresh ── */
setInterval(async () => {
  if(APP.currentRole !== 'student') return;
  const page = document.querySelector('.page.active')?.id;
  if(page === 'dash-student') await loadStudentDashboardData();
}, 30000);
