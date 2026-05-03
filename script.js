'use strict';

/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — script.js  (v4.1 — FIXED)
   Key fixes in this version:
   1. ALL functions exposed on window → inline onclick handlers now work
      (approveRequest, rejectRequest, removeCell, editTeacher, etc.)
   2. PDF export targets inner content only → no sidebar misalignment
   3. Pending request IDs use Date.now()+i (integer, not float)
   4. approveRequest/rejectRequest use Number(id) coercion
   5. Timetable batch/section filter end-to-end
   6. Clash "Action Required" pill hidden when 0 clashes
   7. Teacher request tab shown ONLY to teachers
   8. Teacher course dropdown populated from coursesData
   9. Section filter (TT page & builder) fully working
  10. Back buttons on every page
  11. Settings replaced with real modal
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   §1  APP STATE
───────────────────────────────────────────────────────────────*/
const APP = {
  currentRole: 'guest',
  currentUser: null,
  notifications: [],
  pendingRequests: [],
  publishedTimetable: {},
  clashes: [],
  prevPage: null,
};

/* ─────────────────────────────────────────────────────────────
   §2  ROLE-BASED ACCESS
───────────────────────────────────────────────────────────────*/
const ROLE_ACCESS = {
  guest:   ['login'],
  admin:   ['dash','tt','clash','req','notif','analytics','makett','teachers','rooms','courses','sections'],
  teacher: ['dash-teacher','tt','req','notif'],
  student: ['dash-student','tt','notif'],
};

const ROLE_CREDENTIALS = {
  'admin@ibit.edu.pk':   { password: '12345678', role: 'admin',   name: 'Admin' },
  'teacher@ibit.edu.pk': { password: '12345678', role: 'teacher', name: 'Dr. Sara' },
  'student@ibit.edu.pk': { password: '12345678', role: 'student', name: 'Ali Khan' },
};

/* ─────────────────────────────────────────────────────────────
   §3  CONSTANTS
───────────────────────────────────────────────────────────────*/
const COURSES = [
  { name:'Internet Programming', code:'IP',  color:'gold',   bg:'rgba(29,78,216,.12)',  border:'var(--gold-lt)', fg:'var(--gold-lt)' },
  { name:'Operating Systems',    code:'OS',  color:'teal',   bg:'rgba(8,145,178,.12)',  border:'var(--teal)',    fg:'var(--teal)'    },
  { name:'Data Structures',      code:'DS',  color:'amber',  bg:'rgba(217,119,6,.12)', border:'var(--amber)',   fg:'var(--amber)'   },
  { name:'Mobile App Dev',       code:'MAD', color:'coral',  bg:'rgba(220,38,38,.12)', border:'var(--coral)',   fg:'var(--coral)'   },
  { name:'Disc. Mathematics',    code:'DM',  color:'blue',   bg:'rgba(3,105,161,.12)', border:'var(--blue)',    fg:'var(--blue)'    },
  { name:'Other / Custom',       code:'OTH', color:'purple', bg:'rgba(139,92,246,.12)',border:'#8B5CF6',        fg:'#8B5CF6'        },
];
const TEACHERS  = ['Dr. Sara','Dr. Kamran','Prof. Bilal','Ms. Ayesha','Dr. Nasir','Dr. Ali'];
const ROOMS     = ['Lab 204','Room 101','Room 202','Room 305','Room 204','Room 106','Auditorium'];
const SECTIONS  = ['F23-Afternoon-A','F23-Afternoon-B','F23-Afternoon-C','F23-Morning-A'];
const DAYS      = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const SLOTS     = ['8:00–9:00 AM','9:00–10:00 AM','10:00–11:00 AM','11:00 AM–12:00 PM','1:00–2:00 PM','2:00–3:00 PM','3:00–4:00 PM'];
const SLOT_LABELS = ['8:00 – 9:00 AM','9:00 – 10:00 AM','10:00 – 11:00 AM','11:00 – 12:00 PM','1:00 – 2:00 PM','2:00 – 3:00 PM','3:00 – 4:00 PM'];

const PAGE_ORDER = [
  'login','dash','tt','clash','req','notif','analytics',
  'makett','teachers','rooms','courses','sections',
  'dash-student','dash-teacher',
];

/* ─────────────────────────────────────────────────────────────
   §4  MANAGE DATA
───────────────────────────────────────────────────────────────*/
let teachersData = [
  { name:'Dr. Sara Ahmed',    email:'sara@ibit.edu.pk',    dept:'CS', status:'Active',   courses:['IP','MAD'], load:8 },
  { name:'Dr. Kamran Malik',  email:'kamran@ibit.edu.pk',  dept:'CS', status:'Active',   courses:['OS'],       load:7 },
  { name:'Prof. Bilal Khan',  email:'bilal@ibit.edu.pk',   dept:'SE', status:'Active',   courses:['DS'],       load:6 },
  { name:'Ms. Ayesha Noor',   email:'ayesha@ibit.edu.pk',  dept:'IT', status:'Active',   courses:['MAD'],      load:5 },
  { name:'Dr. Nasir Mehmood', email:'nasir@ibit.edu.pk',   dept:'CS', status:'On Leave', courses:['DM'],       load:6 },
  { name:'Dr. Ali Hassan',    email:'ali@ibit.edu.pk',     dept:'SE', status:'Active',   courses:['DM','IP'],  load:7 },
];
let roomsData = [
  { name:'Lab 204',    type:'Lab',        capacity:40,  floor:'2', facilities:['Computers','Projector','AC'],     util:92, status:'Available'         },
  { name:'Room 101',   type:'Lecture',    capacity:50,  floor:'1', facilities:['Projector','Whiteboard','AC'],    util:78, status:'Available'         },
  { name:'Room 202',   type:'Lecture',    capacity:40,  floor:'2', facilities:['Projector','Whiteboard'],         util:85, status:'Available'         },
  { name:'Room 305',   type:'Lecture',    capacity:35,  floor:'3', facilities:['Whiteboard'],                     util:67, status:'Available'         },
  { name:'Room 204',   type:'Lecture',    capacity:40,  floor:'2', facilities:['Projector','AC'],                 util:58, status:'Under Maintenance'  },
  { name:'Room 106',   type:'Lecture',    capacity:45,  floor:'1', facilities:['Projector','Whiteboard','AC'],    util:71, status:'Available'         },
  { name:'Auditorium', type:'Auditorium', capacity:200, floor:'G', facilities:['Projector','AC','Whiteboard'],    util:22, status:'Available'         },
];
let coursesData = [
  { name:'Internet Programming', code:'IP',  type:'Core',     ch:3, teacher:'Dr. Sara Ahmed',   sessions:3, color:'gold'   },
  { name:'Operating Systems',    code:'OS',  type:'Core',     ch:3, teacher:'Dr. Kamran Malik',  sessions:3, color:'teal'   },
  { name:'Data Structures',      code:'DS',  type:'Core',     ch:3, teacher:'Prof. Bilal Khan',  sessions:3, color:'amber'  },
  { name:'Mobile App Dev',       code:'MAD', type:'Core',     ch:3, teacher:'Ms. Ayesha Noor',   sessions:3, color:'coral'  },
  { name:'Disc. Mathematics',    code:'DM',  type:'Elective', ch:3, teacher:'Dr. Ali Hassan',    sessions:2, color:'blue'   },
  { name:'IP Lab',               code:'IPL', type:'Lab',      ch:1, teacher:'Dr. Sara Ahmed',    sessions:1, color:'purple' },
];
let sectionsData = [
  { name:'F23-Afternoon-A', batch:'F23-Afternoon', shift:'Afternoon', label:'A', students:45, capacity:50, courses:['IP','OS','DS','MAD','DM'] },
  { name:'F23-Afternoon-B', batch:'F23-Afternoon', shift:'Afternoon', label:'B', students:42, capacity:50, courses:['IP','OS','DS','MAD','DM'] },
  { name:'F23-Afternoon-C', batch:'F23-Afternoon', shift:'Afternoon', label:'C', students:38, capacity:50, courses:['IP','OS','DS','DM']       },
  { name:'F23-Morning-A',   batch:'F23-Morning',   shift:'Morning',   label:'A', students:43, capacity:50, courses:['IP','OS','DS','MAD','DM'] },
];

/* ─────────────────────────────────────────────────────────────
   §5  BUILDER STATE
───────────────────────────────────────────────────────────────*/
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

/* ─────────────────────────────────────────────────────────────
   §6  HELPERS
───────────────────────────────────────────────────────────────*/
function safeSet(id,val){ const e=document.getElementById(id); if(e) e.textContent=val; }
function _setVal(id,val){ const e=document.getElementById(id); if(e) e.value=val; }
function _clearField(id){ const e=document.getElementById(id); if(e) e.value=''; }
function ttKey(d,s,sec){ return `${d}-${s}-${sec}`; }
function _sortArray(arr,key,asc){
  return [...arr].sort((a,b)=>{
    let av=a[key]??'', bv=b[key]??'';
    if(typeof av==='string') av=av.toLowerCase();
    if(typeof bv==='string') bv=bv.toLowerCase();
    return asc ? (av>bv?1:-1) : (av<bv?1:-1);
  });
}
function _emptyRow(icon,text,cols){
  return `<tr><td colspan="${cols}"><div class="manage-empty"><div class="manage-empty-icon">${icon}</div><div class="manage-empty-text">${text}</div></div></td></tr>`;
}
function timestamp(){
  const now=new Date();
  return now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+now.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});
}

/* ─────────────────────────────────────────────────────────────
   §7  TOAST
───────────────────────────────────────────────────────────────*/
function showToast(msg, type=''){
  const c=document.getElementById('toastContainer'); if(!c) return;
  const el=document.createElement('div');
  el.className=`toast-msg ${type}`; el.textContent=msg;
  c.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),350); },2800);
}

