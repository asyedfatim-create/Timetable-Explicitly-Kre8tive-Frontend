/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-teachers.js
   §21  TEACHERS CRUD (API-backed)
═══════════════════════════════════════════════════════════════ */

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
        <button class="row-btn rb-edit"   onclick="editTeacher(${t.id})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteTeacher(${t.id})">🗑</button>
        <button class="row-btn rb-view"   onclick="viewTeacherTT(${t.id})">📅</button>
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
  _setVal('teacherEditIdx',''); safeSet('teacherFormTitle','➕ Add Teacher');
  _clearField('tfName'); _clearField('tfEmail');
  _setVal('tfDept','CS'); _setVal('tfStatus','Active'); _setVal('tfLoad',8);
  populateTeacherCourseDropdown();
  const tags=document.getElementById('tfCourseTags'); if(tags) tags.innerHTML='';
  document.getElementById('teacherFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editTeacher(id){
  const t=teachersData.find(x=>x.id===id); if(!t) return;
  _setVal('teacherEditIdx',id); safeSet('teacherFormTitle','✏️ Edit Teacher');
  _setVal('tfName',t.name); _setVal('tfEmail',t.email);
  _setVal('tfDept',t.dept); _setVal('tfStatus',t.status); _setVal('tfLoad',t.load);
  populateTeacherCourseDropdown();
  loadTeacherCourseTags(t.courses);
  document.getElementById('teacherFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveTeacher(){
  const name =document.getElementById('tfName')?.value.trim();
  const email=document.getElementById('tfEmail')?.value.trim();
  if(!name||!email){ showToast('Name and email are required','error'); return; }
  const dept   =document.getElementById('tfDept')?.value||'CS';
  const status =document.getElementById('tfStatus')?.value||'Active';
  const load   =parseInt(document.getElementById('tfLoad')?.value)||8;
  const courses=getTeacherSelectedCourses();
  const id     =document.getElementById('teacherEditIdx')?.value;

  try {
    if(!id){
      await API.post('/teachers', {name,email,dept,status,courses,load});
      showToast(`✓ ${name} added`,'success');
    } else {
      await API.put(`/teachers/${id}`, {name,email,dept,status,courses,load});
      showToast(`✓ ${name} updated`,'success');
    }
    /* Reload data from backend */
    const res = await API.get('/teachers');
    teachersData = (res.data||[]).map(t => ({
      id:t.id, name:t.name, email:t.email, dept:t.dept,
      status:t.status, courses:t.courses||[], load:t.load
    }));
    TEACHERS = teachersData.map(t => t.name);
    cancelTeacherForm(); renderTeacherTable();
  } catch(err) {
    showToast(err.message||'Failed to save teacher','error');
  }
}

function cancelTeacherForm(){ _setVal('teacherEditIdx',''); safeSet('teacherFormTitle','➕ Add Teacher'); }

async function deleteTeacher(id){
  const t=teachersData.find(x=>x.id===id); if(!t||!confirm(`Delete ${t.name}?`)) return;
  try {
    await API.delete(`/teachers/${id}`);
    showToast(`🗑 ${t.name} removed`,'warn');
    const res = await API.get('/teachers');
    teachersData = (res.data||[]).map(t => ({
      id:t.id, name:t.name, email:t.email, dept:t.dept,
      status:t.status, courses:t.courses||[], load:t.load
    }));
    TEACHERS = teachersData.map(t => t.name);
    renderTeacherTable();
  } catch(err) {
    showToast(err.message||'Failed to delete','error');
  }
}

function viewTeacherTT(id){ showToast(`📅 Loading timetable…`,''); setTimeout(()=>goPage('tt'),800); }

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
