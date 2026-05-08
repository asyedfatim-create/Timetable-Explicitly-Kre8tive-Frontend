/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — data.js  [FIXED]
   §4  MANAGE DATA (fetched from backend)
   §5  BUILDER STATE
   Fixes:
   - All builder dropdowns (teacher, room, course, section) now
     populated correctly from real API data
   - populateRequestDropdowns uses real data arrays
   - timetable filter dropdowns re-populated on every page enter
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

/* ── Color maps ── */
const COLOR_BG = {
  gold:  'rgba(29,78,216,.12)',  teal:'rgba(8,145,178,.12)',   amber:'rgba(217,119,6,.12)',
  coral: 'rgba(220,38,38,.12)', blue:'rgba(3,105,161,.12)',   purple:'rgba(139,92,246,.12)'
};
const COLOR_BORDER = {
  gold:'var(--gold-lt)', teal:'var(--teal)', amber:'var(--amber)',
  coral:'var(--coral)',  blue:'var(--blue)', purple:'#8B5CF6'
};
const COLOR_FG = { ...COLOR_BORDER };

/* ════════════════════════════════════════════
   LOAD ALL DATA FROM BACKEND
════════════════════════════════════════════ */
async function loadAllData(){
  try {
    if(APP.currentRole !== 'admin'){
      /* Non-admin: load only what they need */
      try {
        const [sectionsRes, coursesRes, roomsRes, teachersRes] = await Promise.all([
          API.get('/sections'),
          API.get('/courses'),
          API.get('/rooms'),
          API.get('/teachers'),
        ]);

        teachersData = (teachersRes.data || []).map(t => ({
          id:t.id, name:t.name, email:t.email, dept:t.dept,
          status:t.status, courses:t.courses||[], load:t.load
        }));
        TEACHERS = teachersData.map(t => t.name);

        sectionsData = (sectionsRes.data || []).map(s => ({
          id:s.id, name:s.name, batch:s.batch, shift:s.shift,
          label:s.label, students:s.students, capacity:s.capacity,
          courses:s.courses||[]
        }));
        SECTIONS = sectionsData.map(s => s.name);

        coursesData = (coursesRes.data || []).map(c => ({
          id:c.id, name:c.name, code:c.code, type:c.type,
          ch:c.creditHours, teacher:c.teacherName||'', teacherId:c.teacherId,
          sessions:c.sessionsPerWeek, color:c.color||'gold'
        }));
        COURSES = coursesData.map(c => c.name);

        roomsData = (roomsRes.data || []).map(r => ({
          id:r.id, name:r.name, type:r.type, capacity:r.capacity,
          floor:r.floor, facilities:r.facilities||[], util:r.utilization||0, status:r.status
        }));
        ROOMS = roomsData.map(r => r.name);

        await loadTimetableData();
      } catch(err){
        console.warn('Data load failed for non-admin:', err);
      }
      _populateBuilderDropdowns();
      return;
    }

    /* Admin: load everything */
    const [teachersRes, roomsRes, coursesRes, sectionsRes] = await Promise.all([
      API.get('/teachers'),
      API.get('/rooms'),
      API.get('/courses'),
      API.get('/sections'),
    ]);

    teachersData = (teachersRes.data || []).map(t => ({
      id:t.id, name:t.name, email:t.email, dept:t.dept,
      status:t.status, courses:t.courses||[], load:t.load
    }));
    TEACHERS = teachersData.map(t => t.name);

    roomsData = (roomsRes.data || []).map(r => ({
      id:r.id, name:r.name, type:r.type, capacity:r.capacity,
      floor:r.floor, facilities:r.facilities||[], util:r.utilization||0, status:r.status
    }));
    ROOMS = roomsData.map(r => r.name);

    coursesData = (coursesRes.data || []).map(c => ({
      id:c.id, name:c.name, code:c.code, type:c.type,
      ch:c.creditHours, teacher:c.teacherName||'', teacherId:c.teacherId,
      sessions:c.sessionsPerWeek, color:c.color||'gold'
    }));
    COURSES = coursesData.map(c => ({
      id:c.id, name:c.name, code:c.code, color:c.color,
      bg:     COLOR_BG[c.color]     || COLOR_BG.gold,
      border: COLOR_BORDER[c.color] || COLOR_BORDER.gold,
      fg:     COLOR_FG[c.color]     || COLOR_FG.gold,
    }));

    sectionsData = (sectionsRes.data || []).map(s => ({
      id:s.id, name:s.name, batch:s.batch, shift:s.shift,
      label:s.label, students:s.students, capacity:s.capacity,
      courses:s.courses||[]
    }));
    SECTIONS = sectionsData.map(s => s.name);

    await loadTimetableData();
    _populateBuilderDropdowns();

  } catch(err){
    console.error('loadAllData failed:', err);
    showToast('Failed to load data from server', 'error');
  }
}