/* ─────────────────────────────────────────────────────────────
   §8  EXPORT PDF — FIXED: targets inner content, not full page
───────────────────────────────────────────────────────────────*/
function exportPDF(){
  function _loadScript(src, cb){
    if(document.querySelector(`script[src="${src}"]`)){ cb(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=cb;
    document.head.appendChild(s);
  }

  showToast('⏳ Preparing PDF download…','success');

  _loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ()=>{
    _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', ()=>{

      const activePage = document.querySelector('.page.active');
      if(!activePage){ showToast('Nothing to export','error'); return; }

      /* FIX: capture only the inner scrollable content area, not the full page
         which includes the sidebar, nav chrome, etc. — that caused misalignment */
      const captureTarget =
        activePage.querySelector('.main-content') ||
        activePage.querySelector('.tt-page')      ||
        activePage.querySelector('.clash-page')   ||
        activePage.querySelector('.req-page')     ||
        activePage.querySelector('.notif-page')   ||
        activePage.querySelector('.analytics-page')||
        activePage.querySelector('.builder-page') ||
        activePage.querySelector('.manage-page')  ||
        activePage;

      /* Scroll to top before capture so nothing is clipped */
      window.scrollTo(0,0);
      captureTarget.scrollTop = 0;

      /* Temporarily hide action buttons that clutter the PDF */
      const hideEls = [...document.querySelectorAll('.header-actions, .back-btn, .builder-config > button')];
      hideEls.forEach(el=>{ el._pd = el.style.display; el.style.display='none'; });

      html2canvas(captureTarget, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureTarget.scrollWidth,
        windowHeight: captureTarget.scrollHeight,
      }).then(canvas=>{
        hideEls.forEach(el=>{ el.style.display = el._pd || ''; });

        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pageW = 210, pageH = 297;
        const imgW  = pageW;
        const imgH  = (canvas.height * pageW) / canvas.width;
        const pdf   = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });

        let yOff = 0, rem = imgH, page = 0;
        while(rem > 0){
          if(page > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOff, imgW, imgH);
          yOff += pageH; rem -= pageH; page++;
        }

        const dateStr = new Date().toISOString().slice(0,10);
        pdf.save(`IBIT-TAS_${activePage.id}_${dateStr}.pdf`);
        showToast('✅ PDF downloaded!','success');

      }).catch(err=>{
        hideEls.forEach(el=>{ el.style.display = el._pd || ''; });
        console.error('html2canvas error:', err);
        showToast('❌ PDF export failed. Try again.','error');
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   §9  NOTIFICATIONS SYSTEM
───────────────────────────────────────────────────────────────*/
let notifActiveFilter = 'all';

function pushNotification(title, msg, type='gold'){
  const notif = { id:Date.now(), title, msg, type, time:timestamp(), unread:true };
  APP.notifications.unshift(notif);
  _updateNotifBadges();
  if(APP.currentRole !== 'guest'){
    if(document.getElementById('notif')?.classList.contains('active')) renderNotifFeed();
    showToast(`🔔 ${title}`, type==='coral'?'error':type==='amber'?'warn':'success');
  }
}

function _updateNotifBadges(){
  const unread = APP.notifications.filter(n=>n.unread).length;
  document.querySelectorAll('.sidebar-item').forEach(item=>{
    if(item.textContent.includes('Notifications')){
      let badge = item.querySelector('.sidebar-badge');
      if(!badge){ badge=document.createElement('span'); badge.className='sidebar-badge'; item.appendChild(badge); }
      badge.textContent = unread || '';
    }
  });
}

function renderNotifFeed(){
  const feed = document.querySelector('#notif .notif-feed');
  if(!feed) return;
  const typeMap = { gold:'nd-gold', teal:'nd-teal', coral:'nd-coral', amber:'nd-amber' };
  const iconMap = { gold:'📅', teal:'✅', coral:'❌', amber:'⚠️' };
  let filtered = notifActiveFilter==='all' ? APP.notifications : APP.notifications.filter(n=>n.type===notifActiveFilter);

  if(filtered.length===0){
    feed.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text3)">No notifications in this category</div>';
  } else {
    feed.innerHTML = filtered.map(n=>{
      const ri = APP.notifications.indexOf(n);
      return `
      <div class="notif-card ${n.unread?'unread '+n.type:''}" onclick="markRead(${ri})">
        <div class="notif-dot ${typeMap[n.type]||'nd-gold'}">${iconMap[n.type]||'📅'}</div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.msg}</div>
          <div class="notif-meta">${n.time}</div>
        </div>
        ${n.unread?`<div class="notif-unread-dot" style="background:var(--${n.type==='gold'?'gold-lt':n.type})"></div>`:''}
      </div>`;
    }).join('');
  }

  const unread  = APP.notifications.filter(n=>n.unread).length;
  const cancels = APP.notifications.filter(n=>n.type==='coral').length;
  const makeup  = APP.notifications.filter(n=>n.type==='teal').length;
  const changes = APP.notifications.filter(n=>n.type==='gold').length;
  const reqs    = APP.notifications.filter(n=>n.type==='amber').length;
  const total   = APP.notifications.length;

  const nsSummary = document.querySelector('#notif .notif-summary');
  if(nsSummary){
    const rows = nsSummary.querySelectorAll('.ns-stat');
    const vals = [unread, total, total, cancels];
    rows.forEach((row,i)=>{ const c=row.querySelector('.ns-count'); if(c&&vals[i]!==undefined) c.textContent=vals[i]; });
  }
  _updateNotifFilterCounts(total, cancels, makeup, changes, reqs);
}

function _updateNotifFilterCounts(all, cancels, makeup, changes, reqs){
  const nfBtns = document.querySelectorAll('#notif .nf-btn');
  const counts = [all, cancels, makeup, changes, reqs];
  nfBtns.forEach((btn,i)=>{ const badge=btn.querySelector('.nf-count'); if(badge&&counts[i]!==undefined) badge.textContent=counts[i]; });
}

function markRead(idx){
  if(APP.notifications[idx]) APP.notifications[idx].unread=false;
  _updateNotifBadges();
  renderNotifFeed();
}

function markAllRead(){
  APP.notifications.forEach(n=>n.unread=false);
  _updateNotifBadges();
  renderNotifFeed();
  showToast('All notifications marked as read','success');
}

function setNotifFilter(filter){
  notifActiveFilter = filter;
  document.querySelectorAll('#notif .nf-btn').forEach(btn=>{
    btn.classList.toggle('active', (btn.dataset.filter||'all')===filter);
  });
  renderNotifFeed();
}

/* ─────────────────────────────────────────────────────────────
   §10  PENDING REQUESTS
───────────────────────────────────────────────────────────────*/
function pushPendingRequest(req){
  req.id = Date.now();
  req.status = 'pending';
  APP.pendingRequests.unshift(req);
  _updateRequestBadges();
  renderDashPendingRequests();
}

function _updateRequestBadges(){
  const count = APP.pendingRequests.filter(r=>r.status==='pending').length;
  document.querySelectorAll('.sidebar-item').forEach(item=>{
    if(item.textContent.trim().includes('Requests')){
      let badge=item.querySelector('.sidebar-badge');
      if(!badge){ badge=document.createElement('span'); badge.className='sidebar-badge'; item.appendChild(badge); }
      badge.textContent = count||'';
    }
  });
}

function _buildReqItemHTML(r){
  return `
    <div class="req-item" data-req-id="${r.id}">
      <div class="req-info">
        <div class="req-teacher">${r.teacher} – ${r.type}</div>
        <div class="req-detail">${r.detail}</div>
      </div>
      <div class="req-actions">
        <button class="req-btn req-approve" onclick="approveRequest(${r.id})">✓ Approve</button>
        <button class="req-btn req-reject"  onclick="rejectRequest(${r.id})">✕ Reject</button>
      </div>
    </div>`;
}

function renderDashPendingRequests(){
  const list = document.querySelector('#dash .req-list');
  if(!list) return;
  const pending = APP.pendingRequests.filter(r=>r.status==='pending');
  list.innerHTML = pending.length===0
    ? '<div style="padding:1rem;text-align:center;color:var(--text3);font-size:.85rem">No pending requests</div>'
    : pending.map(_buildReqItemHTML).join('');
}

function renderAdminReqList(){
  const reqPage = document.getElementById('req');
  if(!reqPage || APP.currentRole!=='admin') return;
  let adminList = reqPage.querySelector('#adminPendingList');
  if(!adminList){
    adminList = document.createElement('div');
    adminList.id = 'adminPendingList';
    adminList.style.cssText = 'margin-top:1.5rem';
    const adminNote = reqPage.querySelector('#adminReqNote');
    if(adminNote) adminNote.after(adminList);
    else reqPage.querySelector('.req-page')?.appendChild(adminList);
  }
  const pending = APP.pendingRequests.filter(r=>r.status==='pending');
  adminList.innerHTML = `
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1rem;color:var(--text);margin-bottom:.75rem">
      Pending Requests <span style="font-size:.8rem;font-weight:400;color:var(--text3)">(${pending.length})</span>
    </div>
    <div class="req-list">
    ${pending.length===0
      ? '<div style="padding:1.5rem;text-align:center;color:var(--text3);font-size:.85rem;background:#fff;border:1.5px solid #E2E8F0;border-radius:12px">No pending requests from teachers</div>'
      : pending.map(_buildReqItemHTML).join('')
    }
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   FIX: approveRequest / rejectRequest
   - Number(id) coercion so string IDs from onclick="" match
   - querySelectorAll with attribute selector (not CSS ID with numbers)
───────────────────────────────────────────────────────────────*/
function approveRequest(id){
  id = Number(id);
  const req = APP.pendingRequests.find(r=>r.id===id);
  if(!req){ showToast('Request not found','error'); return; }
  req.status = 'approved';
  /* Remove all rendered cards with this ID from every list on the page */
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el=>el.remove());
  pushNotification('Request Approved — '+req.type, `${req.teacher}'s request has been approved. ${req.detail}`, 'teal');
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
  showToast(`✓ Approved: ${req.teacher} – ${req.type}`, 'success');
}

function rejectRequest(id){
  id = Number(id);
  const req = APP.pendingRequests.find(r=>r.id===id);
  if(!req){ showToast('Request not found','error'); return; }
  req.status = 'rejected';
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el=>el.remove());
  pushNotification('Request Rejected — '+req.type, `${req.teacher}'s request was rejected by admin.`, 'coral');
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
  showToast(`✕ Rejected: ${req.teacher} – ${req.type}`, 'error');
}

/* ─────────────────────────────────────────────────────────────
   §11  LOGIN
───────────────────────────────────────────────────────────────*/
function handleLogin(){
  const emailEl = document.querySelector('.login-right .form-input[type="email"]');
  const passEl  = document.querySelector('.login-right .form-input[type="password"]');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pass    = (passEl?.value||'').trim();
  const selectedRoleEl = document.querySelector('.login-right .role-card.selected .role-name');
  const selectedRole   = (selectedRoleEl?.textContent||'').toLowerCase();

  if(!email||!pass){ showToast('Please enter email and password','error'); return; }
  const cred = ROLE_CREDENTIALS[email];
  if(!cred||cred.password!==pass){ showToast('Invalid email or password','error'); return; }
  if(cred.role!==selectedRole){
    showToast(`This account is a ${cred.role}, not a ${selectedRole}. Please select the correct role.`,'error'); return;
  }

  APP.currentRole = cred.role;
  APP.currentUser = { name:cred.name, email, role:cred.role };
  _seedNotificationsForRole(cred.role);
  showToast(`✓ Welcome, ${cred.name}! Logged in as ${cred.role}`,'success');

  setTimeout(()=>{
    applyRoleAccess();
    const firstPage = cred.role==='admin'?'dash': cred.role==='teacher'?'dash-teacher':'dash-student';
    goPage(firstPage);
  }, 600);
}

function _seedNotificationsForRole(role){
  APP.notifications = [];
  notifActiveFilter = 'all';

  if(role==='admin'){
    APP.pendingRequests = [];
    const demoReqs = [
      { type:'Makeup / Reschedule', teacher:'Dr. Sara',   detail:'IP · F23-Afternoon-A · Makeup on 2026-04-21 · Room 202', course:'IP', section:'F23-Afternoon-A' },
      { type:'Section Merge',       teacher:'Prof. Bilal', detail:'DS · Merge F23-Afternoon-A + F23-Afternoon-B · Auditorium' },
      { type:'Cancel Lecture',      teacher:'Dr. Kamran',  detail:'OS · F23-Afternoon-B · 2026-04-18 · Sick Leave' },
    ];
    /* FIX: use integer IDs (Date.now()+i), not floats */
    demoReqs.forEach((r,i)=>{ r.id=Date.now()+i; r.status='pending'; APP.pendingRequests.push(r); });
    _updateRequestBadges();
  }

  if(role==='admin'||role==='teacher'){
    _pushSilent('Lecture Cancelled — OS · Section B','Dr. Kamran cancelled today\'s Operating Systems lecture for Section B.','coral');
    _pushSilent('Makeup Approved — IP Lab · Section A','Makeup request approved. New slot: Monday, April 21 at 2:00 PM in Room 202.','teal');
    _pushSilent('Clash Detected — Room 204 Double-Booked','Room 204 is booked for MAD Section A and IP Lab Section B simultaneously on Wednesday 10:00 AM.','amber');
    _pushSilent('Timetable Updated — Section F23-A','Friday\'s DM lecture has been moved to Thursday 11:00 AM.','gold');
    _pushSilent('Section Merge Approved — DS Sections A+B','Prof. Bilal\'s request to merge DS sections A and B approved.','teal');
    _pushSilent('Lecture Cancelled — DM · Section C','Dr. Nasir cancelled the Discrete Mathematics lecture for Section C on April 16.','coral');
  } else if(role==='student'){
    _pushSilent('OS Lecture Cancelled Tomorrow','Dr. Kamran cancelled Wednesday\'s OS lecture.','coral');
    _pushSilent('Makeup Session Approved','IP Lab makeup session scheduled: Friday 2:00 PM in Room 202.','teal');
    _pushSilent('New Timetable Published','Your section timetable has been updated. Please review your schedule.','gold');
  }
  _updateNotifBadges();
}

function _pushSilent(title, msg, type='gold'){
  APP.notifications.push({ id:Date.now()+Math.floor(Math.random()*9999), title, msg, type, time:timestamp(), unread:true });
}

/* ─────────────────────────────────────────────────────────────
   §12  ROLE-BASED ACCESS + UI GUARD
───────────────────────────────────────────────────────────────*/
function applyRoleAccess(){
  const allowed = ROLE_ACCESS[APP.currentRole]||['login'];
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\(['"]([^'"]+)['"]/);
    const pageId = match?match[1]:'';
    btn.style.display = (!pageId||pageId==='login'||!allowed.includes(pageId))?'none':'';
  });
  _applyReqTabVisibility();
}

