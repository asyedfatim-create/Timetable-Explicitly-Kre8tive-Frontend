/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — data.js
   §4  MANAGE DATA (fetched from backend)
   §5  BUILDER STATE
═══════════════════════════════════════════════════════════════ */

/* §4  MANAGE DATA — populated from API */
let teachersData = [];
let roomsData    = [];
let coursesData  = [];
let sectionsData = [];

/* §5  BUILDER STATE */
let timetableData = {};
let viewSection   = 'all';
let selectedDay   = '';
let selectedSlot  = '';
let recentAdds    = [];

let ttBatchFilter   = 'all';
let ttSectionFilter = 'all';

let teacherSortKey='name', teacherSortAsc=true;
let roomSortKey='name',    roomSortAsc=true;
let courseSortKey='name',  courseSortAsc=true;
let sectionSortKey='name', sectionSortAsc=true;

/* ── Load all data from backend ── */
async function loadAllData(){
  try {
    const [teachersRes, roomsRes, coursesRes, sectionsRes] = await Promise.all([
      API.get('/teachers'),
      API.get('/rooms'),
      API.get('/courses'),
      API.get('/sections'),
    ]);

    /* Map backend response → frontend format */
    teachersData = (teachersRes.data||[]).map(t => ({
      id: t.id, name: t.name, email: t.email, dept: t.dept,
      status: t.status, courses: t.courses||[], load: t.load
    }));
    TEACHERS = teachersData.map(t => t.name);

    roomsData = (roomsRes.data||[]).map(r => ({
      id: r.id, name: r.name, type: r.type, capacity: r.capacity,
      floor: r.floor, facilities: r.facilities||[], util: r.utilization||0, status: r.status
    }));
    ROOMS = roomsData.map(r => r.name);

    coursesData = (coursesRes.data||[]).map(c => ({
      id: c.id, name: c.name, code: c.code, type: c.type,
      ch: c.creditHours, teacher: c.teacherName||'', teacherId: c.teacherId,
      sessions: c.sessionsPerWeek, color: c.color||'gold'
    }));
    /* Build COURSES array used by the builder (with display colors) */
    const COLOR_BG = {
      gold:  'rgba(29,78,216,.12)', teal:'rgba(8,145,178,.12)', amber:'rgba(217,119,6,.12)',
      coral: 'rgba(220,38,38,.12)', blue:'rgba(3,105,161,.12)', purple:'rgba(139,92,246,.12)'
    };
    const COLOR_BORDER = {
      gold:'var(--gold-lt)', teal:'var(--teal)', amber:'var(--amber)',
      coral:'var(--coral)', blue:'var(--blue)', purple:'#8B5CF6'
    };
    const COLOR_FG = {
      gold:'var(--gold-lt)', teal:'var(--teal)', amber:'var(--amber)',
      coral:'var(--coral)', blue:'var(--blue)', purple:'#8B5CF6'
    };
    COURSES = coursesData.map(c => ({
      id: c.id, name: c.name, code: c.code, color: c.color,
      bg: COLOR_BG[c.color]||COLOR_BG.gold,
      border: COLOR_BORDER[c.color]||COLOR_BORDER.gold,
      fg: COLOR_FG[c.color]||COLOR_FG.gold
    }));

    sectionsData = (sectionsRes.data||[]).map(s => ({
      id: s.id, name: s.name, batch: s.batch, shift: s.shift,
      label: s.label, students: s.students, capacity: s.capacity,
      courses: s.courses||[]
    }));
    SECTIONS = sectionsData.map(s => s.name);

    /* Load timetable entries */
    await loadTimetableData();

    /* Populate dynamic dropdowns in the builder */
    _populateBuilderDropdowns();

  } catch(err) {
    console.error('loadAllData failed:', err);
    showToast('Failed to load data from server','error');
  }
}

/* Load timetable entries from backend into local timetableData map */
async function loadTimetableData(){
  try {
    const res = await API.get('/timetable');
    timetableData = {};
    (res.entries||[]).forEach(e => {
      const secIdx = sectionsData.findIndex(s => s.id === e.sectionId);
      if(secIdx === -1) return;
      const key = ttKey(e.dayIndex, e.slotIndex, secIdx);
      timetableData[key] = {
        entryId: e.id, code: e.courseCode, name: e.courseName, color: e.color,
        bg: e.bg, border: e.border, fg: e.fg,
        teacher: e.teacher, room: e.room, section: e.section
      };
    });
    if(res.status === 'published'){
      APP.publishedTimetable = JSON.parse(JSON.stringify(timetableData));
    }
  } catch(err) {
    console.error('loadTimetableData failed:', err);
  }
}

/* Populate dynamic select elements in the builder form */
function _populateBuilderDropdowns(){
  const fCourse = document.getElementById('fCourse');
  if(fCourse){
    fCourse.innerHTML = '<option value="">— Select Course —</option>';
    COURSES.forEach((c,i) => {
      fCourse.innerHTML += `<option value="${i}">${c.name} (${c.code})</option>`;
    });
  }
  const fTeacher = document.getElementById('fTeacher');
  if(fTeacher){
    fTeacher.innerHTML = '<option value="">— Select Teacher —</option>';
    teachersData.forEach((t,i) => {
      fTeacher.innerHTML += `<option value="${i}">${t.name}</option>`;
    });
  }
  const fRoom = document.getElementById('fRoom');
  if(fRoom){
    fRoom.innerHTML = '<option value="">— Select Room —</option>';
    roomsData.forEach((r,i) => {
      fRoom.innerHTML += `<option value="${i}">${r.name} (${r.capacity} seats)</option>`;
    });
  }
  const fSection = document.getElementById('fSection');
  if(fSection){
    fSection.innerHTML = '';
    sectionsData.forEach((s,i) => {
      fSection.innerHTML += `<option value="${i}">${s.name}</option>`;
    });
  }
}
