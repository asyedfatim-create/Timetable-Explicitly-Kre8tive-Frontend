/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-courses.js
   §23  COURSES CRUD (API-backed)
═══════════════════════════════════════════════════════════════ */

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
    const cs=COLOR_STYLE[c.color]||COLOR_STYLE.teal;
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
        <button class="row-btn rb-edit"   onclick="editCourse(${c.id})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteCourse(${c.id})">🗑</button>
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
  _setVal('courseEditIdx',''); safeSet('courseFormTitle','➕ Add Course');
  _clearField('cfName'); _clearField('cfCode');
  _setVal('cfType','Core'); _setVal('cfCH','3'); _setVal('cfColor','gold'); _setVal('cfSessions',3);
  document.getElementById('courseFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editCourse(id){
  const c=coursesData.find(x=>x.id===id); if(!c) return;
  _setVal('courseEditIdx',id); safeSet('courseFormTitle','✏️ Edit Course');
  _setVal('cfName',c.name); _setVal('cfCode',c.code);
  _setVal('cfType',c.type); _setVal('cfCH',c.ch); _setVal('cfColor',c.color); _setVal('cfSessions',c.sessions);
  document.getElementById('courseFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveCourse(){
  const name=document.getElementById('cfName')?.value.trim();
  const code=document.getElementById('cfCode')?.value.trim();
  if(!name||!code){ showToast('Name and code are required','error'); return; }
  const type=document.getElementById('cfType')?.value||'Core';
  const creditHours=parseInt(document.getElementById('cfCH')?.value)||3;
  const color=document.getElementById('cfColor')?.value||'gold';
  const sessionsPerWeek=parseInt(document.getElementById('cfSessions')?.value)||3;
  const id=document.getElementById('courseEditIdx')?.value;

  try {
    if(!id){
      await API.post('/courses', {name,code,type,creditHours,sessionsPerWeek,color});
      showToast(`✓ ${name} added`,'success');
    } else {
      await API.put(`/courses/${id}`, {name,code,type,creditHours,sessionsPerWeek,color});
      showToast(`✓ ${name} updated`,'success');
    }
    /* Reload courses */
    const res = await API.get('/courses');
    coursesData = (res.data||[]).map(c => ({
      id:c.id, name:c.name, code:c.code, type:c.type,
      ch:c.creditHours, teacher:c.teacherName||'', teacherId:c.teacherId,
      sessions:c.sessionsPerWeek, color:c.color||'gold'
    }));
    populateTeacherCourseDropdown();
    cancelCourseForm(); renderCourseTable();
  } catch(err) {
    showToast(err.message||'Failed to save course','error');
  }
}

function cancelCourseForm(){ _setVal('courseEditIdx',''); safeSet('courseFormTitle','➕ Add Course'); }

async function deleteCourse(id){
  const c=coursesData.find(x=>x.id===id); if(!c||!confirm(`Delete ${c.name}?`)) return;
  try {
    await API.delete(`/courses/${id}`);
    showToast(`🗑 ${c.name} removed`,'warn');
    const res = await API.get('/courses');
    coursesData = (res.data||[]).map(c => ({
      id:c.id, name:c.name, code:c.code, type:c.type,
      ch:c.creditHours, teacher:c.teacherName||'', teacherId:c.teacherId,
      sessions:c.sessionsPerWeek, color:c.color||'gold'
    }));
    populateTeacherCourseDropdown(); renderCourseTable();
  } catch(err) {
    showToast(err.message||'Failed to delete','error');
  }
}
