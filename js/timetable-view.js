/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — timetable-view.js  [FIXED]
   §14  TIMETABLE VIEW
   Fixes:
   - teacher/room/course/weekly/monthly filters use real data
   - dropdowns always re-populated on page enter
   - teacher + room filter dropdowns added
   - weekly/monthly toggle works correctly
═══════════════════════════════════════════════════════════════ */

/* ── Active filter state ── */
let ttTeacherFilter = 'all';
let ttRoomFilter    = 'all';

/* ────────────────────────────────────────
   POPULATE ALL FILTER DROPDOWNS
──────────────────────────────────────── */
function _populateTTBatchFilter(){
  const bf = document.getElementById('ttBatchFilter');
  if(!bf) return;
  const batches = [...new Set(sectionsData.map(s => s.batch))].filter(Boolean);
  bf.innerHTML = '<option value="all">Batch: All Batches</option>';
  batches.forEach(b => {
    bf.innerHTML += `<option value="${b}">Batch: ${b}</option>`;
  });
  /* Restore previous selection */
  if(ttBatchFilter && ttBatchFilter !== 'all') bf.value = ttBatchFilter;
}

function _populateTTSectionFilter(){
  const sf = document.getElementById('ttSectionFilter');
  if(!sf) return;
  let secs = sectionsData;
  if(ttBatchFilter !== 'all') secs = sectionsData.filter(s => s.batch === ttBatchFilter);
  sf.innerHTML = '<option value="all">Section: All Sections</option>';
  secs.forEach(s => {
    const globalIdx = sectionsData.indexOf(s);
    sf.innerHTML += `<option value="${globalIdx}">Section: ${s.label} (${s.name})</option>`;
  });
  if(ttSectionFilter && ttSectionFilter !== 'all') sf.value = ttSectionFilter;
}