function _applyReqTabVisibility(){
  const reqPage = document.getElementById('req');
  if(!reqPage) return;
 
  /* Exact selectors from your HTML */
  const formCard  = reqPage.querySelector('.form-card');       /* the big left form card */
  const tabBar    = reqPage.querySelector('.req-type-tabs');   /* Makeup / Merge / Cancel tabs */
  const reqLayout = reqPage.querySelector('.req-layout');      /* the two-column layout wrapper */
  const adminNote = reqPage.querySelector('#adminReqNote');
 
  if(APP.currentRole === 'admin'){
 
    /* Hide the entire teacher-facing layout */
    if(reqLayout) reqLayout.style.display = 'none';
 
    /* Inject admin banner if not already present */
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
 
    /* Restore the full layout for teachers */
    if(reqLayout) reqLayout.style.display = '';
    document.getElementById('adminReqNote')?.remove();
    document.getElementById('adminPendingList')?.remove();
  }
}
 

/* ─────────────────────────────────────────────────────────────
   §13  PAGE NAVIGATION + BACK BUTTON
───────────────────────────────────────────────────────────────*/
function show(id, btn){
  if(id !== 'login' && !ROLE_ACCESS[APP.currentRole]?.includes(id)){
    showToast('Access denied.', 'error'); return;
  }
  APP.prevPage = _currentPage();
  _activatePage(id);
 
  /* Highlight the correct nav button by ID match, not index */
  _syncTopNav(id);
  if(btn) { /* if called directly with a btn ref, still honour it */
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
 
  /* FIX: match by page ID in onclick attr, not by array index */
  _syncTopNav(id);
 
  window.scrollTo(0, 0);
  _onPageEnter(id);
}
 
/* New helper — sets the active class on whichever nav button
   targets the given page ID, clears all others */
function _syncTopNav(id){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const match = (btn.getAttribute('onclick') || '').match(/show\(['"]([^'"]+)['"]/);
    const pageId = match ? match[1] : '';
    btn.classList.toggle('active', pageId === id);
  });
}
 
/* Expose on window so inline onclick="" calls still work */
window.show    = show;
window.goPage  = goPage;
window._syncTopNav = _syncTopNav;
 

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
    case 'dash':     renderDashPendingRequests(); break;
  }
}

/* ─────────────────────────────────────────────────────────────
   §14  TIMETABLE VIEW — Batch + Section filter
───────────────────────────────────────────────────────────────*/
function onTTBatchChange(){
  const sel = document.getElementById('ttBatchFilter');
  const raw = sel?.value||'all';
  const batchNames = [...new Set(sectionsData.map(s=>s.batch))];
  ttBatchFilter = (raw==='all')?'all':(batchNames[parseInt(raw)]||'all');
  ttSectionFilter = 'all';
  const sf = document.getElementById('ttSectionFilter');
  if(sf) sf.value='all';
  _populateTTSectionFilter();
  renderTimetableView();
}

function onTTSectionChange(){
  const sel = document.getElementById('ttSectionFilter');
  ttSectionFilter = sel?.value||'all';
  renderTimetableView();
}

function _populateTTSectionFilter(){
  const sf = document.getElementById('ttSectionFilter');
  if(!sf) return;
  let secs = sectionsData;
  if(ttBatchFilter!=='all') secs = sectionsData.filter(s=>s.batch===ttBatchFilter);
  sf.innerHTML = '<option value="all">Section: All Sections</option>';
  secs.forEach(s=>{
    const globalIdx = sectionsData.indexOf(s);
    const opt = document.createElement('option');
    opt.value = globalIdx;
    opt.textContent = `Section: ${s.label} (${s.name})`;
    sf.appendChild(opt);
  });
}

function renderTimetableView(){
  let visibleSecs = sectionsData.map((_,i)=>i);
  if(ttBatchFilter!=='all') visibleSecs = visibleSecs.filter(i=>sectionsData[i].batch===ttBatchFilter);
  if(ttSectionFilter!=='all'){
    const idx = parseInt(ttSectionFilter);
    if(!isNaN(idx)) visibleSecs=[idx];
  }
  if(Object.keys(APP.publishedTimetable).length===0) return;
  const ttBody = document.querySelector('#tt .tt-body');
  if(!ttBody) return;
  const rows = ttBody.querySelectorAll('.tt-row');
  rows.forEach((row, rowIdx)=>{
    if(rowIdx===4) return;
    const slots = row.querySelectorAll('.tt-slot');
    slots.forEach((slot, dayIdx)=>{
      const entries = slot.querySelector('.slot-entries');
      if(!entries) return;
      entries.innerHTML='';
      visibleSecs.forEach(sec=>{
        const key = ttKey(dayIdx,rowIdx,sec);
        const cls = APP.publishedTimetable[key];
        if(cls){
          entries.innerHTML += `
            <div class="class-block" style="background:${cls.bg};border-left:3px solid ${cls.border}">
              <div class="cb-course" style="color:${cls.fg}">${cls.name}</div>
              <div class="cb-room" style="color:${cls.fg}">${cls.room}</div>
              <div class="cb-teacher" style="color:${cls.fg}">${cls.teacher}</div>
              ${visibleSecs.length>1?`<div class="cb-teacher" style="color:${cls.fg};font-size:.65rem">${SECTIONS[sec]}</div>`:''}
            </div>`;
        }
      });
    });
  });
}

function switchTTView(mode){
  const weekly  = document.getElementById('weeklyTT');
  const monthly = document.getElementById('monthlyTT');
  const btnW    = document.getElementById('btnWeekly');
  const btnM    = document.getElementById('btnMonthly');
  if(mode==='weekly'){
    if(weekly)  weekly.style.display='';
    if(monthly) monthly.style.display='none';
    btnW?.classList.add('active'); btnM?.classList.remove('active');
  } else {
    if(weekly)  weekly.style.display='none';
    if(monthly) monthly.style.display='block';
    btnW?.classList.remove('active'); btnM?.classList.add('active');
  }
}

/* ─────────────────────────────────────────────────────────────
   §15  CLASH DETECTION
───────────────────────────────────────────────────────────────*/
function detectClashes(){
  APP.clashes=[];
  for(let d=0;d<5;d++){
    for(let s=0;s<7;s++){
      const entries=[];
      for(let sec=0;sec<SECTIONS.length;sec++){
        const key=ttKey(d,s,sec);
        if(timetableData[key]) entries.push({...timetableData[key],sec,day:d,slot:s});
      }
      const teacherMap={}, roomMap={};
      entries.forEach(e=>{
        if(teacherMap[e.teacher]){
          APP.clashes.push({ type:'Teacher Double-Booking', priority:'High', teacher:e.teacher, day:DAYS[d], time:SLOTS[s],
            classA:`${teacherMap[e.teacher].code} · ${SECTIONS[teacherMap[e.teacher].sec]}`, classB:`${e.code} · ${SECTIONS[e.sec]}`,
            dayIdx:d, slotIdx:s, secB:e.sec, id:Date.now()+Math.random() });
        } else { teacherMap[e.teacher]=e; }
        if(roomMap[e.room]){
          APP.clashes.push({ type:'Room Double-Booking', priority:'Medium', room:e.room, day:DAYS[d], time:SLOTS[s],
            classA:`${roomMap[e.room].code} · ${SECTIONS[roomMap[e.room].sec]}`, classB:`${e.code} · ${SECTIONS[e.sec]}`,
            dayIdx:d, slotIdx:s, secB:e.sec, id:Date.now()+Math.random() });
        } else { roomMap[e.room]=e; }
      });
    }
  }
  return APP.clashes;
}

function renderClashPage(){
  detectClashes();
  const clashGrid = document.querySelector('#clash .clash-grid');
  const banner    = document.querySelector('#clash .clash-banner');
  const bannerText= document.querySelector('#clash .clash-banner-text');
  const actionPill= banner?.querySelector('.pill-coral');
  if(!clashGrid||!bannerText) return;

  if(APP.clashes.length===0){
    if(actionPill) actionPill.style.display='none';
    banner.style.background='linear-gradient(135deg,rgba(8,145,178,.08),rgba(8,145,178,.03))';
    banner.style.borderColor='rgba(8,145,178,.25)';
    bannerText.innerHTML=`<h2 style="color:var(--teal)">✅ No Conflicts Detected</h2><p>The timetable is clean. You can publish safely.</p>`;
    clashGrid.innerHTML=`<div style="grid-column:1/-1;background:#fff;border:1.5px solid #E2E8F0;border-radius:14px;padding:3rem;text-align:center;color:var(--text3)"><div style="font-size:3rem;margin-bottom:1rem">🎉</div><div style="font-size:1rem">All scheduling conflicts have been resolved!</div></div>`;
    return;
  }

  if(actionPill) actionPill.style.display='';
  banner.style.background='';
  banner.style.borderColor='';
  bannerText.innerHTML=`<h2>${APP.clashes.length} Scheduling Conflict${APP.clashes.length>1?'s':''} Detected</h2><p>Review and resolve before publishing.</p>`;

  clashGrid.innerHTML = APP.clashes.map(c=>`
    <div class="clash-card" id="clash-${c.id}">
      <div class="clash-card-header">
        <div class="clash-type">${c.type==='Teacher Double-Booking'?'🧑‍🏫':'🏫'} ${c.type}</div>
        <span class="pill ${c.priority==='High'?'pill-coral':'pill-amber'}">${c.priority} Priority</span>
      </div>
      <div class="conflict-items">
        <div style="font-size:.8rem;color:var(--text3);margin-bottom:.5rem">
          ${c.teacher?`<strong>${c.teacher}</strong> is assigned to two classes at the same time:`:`<strong>${c.room}</strong> is double-booked:`}
        </div>
        <div class="conflict-row">
          <div><div class="conflict-label">Class A</div><div class="conflict-value">${c.classA}</div></div>
          <div class="vs-badge">VS</div>
          <div style="text-align:right"><div class="conflict-label">Class B</div><div class="conflict-value">${c.classB}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem">
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:.6rem .75rem">
            <div style="font-size:.72rem;color:var(--text3)">Day / Time</div>
            <div style="font-size:.85rem;font-weight:600;margin-top:.15rem;color:var(--text)">${c.day} · ${c.time}</div>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:.6rem .75rem">
            <div style="font-size:.72rem;color:var(--text3)">${c.room?'Room':'Teacher'}</div>
            <div style="font-size:.85rem;font-weight:600;margin-top:.15rem;color:var(--text)">${c.room||c.teacher}</div>
          </div>
        </div>
        <button onclick="resolveClash('${c.id}')"
          style="margin-top:.75rem;width:100%;padding:.6rem;border-radius:9px;border:none;background:var(--coral-dim);color:var(--coral);font-family:'Outfit',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;transition:all .2s"
          onmouseover="this.style.background='rgba(220,38,38,.25)'"
          onmouseout="this.style.background='var(--coral-dim)'">
          🗑 Remove This Conflict
        </button>
      </div>
    </div>`).join('');
}

function resolveClash(clashId){
  const clash = APP.clashes.find(c=>String(c.id)===String(clashId));
  if(!clash){ showToast('Clash not found','error'); return; }
  const key = ttKey(clash.dayIdx,clash.slotIdx,clash.secB);
  if(timetableData[key]){
    const cls = timetableData[key];
    delete timetableData[key];
    showToast(`✓ Conflict resolved — removed ${cls.code} from ${SECTIONS[clash.secB]} on ${clash.day}`,'success');
    pushNotification('Clash Resolved',`${clash.type} on ${clash.day} · ${clash.time} has been resolved.`,'teal');
    APP.clashes = APP.clashes.filter(c=>String(c.id)!==String(clashId));
    document.getElementById(`clash-${clashId}`)?.remove();
    updateStats();
    if(APP.clashes.length===0) renderClashPage();
  } else {
    showToast('Could not auto-resolve. Remove the class manually from the builder.','warn');
  }
}

