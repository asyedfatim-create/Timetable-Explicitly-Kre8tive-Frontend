/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-sections.js
   §24  SECTIONS CRUD (API-backed)
═══════════════════════════════════════════════════════════════ */

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
    const fp=Math.round((s.students/s.capacity)*100);
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
        <button class="row-btn rb-edit"   onclick="editSection(${s.id})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteSection(${s.id})">🗑</button>
        <button class="row-btn rb-view"   onclick="viewSectionTT(${s.id})">📅</button>
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
  _setVal('sectionEditIdx',''); safeSet('sectionFormTitle','➕ Add Section');
  _clearField('sfName'); _setVal('sfBatch','F23'); _setVal('sfShift','Afternoon');
  _setVal('sfLabel','A'); _setVal('sfCapacity',50); _setVal('sfStudents',0);
  document.getElementById('sectionFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editSection(id){
  const s=sectionsData.find(x=>x.id===id); if(!s) return;
  _setVal('sectionEditIdx',id); safeSet('sectionFormTitle','✏️ Edit Section');
  _setVal('sfName',s.name); _setVal('sfBatch',s.batch); _setVal('sfShift',s.shift);
  _setVal('sfLabel',s.label); _setVal('sfCapacity',s.capacity); _setVal('sfStudents',s.students);
  document.getElementById('sectionFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveSection(){
  const name=document.getElementById('sfName')?.value.trim();
  if(!name){ showToast('Section name required','error'); return; }
  const batch   =document.getElementById('sfBatch')?.value||'F23';
  const shift   =document.getElementById('sfShift')?.value||'Afternoon';
  const label   =document.getElementById('sfLabel')?.value||'A';
  const capacity=parseInt(document.getElementById('sfCapacity')?.value)||50;
  const students=parseInt(document.getElementById('sfStudents')?.value)||0;
  const id=document.getElementById('sectionEditIdx')?.value;

  try {
    if(!id){
      await API.post('/sections', {name,batch,shift,label,students,capacity,courses:[]});
      showToast(`✓ ${name} added`,'success');
    } else {
      await API.put(`/sections/${id}`, {name,batch,shift,label,students,capacity});
      showToast(`✓ ${name} updated`,'success');
    }
    const res = await API.get('/sections');
    sectionsData = (res.data||[]).map(s => ({
      id:s.id, name:s.name, batch:s.batch, shift:s.shift,
      label:s.label, students:s.students, capacity:s.capacity,
      courses:s.courses||[]
    }));
    SECTIONS = sectionsData.map(s => s.name);
    cancelSectionForm(); renderSectionTable();
  } catch(err) {
    showToast(err.message||'Failed to save section','error');
  }
}

function cancelSectionForm(){ _setVal('sectionEditIdx',''); safeSet('sectionFormTitle','➕ Add Section'); }

async function deleteSection(id){
  const s=sectionsData.find(x=>x.id===id); if(!s||!confirm(`Delete ${s.name}?`)) return;
  try {
    await API.delete(`/sections/${id}`);
    showToast(`🗑 ${s.name} removed`,'warn');
    const res = await API.get('/sections');
    sectionsData = (res.data||[]).map(s => ({
      id:s.id, name:s.name, batch:s.batch, shift:s.shift,
      label:s.label, students:s.students, capacity:s.capacity,
      courses:s.courses||[]
    }));
    SECTIONS = sectionsData.map(s => s.name);
    renderSectionTable();
  } catch(err) {
    showToast(err.message||'Failed to delete','error');
  }
}

function viewSectionTT(id){
  const idx = sectionsData.findIndex(s=>s.id===id);
  showToast(`📅 Loading timetable for ${sectionsData[idx]?.name}…`,'');
  viewSection = idx;
  setTimeout(()=>{ goPage('makett'); }, 800);
}
