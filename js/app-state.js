'use strict';

/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — app-state.js
   §1  APP STATE
   §2  ROLE-BASED ACCESS
   §3  CONSTANTS (loaded from backend)
═══════════════════════════════════════════════════════════════ */

/* §1  APP STATE */
const APP = {
  currentRole: 'guest',
  currentUser: null,
  notifications: [],
  pendingRequests: [],
  publishedTimetable: {},
  clashes: [],
  prevPage: null,
};

/* §2  ROLE-BASED ACCESS */
const ROLE_ACCESS = {
  guest:   ['login'],
  admin:   ['dash','tt','clash','req','notif','analytics','makett','teachers','rooms','courses','sections'],
  teacher: ['dash-teacher','tt','req','notif'],
  student: ['dash-student','tt','notif'],
};

/* §3  CONSTANTS — populated from backend /constants + /courses + /teachers + /rooms + /sections */
let COURSES  = [];
let TEACHERS = [];
let ROOMS    = [];
let SECTIONS = [];
const DAYS      = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const SLOTS     = ['8:00–9:00 AM','9:00–10:00 AM','10:00–11:00 AM','11:00 AM–12:00 PM','1:00–2:00 PM','2:00–3:00 PM','3:00–4:00 PM'];
const SLOT_LABELS = ['8:00 – 9:00 AM','9:00 – 10:00 AM','10:00 – 11:00 AM','11:00 – 12:00 PM','1:00 – 2:00 PM','2:00 – 3:00 PM','3:00 – 4:00 PM'];

const PAGE_ORDER = [
  'login','dash','tt','clash','req','notif','analytics',
  'makett','teachers','rooms','courses','sections',
  'dash-student','dash-teacher',
];