/* ── Load timetable entries ── */
async function loadTimetableData(){
  try {
    const res = await API.get('/timetable');
    timetableData = {};
    (res.entries || []).forEach(e => {
      const secIdx = sectionsData.findIndex(s => s.id === e.sectionId);
      if(secIdx === -1) return;
      const key = ttKey(e.dayIndex, e.slotIndex, secIdx);
      timetableData[key] = {
        entryId: e.id,
        code:    e.courseCode,
        name:    e.courseName,
        color:   e.color,
        bg:      e.bg     || COLOR_BG[e.color]     || COLOR_BG.gold,
        border:  e.border || COLOR_BORDER[e.color] || COLOR_BORDER.gold,
        fg:      e.fg     || COLOR_FG[e.color]     || COLOR_FG.gold,
        teacher: e.teacher,
        room:    e.room,
        section: e.section,
      };
    });
    if(res.status === 'published'){
      APP.publishedTimetable = JSON.parse(JSON.stringify(timetableData));
    }
  } catch(err){
    console.error('loadTimetableData failed:', err);
  }
}

/* ════════════════════════════════════════════
   POPULATE BUILDER DROPDOWNS (FIXED)
   Always rebuilds from current data arrays.
════════════════════════════════════════════ */
function _populateBuilderDropdowns(){
  /* Course dropdown */
  const fCourse = document.getElementById('fCourse');
  if(fCourse){
    fCourse.innerHTML = '<option value="">— Select Course —</option>';
    COURSES.forEach((c, i) => {
      /* COURSES is either string[] (non-admin) or object[] (admin) */
      const label = typeof c === 'object' ? `${c.name} (${c.code})` : c;
      fCourse.innerHTML += `<option value="${i}">${label}</option>`;
    });
  }

  /* Teacher dropdown */
  const fTeacher = document.getElementById('fTeacher');
  if(fTeacher){
    fTeacher.innerHTML = '<option value="">— Select Teacher —</option>';
    teachersData.forEach((t, i) => {
      fTeacher.innerHTML += `<option value="${i}">${t.name}</option>`;
    });
  }

  /* Room dropdown */
  const fRoom = document.getElementById('fRoom');
  if(fRoom){
    fRoom.innerHTML = '<option value="">— Select Room —</option>';
    roomsData.forEach((r, i) => {
      fRoom.innerHTML += `<option value="${i}">${r.name} (${r.capacity} seats)</option>`;
    });
  }

  /* Section dropdown */
  const fSection = document.getElementById('fSection');
  if(fSection){
    fSection.innerHTML = '';
    sectionsData.forEach((s, i) => {
      fSection.innerHTML += `<option value="${i}">${s.label ? s.label + ' — ' : ''}${s.name}</option>`;
    });
  }
}

/* ── Also populate request dropdowns whenever called ── */
function populateRequestDropdowns(){
  const SLOT_OPTIONS  = SLOTS.map((s, i) => `<option value="${i}">${s}</option>`).join('');
  const SLOT_SELECT   = '<option value="">-- Select Slot --</option>' + SLOT_OPTIONS;
  const COURSE_OPTIONS= '<option value="">-- Select Course --</option>'
    + coursesData.map(c => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join('');
  const SECTION_OPTIONS = '<option value="">-- Select Section --</option>'
    + sectionsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  const ROOM_OPTIONS  = '<option value="">-- Select Room --</option>'
    + roomsData.map(r => `<option value="${r.name}">${r.name}</option>`).join('');

  /* tab-makeup: 0=Course, 1=Section, 2=Original Time, 3=Preferred Time, 4=Room */
  const mu = document.querySelectorAll('#tab-makeup select.field-input');
  if(mu[0]) mu[0].innerHTML = COURSE_OPTIONS;
  if(mu[1]) mu[1].innerHTML = SECTION_OPTIONS;
  if(mu[2]) mu[2].innerHTML = SLOT_SELECT;
  if(mu[3]) mu[3].innerHTML = SLOT_SELECT;
  if(mu[4]) mu[4].innerHTML = ROOM_OPTIONS;

  /* tab-merge: 0=Course, 1=Section A, 2=Section B, 3=Preferred Time, 4=Venue */
  const mg = document.querySelectorAll('#tab-merge select.field-input');
  if(mg[0]) mg[0].innerHTML = COURSE_OPTIONS;
  if(mg[1]) mg[1].innerHTML = SECTION_OPTIONS;
  if(mg[2]) mg[2].innerHTML = SECTION_OPTIONS;
  if(mg[3]) mg[3].innerHTML = SLOT_SELECT;
  if(mg[4]) mg[4].innerHTML = ROOM_OPTIONS;

  /* tab-cancel: 0=Course, 1=Section, 2=Time Slot */
  const ca = document.querySelectorAll('#tab-cancel select.field-input');
  if(ca[0]) ca[0].innerHTML = COURSE_OPTIONS;
  if(ca[1]) ca[1].innerHTML = SECTION_OPTIONS;
  if(ca[2]) ca[2].innerHTML = SLOT_SELECT;
}