function _populateTTTeacherFilter(){
  const tf = document.getElementById('ttTeacherFilter');
  if(!tf) return;
  tf.innerHTML = '<option value="all">Teacher: All Teachers</option>';
  teachersData.forEach(t => {
    tf.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
  if(ttTeacherFilter !== 'all') tf.value = ttTeacherFilter;
}

function _populateTTRoomFilter(){
  const rf = document.getElementById('ttRoomFilter');
  if(!rf) return;
  rf.innerHTML = '<option value="all">Room: All Rooms</option>';
  roomsData.forEach(r => {
    rf.innerHTML += `<option value="${r.name}">${r.name}</option>`;
  });
  if(ttRoomFilter !== 'all') rf.value = ttRoomFilter;
}

/* ────────────────────────────────────────
   FILTER CHANGE HANDLERS
──────────────────────────────────────── */
function onTTBatchChange(){
  ttBatchFilter    = document.getElementById('ttBatchFilter')?.value || 'all';
  ttSectionFilter  = 'all';
  const sf = document.getElementById('ttSectionFilter');
  if(sf) sf.value = 'all';
  _populateTTSectionFilter();
  renderTimetableView();
}

function onTTSectionChange(){
  ttSectionFilter = document.getElementById('ttSectionFilter')?.value || 'all';
  renderTimetableView();
}

function onTTTeacherChange(){
  ttTeacherFilter = document.getElementById('ttTeacherFilter')?.value || 'all';
  renderTimetableView();
}

function onTTRoomChange(){
  ttRoomFilter = document.getElementById('ttRoomFilter')?.value || 'all';
  renderTimetableView();
}

/* ────────────────────────────────────────
   BUILD GRID SKELETON
──────────────────────────────────────── */
function _buildTTGrid(){
  const ttBody = document.querySelector('#tt .tt-body');
  if(!ttBody) return;

  /* Update header dates */
  const today   = new Date();
  const dow     = today.getDay();
  const monday  = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const ttHead = document.querySelector('#tt .tt-head');
  if(ttHead){
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    ttHead.innerHTML = '<div class="tt-head-cell">Time</div>';
    for(let d = 0; d < 5; d++){
      const date    = new Date(monday);
      date.setDate(monday.getDate() + d);
      const isToday = date.toDateString() === today.toDateString();
      const label   = DAYS[d];
      const dateStr = `${months[date.getMonth()]} ${date.getDate()}`;
      ttHead.innerHTML += `<div class="tt-head-cell${isToday ? ' today' : ''}">
        ${label}<br>
        <small style="font-size:.7rem;font-weight:400;color:${isToday ? 'inherit' : 'var(--text3)'}">
          ${dateStr}${isToday ? ' · Today' : ''}
        </small>
      </div>`;
    }
  }

  /* Build rows */
  ttBody.innerHTML = '';
  for(let display = 0; display < 8; display++){
    const isBreak = (display === 4);
    const slotIdx = display < 4 ? display : (display - 1);
    const row     = document.createElement('div');
    row.className = 'tt-row';

    const timeCell = document.createElement('div');
    timeCell.className = 'tt-time';
    if(isBreak){
      timeCell.innerHTML = '<span style="color:var(--amber);font-style:italic;font-size:.68rem">12:00<br>1:00</span>';
    } else {
      const parts = SLOT_LABELS[slotIdx].split('–');
      timeCell.innerHTML = `${parts[0]||''}<br>${parts[1]||''}`;
    }
    row.appendChild(timeCell);

    for(let d = 0; d < 5; d++){
      const cell = document.createElement('div');
      cell.className = 'tt-slot';
      if(isBreak){
        cell.style.background = 'rgba(217,119,6,.04)';
        cell.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:.75rem;color:var(--text3)">Break</div>';
      } else {
        cell.dataset.day  = d;
        cell.dataset.slot = slotIdx;
        cell.innerHTML    = '<div class="slot-entries"></div>';
      }
      row.appendChild(cell);
    }
    ttBody.appendChild(row);
  }
}

/* ────────────────────────────────────────
   MAIN RENDER
──────────────────────────────────────── */
function renderTimetableView(){
  /* 1. Build grid skeleton */
  _buildTTGrid();

  /* 2. Populate ALL dropdowns from real data */
  _populateTTBatchFilter();
  _populateTTSectionFilter();
  _populateTTTeacherFilter();
  _populateTTRoomFilter();

  /* 3. Determine data source */
  const source = Object.keys(APP.publishedTimetable).length > 0
    ? APP.publishedTimetable
    : timetableData;

  if(Object.keys(source).length === 0){
    /* Show empty message */
    document.querySelectorAll('#tt .tt-slot[data-day]').forEach(slot => {
      slot.querySelector('.slot-entries').innerHTML =
        '<div style="font-size:.65rem;color:var(--text3);padding:.25rem;text-align:center">—</div>';
    });
    _updateTTLegend({}, []);
    _renderMonthlyView({}, []);
    return;
  }

  /* 4. Determine visible sections */
  let visibleSecs = sectionsData.map((_, i) => i);

  if(ttBatchFilter !== 'all'){
    visibleSecs = visibleSecs.filter(i => sectionsData[i].batch === ttBatchFilter);
  }
  if(ttSectionFilter !== 'all'){
    const idx = parseInt(ttSectionFilter);
    if(!isNaN(idx)) visibleSecs = [idx];
  }

  /* 5. Fill slots */
  document.querySelectorAll('#tt .tt-slot[data-day]').forEach(slot => {
    const d = parseInt(slot.dataset.day);
    const s = parseInt(slot.dataset.slot);
    const entries = slot.querySelector('.slot-entries');
    if(!entries) return;
    entries.innerHTML = '';

    visibleSecs.forEach(sec => {
      const key = ttKey(d, s, sec);
      const cls = source[key];
      if(!cls) return;

      /* Apply teacher filter */
      if(ttTeacherFilter !== 'all' && cls.teacher !== ttTeacherFilter) return;
      /* Apply room filter */
      if(ttRoomFilter !== 'all' && cls.room !== ttRoomFilter) return;

      entries.innerHTML += `
        <div class="class-block" style="background:${cls.bg};border-left:3px solid ${cls.border}">
          <div class="cb-course"  style="color:${cls.fg}">${cls.name}</div>
          <div class="cb-room"    style="color:${cls.fg}">${cls.room}</div>
          <div class="cb-teacher" style="color:${cls.fg}">${cls.teacher}</div>
          ${visibleSecs.length > 1
            ? `<div class="cb-teacher" style="color:${cls.fg};font-size:.65rem">${SECTIONS[sec] || ''}</div>`
            : ''}
        </div>`;
    });
  });

  /* 6. Update legend */
  _updateTTLegend(source, visibleSecs);

  /* 7. Render monthly view */
  _renderMonthlyView(source, visibleSecs);
}

/* ────────────────────────────────────────
   LEGEND
──────────────────────────────────────── */
function _updateTTLegend(source, visibleSecs){
  const legend = document.querySelector('#tt .legend');
  if(!legend) return;
  const seen = {};
  visibleSecs.forEach(sec => {
    for(let d = 0; d < 5; d++){
      for(let s = 0; s < 7; s++){
        const key = ttKey(d, s, sec);
        const cls = source[key];
        if(cls && !seen[cls.code]){
          /* Teacher + room filter check for legend too */
          if(ttTeacherFilter !== 'all' && cls.teacher !== ttTeacherFilter) continue;
          if(ttRoomFilter    !== 'all' && cls.room    !== ttRoomFilter)    continue;
          seen[cls.code] = cls;
        }
      }
    }
  });
  legend.innerHTML = Object.values(seen).map(cls =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${cls.border}"></div>
      ${cls.name}
    </div>`
  ).join('');

  if(Object.keys(seen).length === 0){
    legend.innerHTML = '<div style="color:var(--text3);font-size:.78rem">No entries match current filters</div>';
  }
}

/* ────────────────────────────────────────
   MONTHLY VIEW
──────────────────────────────────────── */
function _renderMonthlyView(source, visibleSecs){
  const tbody = document.querySelector('#monthlyGrid tbody');
  if(!tbody) return;

  const today       = new Date();
  const year        = today.getFullYear();
  const month       = today.getMonth();
  const firstDayRaw = new Date(year, month, 1).getDay();
  /* Adjust: make Monday=0 */
  const firstDay    = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  /* Update month header */
  const monthHeader = document.querySelector('#monthlyGrid caption, #monthlyGrid thead tr th[colspan]');
  if(monthHeader){
    monthHeader.textContent = today.toLocaleString('en', { month:'long', year:'numeric' });
  }

  let day = 1, html = '';
  for(let week = 0; week < 6; week++){
    if(day > daysInMonth) break;
    html += '<tr>';
    for(let dow = 0; dow < 5; dow++){
      const cellDay = (week === 0 && dow < firstDay) ? null
                    : day <= daysInMonth ? day++ : null;

      if(!cellDay){ html += '<td></td>'; continue; }

      const isToday  = cellDay === today.getDate() && month === today.getMonth();
      const dayOfWeek= dow; /* 0=Mon … 4=Fri */

      let classBlocks = '';
      visibleSecs.forEach(sec => {
        for(let s = 0; s < 7; s++){
          const key = ttKey(dayOfWeek, s, sec);
          const cls = source[key];
          if(!cls) continue;
          if(ttTeacherFilter !== 'all' && cls.teacher !== ttTeacherFilter) continue;
          if(ttRoomFilter    !== 'all' && cls.room    !== ttRoomFilter)    continue;
          classBlocks += `
            <div style="background:${cls.bg};border-left:2px solid ${cls.border};border-radius:4px;padding:.15rem .3rem;margin-bottom:.15rem;font-size:.6rem;color:${cls.fg}">${cls.code}</div>`;
        }
      });

      html += `<td${isToday ? ' class="today"' : ''}>
        <div class="date-badge"${isToday ? ' style="background:var(--gold-lt);color:#fff"' : ''}>${cellDay}</div>
        <div class="slot-entries">${classBlocks}</div>
      </td>`;
    }
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────
   WEEKLY / MONTHLY TOGGLE
──────────────────────────────────────── */
function switchTTView(mode){
  const weekly  = document.getElementById('weeklyTT');
  const monthly = document.getElementById('monthlyTT');
  const btnW    = document.getElementById('btnWeekly');
  const btnM    = document.getElementById('btnMonthly');

  window.currentTTView = mode;

  if(mode === 'weekly'){
    if(weekly)  weekly.style.display  = 'block';
    if(monthly) monthly.style.display = 'none';
    btnW?.classList.add('active');
    btnM?.classList.remove('active');
    renderTimetableView();
  } else {
    if(weekly)  weekly.style.display  = 'none';
    if(monthly) monthly.style.display = 'block';
    btnW?.classList.remove('active');
    btnM?.classList.add('active');

    const source = Object.keys(APP.publishedTimetable).length > 0
      ? APP.publishedTimetable
      : timetableData;

    let visibleSecs = sectionsData.map((_, i) => i);
    if(ttBatchFilter !== 'all')
      visibleSecs = visibleSecs.filter(i => sectionsData[i].batch === ttBatchFilter);
    if(ttSectionFilter !== 'all'){
      const idx = parseInt(ttSectionFilter);
      if(!isNaN(idx)) visibleSecs = [idx];
    }

    /* Populate dropdowns too (user may land here first) */
    _populateTTBatchFilter();
    _populateTTSectionFilter();
    _populateTTTeacherFilter();
    _populateTTRoomFilter();

    _renderMonthlyView(source, visibleSecs);
  }
}

/* Wire filter change events once DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ttBatchFilter')  ?.addEventListener('change', onTTBatchChange);
  document.getElementById('ttSectionFilter')?.addEventListener('change', onTTSectionChange);
  document.getElementById('ttTeacherFilter')?.addEventListener('change', onTTTeacherChange);
  document.getElementById('ttRoomFilter')   ?.addEventListener('change', onTTRoomChange);
});