/* ─────────────────────────────────────────────────────────────
   §16  TEACHER REQUEST SUBMISSION
───────────────────────────────────────────────────────────────*/
function submitRequest(type){
  if(APP.currentRole!=='teacher'){ showToast('Only teachers can submit requests','error'); return; }
  let teacher = APP.currentUser?.name||'Dr. Sara';
  let reqData = {};

  if(type==='makeup'){
    const selects = document.querySelectorAll('#tab-makeup select');
    const dates   = document.querySelectorAll('#tab-makeup input[type="date"]');
    const reason  = document.querySelector('#tab-makeup textarea')?.value||'';
    const course  = selects[0]?.value||'Unknown';
    const section = selects[1]?.value||'';
    const newDate = dates[1]?.value||'';
    const room    = selects[3]?.value||'Auto-assign';
    reqData = { type:'Makeup / Reschedule', teacher, detail:`${course} · ${section} · Makeup on ${newDate} · ${room}`, course, section, reason };
  } else if(type==='merge'){
    const sels = document.querySelectorAll('#tab-merge select');
    const course=sels[0]?.value||'', secA=sels[1]?.value||'', secB=sels[2]?.value||'', venue=sels[3]?.value||'';
    reqData = { type:'Section Merge', teacher, detail:`${course} · Merge ${secA} + ${secB} · ${venue}` };
  } else if(type==='cancel'){
    const sels=document.querySelectorAll('#tab-cancel select');
    const dates=document.querySelectorAll('#tab-cancel input[type="date"]');
    const course=sels[0]?.value||'', section=sels[1]?.value||'', date=dates[0]?.value||'', reason=sels[2]?.value||'';
    reqData = { type:'Cancel Lecture', teacher, detail:`${course} · ${section} · ${date} · ${reason}` };
  }

  if(!reqData.type){ showToast('Unknown request type','error'); return; }
  pushPendingRequest(reqData);
  pushNotification(`New ${reqData.type} Request`, `${teacher} submitted: ${reqData.detail}`, 'amber');
  showToast('✓ Request submitted! Admin will review shortly.','success');
  _addToRequestHistory(reqData);
}

function _addToRequestHistory(req){
  const colors = { 'Makeup / Reschedule':'var(--amber)', 'Section Merge':'var(--teal)', 'Cancel Lecture':'var(--coral)' };
  const color  = colors[req.type]||'var(--gold-lt)';
  document.querySelectorAll('.workflow-card:last-child .workflow-body').forEach(histBody=>{
    const item = document.createElement('div');
    item.className='hist-item';
    item.innerHTML=`
      <div style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0;margin-top:5px"></div>
      <div>
        <div class="hist-title">${req.type} · ${req.detail.split('·')[0]||''}</div>
        <div class="hist-meta">Pending Admin Review · ${timestamp()}</div>
      </div>`;
    histBody.prepend(item);
  });
}

/* ─────────────────────────────────────────────────────────────
   §17  BUILD TIMETABLE GRID
───────────────────────────────────────────────────────────────*/
function buildGrid(){
  const tbody=document.getElementById('gridBody'); if(!tbody) return;
  tbody.innerHTML='';
  for(let display=0;display<8;display++){
    const isBreak=(display===4);
    const slotIdx=display<4?display:(display-1);
    const tr=document.createElement('tr');
    const tdTime=document.createElement('td');
    tdTime.className='bgt-time'+(isBreak?' break-row':'');
    if(isBreak){ tdTime.textContent='12:00 – 1:00 PM'; tdTime.style.cssText='color:var(--amber);font-style:italic;font-size:.68rem;'; }
    else { tdTime.textContent=SLOT_LABELS[slotIdx]; }
    tr.appendChild(tdTime);
    for(let d=0;d<5;d++){
      const td=document.createElement('td');
      td.className='bgt-cell'+(isBreak?' break-row':'');
      if(!isBreak){
        td.id=`cell-${d}-${slotIdx}`;
        td.style.cursor='pointer';
        td.addEventListener('click',(e)=>{
          if(e.target.classList.contains('bc-remove')||e.target.closest?.('.bc-remove')) return;
          selectCell(d,slotIdx);
        });
        td.innerHTML=renderCell(d,slotIdx);
      } else {
        td.innerHTML='<div class="break-label">🍽 Break</div>';
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  updateStats();
  updateSectionLabel();
}

function renderCell(d,s){
  const isSelected=(String(d)===String(selectedDay)&&String(s)===String(selectedSlot));
  let classes=[];
  if(viewSection==='all'){
    for(let sec=0;sec<SECTIONS.length;sec++){
      const key=ttKey(d,s,sec);
      if(timetableData[key]) classes.push({...timetableData[key],sectionIdx:sec});
    }
  } else {
    const key=ttKey(d,s,viewSection);
    if(timetableData[key]) classes.push({...timetableData[key],sectionIdx:Number(viewSection)});
  }

  if(classes.length>0){
    let html='<div class="cell-stack">';
    classes.forEach(cls=>{
      html+=`<div class="built-class" style="background:${cls.bg};border-left:3px solid ${cls.border}" data-section="${cls.sectionIdx}">
        <button class="bc-remove" onclick="removeCell(${d},${s},${cls.sectionIdx},event)" title="Remove">×</button>
        <div class="bc-course-name" style="color:${cls.fg}">${cls.code}</div>
        <div class="bc-detail" style="color:${cls.fg}">${cls.room}</div>
        <div class="bc-detail" style="color:${cls.fg}">${cls.teacher}</div>
        ${viewSection==='all'?`<div class="bc-detail" style="font-size:.6rem;opacity:.7">${SECTIONS[cls.sectionIdx]}</div>`:''}
      </div>`;
    });
    html+='</div>';
    return html;
  }
  return `<div class="empty-slot" style="${isSelected?'background:var(--gold-dim);border:2px dashed rgba(29,78,216,.3);':''}"><span class="empty-slot-icon">＋</span></div>`;
}

function refreshGrid(){
  for(let d=0;d<5;d++) for(let s=0;s<7;s++){
    const el=document.getElementById(`cell-${d}-${s}`);
    if(el) el.innerHTML=renderCell(d,s);
  }
  updateStats();
}

function selectCell(d,s){
  selectedDay=String(d); selectedSlot=String(s);
  _setVal('fDay',d); _setVal('fSlot',s);
  const fSec=document.getElementById('fSection');
  if(fSec) fSec.value=viewSection==='all'?0:viewSection;
  const hint=document.getElementById('slotHint');
  if(hint){ hint.textContent=`✓ Selected: ${DAYS[d]} · ${SLOTS[s]}`; hint.style.color='var(--gold-lt)'; }
  refreshGrid();
  checkConflict();
  document.getElementById('addFormPanel')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function removeCell(d,s,secIdx,e){
  if(e&&e.stopPropagation) e.stopPropagation();
  const key=ttKey(d,s,secIdx);
  if(timetableData[key]){
    const cls=timetableData[key];
    delete timetableData[key];
    refreshGrid();
    showToast(`Removed ${cls.code} from ${DAYS[d]} · ${SLOTS[s]}`,'warn');
  }
}

function addClassToGrid(){
  const cIdx  =document.getElementById('fCourse')?.value;
  const tIdx  =document.getElementById('fTeacher')?.value;
  const rIdx  =document.getElementById('fRoom')?.value;
  const dIdx  =document.getElementById('fDay')?.value;
  const sIdx  =document.getElementById('fSlot')?.value;
  const secIdx=parseInt(document.getElementById('fSection')?.value);

  if(cIdx===''||tIdx===''||rIdx===''||dIdx===''||sIdx===''||isNaN(secIdx)){
    showToast('Please fill all fields before adding','error'); return;
  }

  const course  = COURSES[parseInt(cIdx)];
  const teacher = TEACHERS[parseInt(tIdx)];
  const room    = ROOMS[parseInt(rIdx)];
  const d=parseInt(dIdx), s=parseInt(sIdx);

  const secKey=ttKey(d,s,secIdx);
  if(timetableData[secKey]){ showToast(`${SECTIONS[secIdx]} already has ${timetableData[secKey].code} in this slot`,'error'); return; }

  for(let sec=0;sec<SECTIONS.length;sec++){
    const k=ttKey(d,s,sec);
    if(!timetableData[k]||sec===secIdx) continue;
    if(timetableData[k].teacher===teacher){ showToast(`⚠️ ${teacher} already teaches at ${DAYS[d]} · ${SLOTS[s]}`,'error'); return; }
    if(timetableData[k].room===room){ showToast(`⚠️ ${room} is already booked at ${DAYS[d]} · ${SLOTS[s]}`,'error'); return; }
  }

  timetableData[secKey]={ code:course.code, name:course.name, color:course.color,
    bg:course.bg, border:course.border, fg:course.fg, teacher, room, section:SECTIONS[secIdx] };

  refreshGrid();
  recentAdds.unshift({text:`${course.code} · ${DAYS[d]} ${SLOTS[s]}`,detail:`${teacher} · ${room} · ${SECTIONS[secIdx]}`});
  if(recentAdds.length>8) recentAdds.pop();
  renderRecentLog();
  updateSectionLabel();
  showToast(`✓ ${course.code} added — ${DAYS[d]} · ${SLOTS[s]}`,'success');
}

function checkConflict(){
  const dIdx   = document.getElementById('fDay')?.value;
  const sIdx   = document.getElementById('fSlot')?.value;
  const secIdx = parseInt(document.getElementById('fSection')?.value);
  const warn   = document.getElementById('conflictWarn');
  if(!warn) return;
  if(!dIdx||!sIdx||isNaN(secIdx)){ warn.style.display='none'; return; }
  const key=ttKey(parseInt(dIdx),parseInt(sIdx),secIdx);
  if(timetableData[key]){
    warn.style.display='block';
    warn.textContent=`⚠️ Slot occupied by ${timetableData[key].code} (${timetableData[key].teacher}) in ${SECTIONS[secIdx]}`;
  } else { warn.style.display='none'; }
}

function updateCourseColor(){
  const idx=document.getElementById('fCourse')?.value;
  const preview=document.getElementById('courseColorPreview');
  if(!preview) return;
  if(idx===''||idx==null){ preview.style.display='none'; return; }
  const c=COURSES[parseInt(idx)];
  preview.style.display='flex';
  const dot=document.getElementById('courseColorDot');
  const lbl=document.getElementById('courseColorLabel');
  if(dot) dot.style.background=c.fg;
  if(lbl) lbl.textContent=c.name;
}

function renderRecentLog(){
  const el=document.getElementById('recentLog'); if(!el) return;
  if(recentAdds.length===0){
    el.innerHTML='<div style="font-size:.75rem;color:var(--text3);font-style:italic">Nothing added yet</div>'; return;
  }
  el.innerHTML=recentAdds.map(a=>`
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:7px;padding:.4rem .6rem">
      <div style="font-size:.76rem;font-weight:600;color:var(--text)">${a.text}</div>
      <div style="font-size:.7rem;color:var(--text3)">${a.detail}</div>
    </div>`).join('');
}

function updateStats(){
  const total=Object.keys(timetableData).length;
  safeSet('statTotal',`📅 ${total} Class${total!==1?'es':''}`);
  safeSet('statSlots',`📊 ${total} / 30 Slots`);
  const clashCount=detectClashes().length;
  safeSet('statClashes',`⚠️ ${clashCount} Clash${clashCount!==1?'es':''}`);
}

function updateSectionLabel(){
  const label=document.getElementById('gridSectionLabel');
  if(label) label.textContent=viewSection==='all'?'All Sections':SECTIONS[viewSection];
}

function changeBatchView(){
  const batchVal = document.getElementById('batchFilter')?.value||'all';
  const sf = document.getElementById('sectionFilter');
  if(!sf) return;
  sf.innerHTML = '<option value="all">All Sections</option>';
  let secs = sectionsData;
  if(batchVal!=='all') secs = sectionsData.filter(s=>s.batch===batchVal);
  secs.forEach(s=>{
    const globalIdx = sectionsData.indexOf(s);
    const opt = document.createElement('option');
    opt.value = globalIdx;
    opt.textContent = `${s.label} (${s.name})`;
    sf.appendChild(opt);
  });
  sf.value = 'all';
  viewSection = 'all';
  updateSectionLabel();
  refreshGrid();
  showToast(`Batch filter: ${batchVal==='all'?'All Batches':batchVal}`,'');
}

function changeSectionView(){
  const val=document.getElementById('sectionFilter')?.value;
  if(val===undefined||val===null) return;
  viewSection = (val==='all')?'all':parseInt(val);
  const fSec=document.getElementById('fSection');
  if(fSec) fSec.value=viewSection==='all'?0:viewSection;
  const vm=document.getElementById('viewMode');
  if(vm) vm.value=viewSection==='all'?'all':'single';
  updateSectionLabel();
  refreshGrid();
  showToast(`Viewing: ${viewSection==='all'?'All Sections':SECTIONS[viewSection]}`,'success');
}

function changeViewMode(){
  const vm=document.getElementById('viewMode'); if(!vm) return;
  if(vm.value==='all'){
    const sf=document.getElementById('sectionFilter');
    if(sf) sf.value='all';
  } else {
    const sf=document.getElementById('sectionFilter');
    if(sf&&sf.value==='all') sf.value='0';
  }
  changeSectionView();
}

/* ─────────────────────────────────────────────────────────────
   §18  PUBLISH
───────────────────────────────────────────────────────────────*/
function openPublishModal(){
  const clashes=detectClashes();
  if(clashes.length>0){ showToast(`⚠️ Fix ${clashes.length} clash${clashes.length>1?'es':''} before publishing`,'error'); return; }
  const total=Object.keys(timetableData).length;
  if(total===0){ showToast('Add some classes first!','warn'); return; }
  safeSet('publishModalSub',`${total} class slot${total!==1?'s':''} will go live for all students and teachers.`);
  document.getElementById('publishModal')?.classList.add('open');
}

function closePublishModal(){ document.getElementById('publishModal')?.classList.remove('open'); }

function confirmPublish(){
  closePublishModal();
  APP.publishedTimetable = JSON.parse(JSON.stringify(timetableData));
  pushNotification('📅 New Timetable Published',`${Object.keys(APP.publishedTimetable).length} classes scheduled.`,'teal');
  showToast('🚀 Timetable published successfully!','success');
  setTimeout(()=>showToast('📲 Notifications sent to all sections','success'),1200);
}

function clearTimetable(){
  if(Object.keys(timetableData).length===0){ showToast('Grid is already empty','warn'); return; }
  if(!confirm('Clear all classes? This cannot be undone.')) return;
  timetableData={}; recentAdds=[];
  renderRecentLog(); refreshGrid();
  showToast('🗑️ Timetable cleared','warn');
}

function saveDraft(){
  const total=Object.keys(timetableData).length;
  showToast(`💾 Draft saved — ${total} slot${total!==1?'s':''}`,'success');
}

/* ─────────────────────────────────────────────────────────────
   §19  REQUEST TAB SWITCHER
───────────────────────────────────────────────────────────────*/
function switchTab(tabEl, panelId){
  document.querySelectorAll('#req .req-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('#req .tab-panel').forEach(p=>p.classList.remove('active'));
  if(tabEl) tabEl.classList.add('active');
  document.getElementById(panelId)?.classList.add('active');
}

/* ─────────────────────────────────────────────────────────────
   §20  EXPORT CSV
───────────────────────────────────────────────────────────────*/
function exportManage(page){
  let headers, data;
  switch(page){
    case 'teachers': headers=['Name','Email','Dept','Status','Courses','Load/wk']; data=teachersData.map(t=>[t.name,t.email,t.dept,t.status,t.courses.join(';'),t.load]); break;
    case 'rooms':    headers=['Name','Type','Capacity','Floor','Facilities','Util%','Status']; data=roomsData.map(r=>[r.name,r.type,r.capacity,r.floor,r.facilities.join(';'),r.util,r.status]); break;
    case 'courses':  headers=['Name','Code','Type','CH','Teacher','Sessions/wk']; data=coursesData.map(c=>[c.name,c.code,c.type,c.ch,c.teacher,c.sessions]); break;
    case 'sections': headers=['Name','Batch','Shift','Label','Students','Capacity','Courses']; data=sectionsData.map(s=>[s.name,s.batch,s.shift,s.label,s.students,s.capacity,s.courses.join(';')]); break;
    default: return;
  }
  const csv=[headers,...data].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`${page}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  showToast(`📄 ${page} CSV exported`,'success');
}

function sortManage(page,key){
  switch(page){
    case 'teachers': teacherSortAsc=(key===teacherSortKey)?!teacherSortAsc:true; teacherSortKey=key; renderTeacherTable(); break;
    case 'rooms':    roomSortAsc=(key===roomSortKey)?!roomSortAsc:true; roomSortKey=key; renderRoomTable(); break;
    case 'courses':  courseSortAsc=(key===courseSortKey)?!courseSortAsc:true; courseSortKey=key; renderCourseTable(); break;
    case 'sections': sectionSortAsc=(key===sectionSortKey)?!sectionSortAsc:true; sectionSortKey=key; renderSectionTable(); break;
  }
}

function comingSoon(name){
  if(name==='Settings'){ openSettingsModal(); return; }
  showToast(`🚧 ${name} — coming soon`,'warn');
}

function openSettingsModal(){
  let modal = document.getElementById('settingsModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id='settingsModal';
    modal.className='modal-overlay';
    modal.innerHTML=`
      <div class="modal-box" style="max-width:480px;text-align:left">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
          <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700;color:var(--text)">⚙️ Settings</div>
          <button onclick="document.getElementById('settingsModal').classList.remove('open')"
            style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text3)">✕</button>
        </div>
        <div style="font-size:.82rem;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;font-weight:600;margin-bottom:.75rem">Preferences</div>
        <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem">
          <label style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;color:var(--text2)">
            Dark Mode <input type="checkbox" id="settingDark" onchange="toggleDarkMode(this.checked)" style="width:16px;height:16px;cursor:pointer">
          </label>
          <label style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;color:var(--text2)">
            Email Notifications <input type="checkbox" checked style="width:16px;height:16px;cursor:pointer">
          </label>
          <label style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;color:var(--text2)">
            Auto-detect Clashes <input type="checkbox" checked style="width:16px;height:16px;cursor:pointer">
          </label>
        </div>
        <div style="font-size:.82rem;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;font-weight:600;margin-bottom:.75rem">Account</div>
        <div style="font-size:.85rem;color:var(--text2);background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:.85rem 1rem;margin-bottom:1.5rem">
          <div><strong>Name:</strong> ${APP.currentUser?.name||'Guest'}</div>
          <div style="margin-top:.3rem"><strong>Email:</strong> ${APP.currentUser?.email||'—'}</div>
          <div style="margin-top:.3rem"><strong>Role:</strong> ${APP.currentUser?.role||'—'}</div>
        </div>
        <button onclick="document.getElementById('settingsModal').classList.remove('open')" class="modal-confirm" style="width:100%">Save & Close</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('open'); });
  }
  modal.classList.add('open');
}

function toggleDarkMode(on){
  document.body.style.filter = on?'invert(1) hue-rotate(180deg)':'';
  showToast(on?'🌙 Dark mode on':'☀️ Dark mode off','');
}

/* ─────────────────────────────────────────────────────────────
   §21  TEACHERS CRUD
───────────────────────────────────────────────────────────────*/
const COURSE_CHIP_COLOR={ IP:'chip-gold',OS:'chip-teal',DS:'chip-amber',MAD:'chip-coral',DM:'chip-blue',IPL:'chip-blue',OTH:'chip-teal' };
const DEPT_ICONS={ CS:'🖥️',SE:'⚙️',IT:'💾' };

function renderTeacherTable(){
  const q     =(document.getElementById('teacherSearch')?.value||'').toLowerCase();
  const status= document.getElementById('teacherStatusFilter')?.value||'all';
  const dept  = document.getElementById('teacherDeptFilter')?.value||'all';
  let rows=teachersData.filter(t=>{
    return (t.name.toLowerCase().includes(q)||t.email.toLowerCase().includes(q)||t.dept.toLowerCase().includes(q))
      &&(status==='all'||t.status===status)&&(dept==='all'||t.dept===dept);
  });
  rows=_sortArray(rows,teacherSortKey,teacherSortAsc);
  const tbody=document.getElementById('teacherTbody'); if(!tbody) return;
  tbody.innerHTML=rows.length===0?_emptyRow('👨‍🏫','No teachers found.',7):rows.map(t=>{
    const ri=teachersData.indexOf(t);
    const chips=t.courses.map(c=>`<span class="chip ${COURSE_CHIP_COLOR[c]||'chip-teal'}">${c}</span>`).join('');
    const lp=Math.min(100,Math.round((t.load/10)*100));
    const lc=lp>80?'var(--coral)':lp>60?'var(--amber)':'var(--teal)';
    const sb=t.status==='Active'?'sb-active':t.status==='On Leave'?'sb-amber':'sb-inactive';
    return `<tr>
      <td><div class="row-avatar" style="background:var(--gold-dim)">${DEPT_ICONS[t.dept]||'👤'}</div></td>
      <td><div class="row-name">${t.name}</div><div class="row-sub">${t.dept}</div></td>
      <td><div style="font-size:.82rem;color:var(--text2)">${t.email}</div></td>
      <td><div class="chip-wrap">${chips}</div></td>
      <td><div class="util-bar-wrap"><div class="util-bar"><div class="util-fill" style="width:${lp}%;background:${lc}"></div></div><div class="util-pct" style="color:${lc}">${t.load}/wk</div></div></td>
      <td><span class="status-badge ${sb}">${t.status}</span></td>
      <td><div class="row-actions">
        <button class="row-btn rb-edit"   onclick="editTeacher(${ri})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteTeacher(${ri})">🗑</button>
        <button class="row-btn rb-view"   onclick="viewTeacherTT(${ri})">📅</button>
      </div></td>
    </tr>`;
  }).join('');
  const total=teachersData.length,active=teachersData.filter(t=>t.status==='Active').length,leave=teachersData.filter(t=>t.status==='On Leave').length;
  const avg=total?Math.round(teachersData.reduce((s,t)=>s+t.load,0)/total*4):0;
  safeSet('tkpiTotal',total); safeSet('tkpiActive',active); safeSet('tkpiLoad',avg); safeSet('tkpiLeave',leave);
  safeSet('teacherCount',`${rows.length} Teacher${rows.length!==1?'s':''}`);
  safeSet('teacherPgInfo',`Showing 1–${rows.length} of ${rows.length}`);
}

function openTeacherForm(){
  _setVal('teacherEditIdx',-1); safeSet('teacherFormTitle','➕ Add Teacher');
  _clearField('tfName'); _clearField('tfEmail');
  _setVal('tfDept','CS'); _setVal('tfStatus','Active'); _setVal('tfLoad',8);
  populateTeacherCourseDropdown();
  const tags=document.getElementById('tfCourseTags'); if(tags) tags.innerHTML='';
  document.getElementById('teacherFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editTeacher(idx){
  const t=teachersData[idx]; if(!t) return;
  _setVal('teacherEditIdx',idx); safeSet('teacherFormTitle','✏️ Edit Teacher');
  _setVal('tfName',t.name); _setVal('tfEmail',t.email);
  _setVal('tfDept',t.dept); _setVal('tfStatus',t.status); _setVal('tfLoad',t.load);
  populateTeacherCourseDropdown();
  loadTeacherCourseTags(t.courses);
  document.getElementById('teacherFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveTeacher(){
  const name =document.getElementById('tfName')?.value.trim();
  const email=document.getElementById('tfEmail')?.value.trim();
  if(!name||!email){ showToast('Name and email are required','error'); return; }
  const dept   =document.getElementById('tfDept')?.value||'CS';
  const status =document.getElementById('tfStatus')?.value||'Active';
  const load   =parseInt(document.getElementById('tfLoad')?.value)||8;
  const courses=getTeacherSelectedCourses();
  const idx    =parseInt(document.getElementById('teacherEditIdx')?.value??-1);
  if(idx===-1){ teachersData.push({name,email,dept,status,courses,load}); showToast(`✓ ${name} added`,'success'); }
  else         { teachersData[idx]={name,email,dept,status,courses,load}; showToast(`✓ ${name} updated`,'success'); }
  cancelTeacherForm(); renderTeacherTable();
}

function cancelTeacherForm(){ _setVal('teacherEditIdx',-1); safeSet('teacherFormTitle','➕ Add Teacher'); }

function deleteTeacher(idx){
  const t=teachersData[idx]; if(!t||!confirm(`Delete ${t.name}?`)) return;
  teachersData.splice(idx,1); showToast(`🗑 ${t.name} removed`,'warn'); renderTeacherTable();
}

function viewTeacherTT(idx){ showToast(`📅 Loading timetable for ${teachersData[idx].name}…`,''); setTimeout(()=>goPage('tt'),800); }

function populateTeacherCourseDropdown(){
  const sel=document.getElementById('tfCourseSelect'); if(!sel) return;
  sel.innerHTML='<option value="">＋ Add a course…</option>';
  coursesData.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.code; o.textContent=`${c.code} — ${c.name}`;
    sel.appendChild(o);
  });
}

function teacherAddCourse(sel){
  const val=sel.value; if(!val) return;
  const tags=document.getElementById('tfCourseTags'); if(!tags){ sel.value=''; return; }
  if(tags.querySelector(`[data-code="${val}"]`)){ sel.value=''; showToast(`${val} already added`,'warn'); return; }
  const chip=document.createElement('span');
  chip.dataset.code=val;
  chip.style.cssText='display:inline-flex;align-items:center;gap:.3rem;background:var(--gold-dim);border:1px solid rgba(29,78,216,.2);border-radius:99px;padding:.2rem .6rem;font-size:.78rem;color:var(--gold-lt);font-weight:600';
  chip.innerHTML=`${val} <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text2);font-size:.9rem">✕</button>`;
  tags.appendChild(chip); sel.value='';
}

function getTeacherSelectedCourses(){ return [...document.querySelectorAll('#tfCourseTags [data-code]')].map(el=>el.dataset.code); }

function loadTeacherCourseTags(codes=[]){
  const t=document.getElementById('tfCourseTags'); if(!t) return;
  t.innerHTML='';
  codes.forEach(code=>{
    const chip=document.createElement('span');
    chip.dataset.code=code;
    chip.style.cssText='display:inline-flex;align-items:center;gap:.3rem;background:var(--gold-dim);border:1px solid rgba(29,78,216,.2);border-radius:99px;padding:.2rem .6rem;font-size:.78rem;color:var(--gold-lt);font-weight:600';
    chip.innerHTML=`${code} <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text2);font-size:.9rem">✕</button>`;
    t.appendChild(chip);
  });
}

/* ─────────────────────────────────────────────────────────────
   §22  ROOMS CRUD
───────────────────────────────────────────────────────────────*/
const ROOM_ICONS={ Lab:'🧪',Lecture:'📋',Auditorium:'🎭' };

function renderRoomTable(){
  const q     =(document.getElementById('roomSearch')?.value||'').toLowerCase();
  const type  = document.getElementById('roomTypeFilter')?.value||'all';
  const status= document.getElementById('roomStatusFilter')?.value||'all';
  let rows=roomsData.filter(r=>(r.name.toLowerCase().includes(q)||r.type.toLowerCase().includes(q))&&(type==='all'||r.type===type)&&(status==='all'||r.status===status));
  rows=_sortArray(rows,roomSortKey,roomSortAsc);
  const tbody=document.getElementById('roomTbody'); if(!tbody) return;
  tbody.innerHTML=rows.length===0?_emptyRow('🏫','No rooms match.',9):rows.map(r=>{
    const ri=roomsData.indexOf(r);
    const uc=r.util>85?'var(--coral)':r.util>65?'var(--amber)':'var(--teal)';
    const sb=r.status==='Available'?'sb-avail':'sb-inactive';
    const fc=r.facilities.map(f=>`<span class="chip chip-teal" style="font-size:.65rem">${f}</span>`).join('');
    const fl=r.floor==='G'?'Ground':`${r.floor}${r.floor==='1'?'st':r.floor==='2'?'nd':'rd'}`;
    return `<tr>
      <td><div class="row-avatar" style="background:var(--teal-dim)">${ROOM_ICONS[r.type]||'🏫'}</div></td>
      <td><div class="row-name">${r.name}</div><div class="row-sub">Floor ${r.floor}</div></td>
      <td><span class="pill pill-blue" style="font-size:.68rem">${r.type}</span></td>
      <td style="font-weight:600;color:var(--text)">${r.capacity} <span style="font-size:.72rem;color:var(--text3)">seats</span></td>
      <td style="color:var(--text2)">${fl}</td>
      <td><div class="chip-wrap">${fc||'—'}</div></td>
      <td><div class="util-bar-wrap"><div class="util-bar"><div class="util-fill" style="width:${r.util}%;background:${uc}"></div></div><div class="util-pct" style="color:${uc}">${r.util}%</div></div></td>
      <td><span class="status-badge ${sb}">${r.status==='Available'?'Available':'Maintenance'}</span></td>
      <td><div class="row-actions">
        <button class="row-btn rb-edit"   onclick="editRoom(${ri})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteRoom(${ri})">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
  const total=roomsData.length, avail=roomsData.filter(r=>r.status==='Available').length;
  const cap=roomsData.reduce((s,r)=>s+r.capacity,0), avg=total?Math.round(roomsData.reduce((s,r)=>s+r.util,0)/total):0;
  safeSet('rkpiTotal',total); safeSet('rkpiAvail',avail); safeSet('rkpiCap',cap); safeSet('rkpiUtil',avg+'%');
  safeSet('roomCount',`${rows.length} Room${rows.length!==1?'s':''}`);
  safeSet('roomPgInfo',`Showing 1–${rows.length} of ${rows.length}`);
}

function openRoomForm(){
  _setVal('roomEditIdx',-1); safeSet('roomFormTitle','➕ Add Room');
  _clearField('rfName'); _setVal('rfType','Lecture'); _setVal('rfFloor','1');
  _clearField('rfCapacity'); _setVal('rfStatus','Available');
  document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]').forEach(cb=>cb.checked=false);
  document.getElementById('roomFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editRoom(idx){
  const r=roomsData[idx]; if(!r) return;
  _setVal('roomEditIdx',idx); safeSet('roomFormTitle','✏️ Edit Room');
  _setVal('rfName',r.name); _setVal('rfType',r.type); _setVal('rfFloor',r.floor);
  _setVal('rfCapacity',r.capacity); _setVal('rfStatus',r.status);
  document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]').forEach(cb=>cb.checked=r.facilities.includes(cb.value));
  document.getElementById('roomFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveRoom(){
  const name=document.getElementById('rfName')?.value.trim();
  const cap =parseInt(document.getElementById('rfCapacity')?.value);
  if(!name){ showToast('Room name required','error'); return; }
  if(!cap||cap<1){ showToast('Enter a valid capacity','error'); return; }
  const type=document.getElementById('rfType')?.value||'Lecture';
  const floor=document.getElementById('rfFloor')?.value||'1';
  const status=document.getElementById('rfStatus')?.value||'Available';
  const facilities=[...document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]:checked')].map(cb=>cb.value);
  const idx=parseInt(document.getElementById('roomEditIdx')?.value??-1);
  if(idx===-1){ roomsData.push({name,type,capacity:cap,floor,facilities,util:0,status}); showToast(`✓ ${name} added`,'success'); }
  else         { roomsData[idx]={...roomsData[idx],name,type,capacity:cap,floor,facilities,status}; showToast(`✓ ${name} updated`,'success'); }
  cancelRoomForm(); renderRoomTable();
}

function cancelRoomForm(){ _setVal('roomEditIdx',-1); safeSet('roomFormTitle','➕ Add Room'); }

function deleteRoom(idx){
  const r=roomsData[idx]; if(!r||!confirm(`Delete ${r.name}?`)) return;
  roomsData.splice(idx,1); showToast(`🗑 ${r.name} removed`,'warn'); renderRoomTable();
}

/* ─────────────────────────────────────────────────────────────
   §23  COURSES CRUD
───────────────────────────────────────────────────────────────*/
const COLOR_STYLE={
  gold:{bg:'var(--gold-dim)',fg:'var(--gold-lt)'},teal:{bg:'var(--teal-dim)',fg:'var(--teal)'},
  amber:{bg:'var(--amber-dim)',fg:'var(--amber)'},coral:{bg:'var(--coral-dim)',fg:'var(--coral)'},
  blue:{bg:'var(--blue-dim)',fg:'var(--blue)'},purple:{bg:'rgba(139,92,246,.12)',fg:'#8B5CF6'},
};

function renderCourseTable(){
  const q    =(document.getElementById('courseSearch')?.value||'').toLowerCase();
  const type = document.getElementById('courseTypeFilter')?.value||'all';
  const ch   = document.getElementById('courseCHFilter')?.value||'all';
  let rows=coursesData.filter(c=>(c.name.toLowerCase().includes(q)||c.code.toLowerCase().includes(q))&&(type==='all'||c.type===type)&&(ch==='all'||String(c.ch)===ch));
  rows=_sortArray(rows,courseSortKey,courseSortAsc);
  const tbody=document.getElementById('courseTbody'); if(!tbody) return;
  tbody.innerHTML=rows.length===0?_emptyRow('📚','No courses match.',8):rows.map(c=>{
    const ri=coursesData.indexOf(c), cs=COLOR_STYLE[c.color]||COLOR_STYLE.teal;
    const tb=c.type==='Core'?'sb-core':c.type==='Elective'?'sb-elective':'sb-lab';
    return `<tr>
      <td><div style="width:12px;height:34px;border-radius:4px;background:${cs.fg}"></div></td>
      <td><div class="row-name">${c.name}</div></td>
      <td><span style="font-family:'Space Mono',monospace;font-size:.8rem;font-weight:700;color:${cs.fg};background:${cs.bg};padding:2px 7px;border-radius:5px">${c.code}</span></td>
      <td><span class="status-badge ${tb}">${c.type}</span></td>
      <td style="font-weight:600;color:var(--text)">${c.ch} <span style="font-size:.7rem;color:var(--text3)">CH</span></td>
      <td style="color:var(--text2);font-size:.82rem">${c.teacher||'—'}</td>
      <td style="font-weight:600;color:var(--text)">${c.sessions}×/wk</td>
      <td><div class="row-actions">
        <button class="row-btn rb-edit"   onclick="editCourse(${ri})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteCourse(${ri})">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
  const total=coursesData.length, core=coursesData.filter(c=>c.type==='Core').length;
  const elective=coursesData.filter(c=>c.type==='Elective').length, lab=coursesData.filter(c=>c.type==='Lab').length;
  safeSet('ckpiTotal',total); safeSet('ckpiCore',core); safeSet('ckpiElective',elective); safeSet('ckpiLab',lab);
  safeSet('courseCount',`${rows.length} Course${rows.length!==1?'s':''}`);
  safeSet('coursePgInfo',`Showing 1–${rows.length} of ${rows.length}`);
}

function openCourseForm(){
  _setVal('courseEditIdx',-1); safeSet('courseFormTitle','➕ Add Course');
  _clearField('cfName'); _clearField('cfCode');
  _setVal('cfType','Core'); _setVal('cfCH','3'); _setVal('cfColor','gold'); _setVal('cfSessions',3);
  document.getElementById('courseFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editCourse(idx){
  const c=coursesData[idx]; if(!c) return;
  _setVal('courseEditIdx',idx); safeSet('courseFormTitle','✏️ Edit Course');
  _setVal('cfName',c.name); _setVal('cfCode',c.code);
  _setVal('cfType',c.type); _setVal('cfCH',c.ch); _setVal('cfColor',c.color); _setVal('cfSessions',c.sessions);
  document.getElementById('courseFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveCourse(){
  const name=document.getElementById('cfName')?.value.trim();
  const code=document.getElementById('cfCode')?.value.trim();
  if(!name||!code){ showToast('Name and code are required','error'); return; }
  const type=document.getElementById('cfType')?.value||'Core';
  const ch  =parseInt(document.getElementById('cfCH')?.value)||3;
  const color=document.getElementById('cfColor')?.value||'gold';
  const sessions=parseInt(document.getElementById('cfSessions')?.value)||3;
  const idx=parseInt(document.getElementById('courseEditIdx')?.value??-1);
  if(idx===-1){ coursesData.push({name,code,type,ch,teacher:'',sessions,color}); showToast(`✓ ${name} added`,'success'); }
  else         { coursesData[idx]={...coursesData[idx],name,code,type,ch,sessions,color}; showToast(`✓ ${name} updated`,'success'); }
  populateTeacherCourseDropdown();
  cancelCourseForm(); renderCourseTable();
}

function cancelCourseForm(){ _setVal('courseEditIdx',-1); safeSet('courseFormTitle','➕ Add Course'); }

function deleteCourse(idx){
  const c=coursesData[idx]; if(!c||!confirm(`Delete ${c.name}?`)) return;
  coursesData.splice(idx,1); populateTeacherCourseDropdown(); showToast(`🗑 ${c.name} removed`,'warn'); renderCourseTable();
}

/* ─────────────────────────────────────────────────────────────
   §24  SECTIONS CRUD
───────────────────────────────────────────────────────────────*/
function renderSectionTable(){
  const q    =(document.getElementById('sectionSearch')?.value||'').toLowerCase();
  const batch= document.getElementById('sectionBatchFilter')?.value||'all';
  const shift= document.getElementById('sectionShiftFilter')?.value||'all';
  let rows=sectionsData.filter(s=>{
    const batchMatch = batch==='all'||s.batch===batch||s.batch.startsWith(batch);
    const shiftMatch = shift==='all'||s.shift===shift;
    const qMatch = s.name.toLowerCase().includes(q)||s.batch.toLowerCase().includes(q);
    return batchMatch&&shiftMatch&&qMatch;
  });
  rows=_sortArray(rows,sectionSortKey,sectionSortAsc);
  const tbody=document.getElementById('sectionTbody'); if(!tbody) return;
  tbody.innerHTML=rows.length===0?_emptyRow('👥','No sections match.',9):rows.map(s=>{
    const ri=sectionsData.indexOf(s), fp=Math.round((s.students/s.capacity)*100);
    const fc=fp>=90?'var(--coral)':fp>=70?'var(--amber)':'var(--teal)';
    const shiftPill=s.shift==='Afternoon'?'pill-amber':'pill-teal';
    const chips=(s.courses||[]).map(c=>`<span class="chip ${COURSE_CHIP_COLOR[c]||'chip-teal'}">${c}</span>`).join('');
    return `<tr>
      <td><div class="row-avatar" style="background:var(--amber-dim)">🎓</div></td>
      <td><div class="row-name">${s.name}</div><div class="row-sub">Label: ${s.label}</div></td>
      <td><span class="pill pill-gold" style="font-size:.68rem">${s.batch}</span></td>
      <td><span class="pill ${shiftPill}" style="font-size:.68rem">${s.shift}</span></td>
      <td style="font-weight:600;color:var(--text)">${s.students}</td>
      <td style="color:var(--text2)">${s.capacity}</td>
      <td><div class="util-bar-wrap"><div class="util-bar"><div class="util-fill" style="width:${fp}%;background:${fc}"></div></div><div class="util-pct" style="color:${fc}">${fp}%</div></div></td>
      <td><div class="chip-wrap">${chips||'—'}</div></td>
      <td><div class="row-actions">
        <button class="row-btn rb-edit"   onclick="editSection(${ri})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteSection(${ri})">🗑</button>
        <button class="row-btn rb-view"   onclick="viewSectionTT(${ri})">📅</button>
      </div></td>
    </tr>`;
  }).join('');
  const total=sectionsData.length, students=sectionsData.reduce((s,r)=>s+r.students,0);
  const avg=total?Math.round(students/total):0, nf=sectionsData.filter(s=>s.students/s.capacity>=0.9).length;
  safeSet('skpiTotal',total); safeSet('skpiStudents',students); safeSet('skpiAvg',avg); safeSet('skpiFull',nf);
  safeSet('sectionCount',`${rows.length} Section${rows.length!==1?'s':''}`);
  safeSet('sectionPgInfo',`Showing 1–${rows.length} of ${rows.length}`);
}

function openSectionForm(){
  _setVal('sectionEditIdx',-1); safeSet('sectionFormTitle','➕ Add Section');
  _clearField('sfName'); _setVal('sfBatch','F23'); _setVal('sfShift','Afternoon');
  _setVal('sfLabel','A'); _setVal('sfCapacity',50); _setVal('sfStudents',0);
  document.getElementById('sectionFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editSection(idx){
  const s=sectionsData[idx]; if(!s) return;
  _setVal('sectionEditIdx',idx); safeSet('sectionFormTitle','✏️ Edit Section');
  _setVal('sfName',s.name); _setVal('sfBatch',s.batch); _setVal('sfShift',s.shift);
  _setVal('sfLabel',s.label); _setVal('sfCapacity',s.capacity); _setVal('sfStudents',s.students);
  document.getElementById('sectionFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveSection(){
  const name=document.getElementById('sfName')?.value.trim();
  if(!name){ showToast('Section name required','error'); return; }
  const batch   =document.getElementById('sfBatch')?.value||'F23';
  const shift   =document.getElementById('sfShift')?.value||'Afternoon';
  const label   =document.getElementById('sfLabel')?.value||'A';
  const capacity=parseInt(document.getElementById('sfCapacity')?.value)||50;
  const students=parseInt(document.getElementById('sfStudents')?.value)||0;
  const idx=parseInt(document.getElementById('sectionEditIdx')?.value??-1);
  if(idx===-1){
    sectionsData.push({name,batch,shift,label,students,capacity,courses:[]});
    if(!SECTIONS.includes(name)) SECTIONS.push(name);
    showToast(`✓ ${name} added`,'success');
  } else {
    const old=sectionsData[idx].name;
    sectionsData[idx]={...sectionsData[idx],name,batch,shift,label,students,capacity};
    const si=SECTIONS.indexOf(old);
    if(si>=0) SECTIONS[si]=name;
    else if(!SECTIONS.includes(name)) SECTIONS.push(name);
    showToast(`✓ ${name} updated`,'success');
  }
  cancelSectionForm(); renderSectionTable();
}

function cancelSectionForm(){ _setVal('sectionEditIdx',-1); safeSet('sectionFormTitle','➕ Add Section'); }

function deleteSection(idx){
  const s=sectionsData[idx]; if(!s||!confirm(`Delete ${s.name}?`)) return;
  const si=SECTIONS.indexOf(s.name);
  if(si>=0){ Object.keys(timetableData).forEach(k=>{ if(k.endsWith(`-${si}`)) delete timetableData[k]; }); SECTIONS.splice(si,1); }
  sectionsData.splice(idx,1); showToast(`🗑 ${s.name} removed`,'warn'); renderSectionTable();
}

function viewSectionTT(idx){
  showToast(`📅 Loading timetable for ${sectionsData[idx].name}…`,'');
  viewSection = idx;
  setTimeout(()=>{ goPage('makett'); }, 800);
}

/* ─────────────────────────────────────────────────────────────
   §25  LOGOUT
───────────────────────────────────────────────────────────────*/
function logoutUser(){
  APP.currentRole='guest'; APP.currentUser=null;
  APP.notifications=[]; APP.pendingRequests=[];
  notifActiveFilter='all';
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\(['"]([^'"]+)['"]/);
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

/* ─────────────────────────────────────────────────────────────
   §26  DOM READY
───────────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded',()=>{

  /* Login */
  const loginBtn = document.querySelector('.login-btn');
  if(loginBtn) loginBtn.addEventListener('click', handleLogin);

  /* Role card selection */
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', function(){
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');

    const role  = this.querySelector('.role-name')?.textContent || 'User';
    const email = this.dataset.email || '';
    const pass  = this.dataset.pass  || '';

    // Auto-fill credentials
    const emailEl = document.querySelector('.login-right .form-input[type="email"]');
    const passEl  = document.querySelector('.login-right .form-input[type="password"]');
    if(emailEl) emailEl.value = email;
    if(passEl)  passEl.value  = pass;

    const btn = document.querySelector('.login-btn');
    if(btn) btn.textContent = `Sign In as ${role} →`;
  });
});

  /* Notification filter buttons */
  const filterMap=['all','coral','teal','gold','amber'];
  document.querySelectorAll('#notif .nf-btn').forEach((btn,i)=>{
    const filter=filterMap[i]||'all';
    btn.dataset.filter=filter;
    btn.addEventListener('click',()=>setNotifFilter(filter));
  });

  /* Mark all read */
  document.querySelector('#notif .btn-ghost')?.addEventListener('click', markAllRead);

  /* Clash suggestion buttons */
  document.querySelectorAll('.sug-btn').forEach(btn=>{
    btn.addEventListener('click',function(){
      const card=this.closest('.sug-card');
      const day =card?.querySelector('.sug-day')?.textContent||'—';
      const time=card?.querySelector('.sug-time')?.textContent||'—';
      showToast(`✓ Slot applied: ${day} · ${time}`,'success');
      pushNotification('Clash Slot Applied',`Alternative slot ${day} · ${time} has been applied.`,'teal');
    });
  });

  /* Request submit buttons */
  document.querySelector('#tab-makeup .submit-btn')?.addEventListener('click',()=>submitRequest('makeup'));
  document.querySelector('#tab-merge  .submit-btn')?.addEventListener('click',()=>submitRequest('merge'));
  document.querySelector('#tab-cancel .submit-btn')?.addEventListener('click',()=>submitRequest('cancel'));

  /* Publish modal overlay close */
  document.getElementById('publishModal')?.addEventListener('click',function(e){ if(e.target===this) closePublishModal(); });

  /* TT page filters */
  document.getElementById('ttBatchFilter')?.addEventListener('change', onTTBatchChange);
  document.getElementById('ttSectionFilter')?.addEventListener('change', onTTSectionChange);

  /* Wire Export PDF buttons */
  document.querySelectorAll('.btn-ghost').forEach(btn=>{
    if(btn.textContent.includes('Export PDF')) btn.addEventListener('click',()=>exportPDF());
  });

  /* Wire Export CSV buttons */
  document.querySelectorAll('.btn-ghost').forEach(btn=>{
    if(btn.textContent.includes('Export CSV')){
      const page=btn.closest('.page')?.id||'';
      const pageMap={teachers:'teachers',rooms:'rooms',courses:'courses',sections:'sections'};
      btn.addEventListener('click',()=>exportManage(pageMap[page]||page));
    }
  });

  /* Inject Back buttons */
  _injectBackButtons();

  /* Hide all nav except login initially */
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    const match  = (btn.getAttribute('onclick')||'').match(/show\(['"]([^'"]+)['"]/);
    const pageId = match?match[1]:'';
    if(pageId!=='login') btn.style.display='none';
  });

  /* Auto-init if a manage page is already active */
  if(document.getElementById('makett')?.classList.contains('active'))   buildGrid();
  if(document.getElementById('teachers')?.classList.contains('active')){ renderTeacherTable(); populateTeacherCourseDropdown(); }
  if(document.getElementById('rooms')?.classList.contains('active'))    renderRoomTable();
  if(document.getElementById('courses')?.classList.contains('active'))  renderCourseTable();
  if(document.getElementById('sections')?.classList.contains('active')) renderSectionTable();
});

function _injectBackButtons(){
  const pagesWithBack=['tt','clash','req','notif','analytics','makett','teachers','rooms','courses','sections'];
  pagesWithBack.forEach(pid=>{
    const page=document.getElementById(pid); if(!page) return;
    const header=page.querySelector('.main-header');
    if(!header||header.querySelector('.back-btn')) return;
    const btn=document.createElement('button');
    btn.className='btn btn-ghost back-btn';
    btn.style.marginRight='.5rem';
    btn.innerHTML='← Back';
    btn.addEventListener('click', goBack);
    header.insertBefore(btn, header.firstChild);
  });
}

/* ═══════════════════════════════════════════════════════════════
   §27  EXPOSE ALL FUNCTIONS ON window
   ─────────────────────────────────────────────────────────────
   CRITICAL FIX: inline onclick="fn()" in dynamically injected HTML
   can only call functions that are properties of window.
   Without this block, approve/reject/edit/delete buttons are all
   completely silent — the browser throws "fn is not defined".
═══════════════════════════════════════════════════════════════ */
window.show               = show;
window.goPage             = goPage;
window.goBack             = goBack;
window.sidebarNav         = sidebarNav;
window.handleLogin        = handleLogin;
window.logoutUser         = logoutUser;

/* Core approval actions — THE main fix */
window.approveRequest     = approveRequest;
window.rejectRequest      = rejectRequest;

/* Clash */
window.resolveClash       = resolveClash;

/* Builder */
window.removeCell         = removeCell;
window.selectCell         = selectCell;
window.addClassToGrid     = addClassToGrid;
window.updateCourseColor  = updateCourseColor;
window.checkConflict      = checkConflict;
window.changeBatchView    = changeBatchView;
window.changeSectionView  = changeSectionView;
window.changeViewMode     = changeViewMode;
window.openPublishModal   = openPublishModal;
window.closePublishModal  = closePublishModal;
window.confirmPublish     = confirmPublish;
window.clearTimetable     = clearTimetable;
window.saveDraft          = saveDraft;

/* Notifications */
window.markRead           = markRead;
window.markAllRead        = markAllRead;
window.setNotifFilter     = setNotifFilter;

/* Requests */
window.switchTab          = switchTab;
window.submitRequest      = submitRequest;

/* TT view */
window.switchTTView       = switchTTView;
window.onTTBatchChange    = onTTBatchChange;
window.onTTSectionChange  = onTTSectionChange;

/* Export / sort */
window.exportPDF          = exportPDF;
window.exportManage       = exportManage;
window.sortManage         = sortManage;
window.comingSoon         = comingSoon;
window.openSettingsModal  = openSettingsModal;
window.toggleDarkMode     = toggleDarkMode;

/* Teachers */
window.openTeacherForm    = openTeacherForm;
window.editTeacher        = editTeacher;
window.saveTeacher        = saveTeacher;
window.cancelTeacherForm  = cancelTeacherForm;
window.deleteTeacher      = deleteTeacher;
window.viewTeacherTT      = viewTeacherTT;
window.teacherAddCourse   = teacherAddCourse;
window.renderTeacherTable = renderTeacherTable;

/* Rooms */
window.openRoomForm       = openRoomForm;
window.editRoom           = editRoom;
window.saveRoom           = saveRoom;
window.cancelRoomForm     = cancelRoomForm;
window.deleteRoom         = deleteRoom;
window.renderRoomTable    = renderRoomTable;

/* Courses */
window.openCourseForm     = openCourseForm;
window.editCourse         = editCourse;
window.saveCourse         = saveCourse;
window.cancelCourseForm   = cancelCourseForm;
window.deleteCourse       = deleteCourse;
window.renderCourseTable  = renderCourseTable;

/* Sections */
window.openSectionForm    = openSectionForm;
window.editSection        = editSection;
window.saveSection        = saveSection;
window.cancelSectionForm  = cancelSectionForm;
window.deleteSection      = deleteSection;
window.viewSectionTT      = viewSectionTT;
window.renderSectionTable = renderSectionTable;

/* ── Demo credentials ── */
console.log('%cIBIT TAS v4.1 — Fixed','color:#2563EB;font-weight:bold;font-size:14px');
console.log('Admin:   admin@ibit.edu.pk   / 12345678');
console.log('Teacher: teacher@ibit.edu.pk / 12345678');
console.log('Student: student@ibit.edu.pk / 12345678');

const PREVIEW_COLOR = {
  IP:  { bg:'rgba(29,78,216,.09)',  border:'var(--gold-lt)', fg:'var(--gold-lt)' },
  OS:  { bg:'rgba(8,145,178,.09)',  border:'var(--teal)',    fg:'var(--teal)'    },
  DS:  { bg:'rgba(217,119,6,.09)', border:'var(--amber)',   fg:'var(--amber)'   },
  MAD: { bg:'rgba(220,38,38,.09)', border:'var(--coral)',   fg:'var(--coral)'   },
  DM:  { bg:'rgba(3,105,161,.09)', border:'var(--blue)',    fg:'var(--blue)'    },
  IPL: { bg:'rgba(29,78,216,.09)',  border:'var(--gold-lt)', fg:'var(--gold-lt)' },
};
function _previewColor(code){
  return PREVIEW_COLOR[code] || { bg:'rgba(139,92,246,.09)', border:'#8B5CF6', fg:'#8B5CF6' };
}
 
/* Static fallback data (original hardcoded preview) */
const STATIC_PREVIEW = {
  /* key: "dayIdx-slotIdx" → { code, room } */
  '0-0':{ code:'IP',  room:'R-204' }, '1-0':{ code:'OS',  room:'R-101' },
  '2-0':{ code:'DS',  room:'R-305' }, '3-0':{ code:'MAD', room:'R-204' },
  '0-1':{ code:'OS',  room:'R-101' }, '2-1':{ code:'IP',  room:'R-202' },
  '3-1':{ code:'DM',  room:'R-106' }, '4-1':{ code:'DS',  room:'R-305' },
  '0-2':{ code:'MAD', room:'R-204' }, '1-2':{ code:'IP',  room:'R-204' },
  '2-2':{ code:'DM',  room:'R-106' }, '4-2':{ code:'OS',  room:'R-101' },
};
 
/* Preview slot labels */
const PREVIEW_SLOTS = [
  { label:'8–9',   idx:0 },
  { label:'9–10',  idx:1 },
  { label:'10–11', idx:2 },
  { label:'11–12', idx:3 },
];
const PREVIEW_DAYS   = ['Mon','Tue','Wed','Thu','Fri'];
 
window.renderDashTTPreview = function(){
  const table = document.getElementById('dashTTPreviewTable');
  if(!table) return;
 
  /* Decide data source */
  const hasDraft     = Object.keys(timetableData || {}).length > 0;
  const hasPublished = Object.keys(APP.publishedTimetable || {}).length > 0;
  const useStatic    = !hasDraft && !hasPublished;
  const source       = hasDraft ? timetableData : (hasPublished ? APP.publishedTimetable : null);
 
  /* Update status label */
  const statusEl = document.getElementById('dashPreviewStatus');
  const pill     = document.getElementById('ttPreviewPill');
  if(statusEl){
    if(useStatic){
      statusEl.textContent = 'No timetable built yet — showing example preview';
      statusEl.style.color = 'var(--text3)';
    } else if(hasDraft && !hasPublished){
      statusEl.textContent = '✏️ Showing draft (unpublished)';
      statusEl.style.color = 'var(--amber)';
      if(pill){ pill.textContent='Draft'; pill.className='pill pill-amber'; }
    } else {
      statusEl.textContent = '✅ Live published timetable';
      statusEl.style.color = 'var(--teal)';
      if(pill){ pill.textContent='Live'; pill.className='pill pill-teal'; }
    }
  }
 
  /* Determine which sections to show */
  const secSel = document.getElementById('dashPreviewSection');
  const secVal = secSel?.value || 'all';
  const secIdxs = secVal === 'all'
    ? [0,1,2,3]
    : [parseInt(secVal)];
 
  /* Today's day index (0=Mon…4=Fri) for highlight */
  const todayDow = new Date().getDay(); // 0=Sun,1=Mon...
  const todayIdx = (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;
 
  /* ── Build header ── */
  let html = `<tr><th>Time</th>`;
  PREVIEW_DAYS.forEach((d,i)=>{
    const isToday = i === todayIdx;
    html += `<th${isToday?' class="today"':''}>${d}${isToday?'<br><small style="font-size:.62rem;font-weight:400">Today</small>':''}</th>`;
  });
  html += `</tr>`;
 
  /* ── Build rows ── */
  PREVIEW_SLOTS.forEach(({ label, idx: slotIdx }) => {
    html += `<tr><td class="tt-time">${label}</td>`;
 
    for(let d=0; d<5; d++){
      let cellHTML = '';
 
      if(useStatic){
        /* Static fallback */
        const entry = STATIC_PREVIEW[`${d}-${slotIdx}`];
        if(entry){
          const c = _previewColor(entry.code);
          cellHTML = `<div class="tt-cell" style="background:${c.bg};color:${c.fg};border-left:2px solid ${c.border}">
            ${entry.code}<br><small style="opacity:.75">${entry.room}</small>
          </div>`;
        }
      } else {
        /* Live data — collect all matching sections */
        const blocks = [];
        secIdxs.forEach(secIdx => {
          const key = `${d}-${slotIdx}-${secIdx}`;
          const cls = source[key];
          if(cls) blocks.push({ cls, secIdx });
        });
 
        if(blocks.length > 0){
          cellHTML = blocks.map(({ cls, secIdx }) => {
            const c = _previewColor(cls.code);
            const secLabel = secVal==='all' && typeof SECTIONS !== 'undefined'
              ? `<small style="font-size:.58rem;opacity:.6;display:block">${SECTIONS[secIdx]?.split('-').pop()||''}</small>`
              : '';
            const isCancelled = typeof CANCELLED_SLOTS !== 'undefined' && CANCELLED_SLOTS.has(`${d}-${slotIdx}-${secIdx}`);
 
            if(isCancelled){
              return `<div class="tt-cell" style="background:rgba(220,38,38,.07);color:var(--coral);border-left:2px dashed var(--coral);font-size:.68rem">
                ✕ Cancelled<br><small style="opacity:.65">${cls.code}</small>
              </div>`;
            }
            return `<div class="tt-cell" style="background:${c.bg};color:${c.fg};border-left:2px solid ${c.border}">
              ${cls.code}<br><small style="opacity:.75">${cls.room}</small>${secLabel}
            </div>`;
          }).join('');
        }
      }
 
      html += `<td>${cellHTML}</td>`;
    }
 
    html += `</tr>`;
  });
 
  table.innerHTML = html;
};
 
/* ── Hook into all builder mutations so preview stays in sync ── */
 
/* After addClassToGrid */
const _origAddClass = window.addClassToGrid;
window.addClassToGrid = function(){
  _origAddClass && _origAddClass();
  renderDashTTPreview();
};
 
/* After removeCell */
const _origRemoveCell = window.removeCell;
window.removeCell = function(d,s,secIdx,e){
  _origRemoveCell && _origRemoveCell(d,s,secIdx,e);
  renderDashTTPreview();
};
 
/* After confirmPublish */
const _origConfirmPublish = window.confirmPublish;
window.confirmPublish = function(){
  _origConfirmPublish && _origConfirmPublish();
  renderDashTTPreview();
};
 
/* After clearTimetable */
const _origClearTimetable = window.clearTimetable;
window.clearTimetable = function(){
  _origClearTimetable && _origClearTimetable();
  renderDashTTPreview();
};
 
/* ── Hook into _onPageEnter for 'dash' ── */
const _origOnPageEnterDash = window._onPageEnter;
/* Since _onPageEnter is a closure we hook via renderDashPendingRequests
   which IS called on dash enter. Wrap it: */
const _origRenderDashPending = window.renderDashPendingRequests;
window.renderDashPendingRequests = function(){
  _origRenderDashPending && _origRenderDashPending();
  renderDashTTPreview();
};
 
/* ── Auto-init ── */
function _initDashPreview(){
  renderDashTTPreview();
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _initDashPreview);
} else {
  _initDashPreview();
}
 
console.log('%cDash TT Preview Patch loaded — auto-syncs with builder','color:#059669;font-size:12px');
function _syncTopNav(id){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/show\(\s*['"]([^'"]+)['"]/);
    btn.classList.toggle('active', !!(m && m[1] === id));
  });
}
 
window.show = function(id, btn){
  if(id !== 'login' && !ROLE_ACCESS[APP.currentRole]?.includes(id)){
    showToast('Access denied.', 'error'); return;
  }
  APP.prevPage = _currentPage();
  _activatePage(id);
  _syncTopNav(id);
  window.scrollTo(0, 0);
  _onPageEnter(id);
};
 
window.goPage = function(id){
  const allowed = ROLE_ACCESS[APP.currentRole] || ['login'];
  if(id !== 'login' && !allowed.includes(id)){ showToast('Access denied', 'error'); return; }
  APP.prevPage = _currentPage();
  _activatePage(id);
  _syncTopNav(id);
  window.scrollTo(0, 0);
  _onPageEnter(id);
};
 
window.sidebarNav = function(item, pageId){
  const sidebar = item.closest('.sidebar');
  if(sidebar) sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  window.goPage(pageId);
};
 
console.log('%cNav highlight fix loaded','color:#16a34a;font-size:12px');