/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — builder.js
   §17  BUILD TIMETABLE GRID (API-backed)
   §18  PUBLISH
═══════════════════════════════════════════════════════════════ */

/* §17  BUILD TIMETABLE GRID */
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

async function removeCell(d,s,secIdx,e){
  if(e&&e.stopPropagation) e.stopPropagation();
  const key=ttKey(d,s,secIdx);
  if(timetableData[key]){
    const cls=timetableData[key];
    try {
      if(cls.entryId) await API.delete(`/timetable/entry/${cls.entryId}`);
      delete timetableData[key];
      refreshGrid();
      showToast(`Removed ${cls.code} from ${DAYS[d]} · ${SLOTS[s]}`,'warn');
    } catch(err) {
      showToast(err.message||'Failed to remove','error');
    }
  }
}

async function addClassToGrid(){
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
  const teacher = teachersData[parseInt(tIdx)];
  const room    = roomsData[parseInt(rIdx)];
  const section = sectionsData[secIdx];
  const d=parseInt(dIdx), s=parseInt(sIdx);

  if(!course||!teacher||!room||!section){
    showToast('Invalid selection','error'); return;
  }

  try {
    const res = await API.post('/timetable/entry', {
      dayIndex: d, slotIndex: s,
      sectionId: section.id, courseId: course.id,
      teacherId: teacher.id, roomId: room.id
    });

    if(res.success){
      const entry = res.entry;
      const key = ttKey(d, s, secIdx);
      timetableData[key] = {
        entryId: entry.id, code: entry.courseCode, name: entry.courseName,
        color: entry.color, bg: entry.bg, border: entry.border, fg: entry.fg,
        teacher: entry.teacher, room: entry.room, section: entry.section
      };
      refreshGrid();
      recentAdds.unshift({text:`${entry.courseCode} · ${DAYS[d]} ${SLOTS[s]}`,detail:`${entry.teacher} · ${entry.room} · ${entry.section}`});
      if(recentAdds.length>8) recentAdds.pop();
      renderRecentLog();
      updateSectionLabel();
      showToast(`✓ ${entry.courseCode} added — ${DAYS[d]} · ${SLOTS[s]}`,'success');
    }
  } catch(err) {
    showToast(err.message||'Failed to add class','error');
  }
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
  if(!c){ preview.style.display='none'; return; }
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

/* §18  PUBLISH */
async function openPublishModal(){
  const total=Object.keys(timetableData).length;
  if(total===0){ showToast('Add some classes first!','warn'); return; }
  safeSet('publishModalSub',`${total} class slot${total!==1?'s':''} will go live for all students and teachers.`);
  document.getElementById('publishModal')?.classList.add('open');
}

function closePublishModal(){ document.getElementById('publishModal')?.classList.remove('open'); }

async function confirmPublish(){
  closePublishModal();
  try {
    const res = await API.post('/timetable/publish', { notify: true });
    if(res.success){
      APP.publishedTimetable = JSON.parse(JSON.stringify(timetableData));
      showToast('🚀 Timetable published successfully!','success');
      setTimeout(()=>showToast('📲 Notifications sent to all sections','success'),1200);
    }
  } catch(err) {
    showToast(err.message||'Failed to publish','error');
  }
}

async function clearTimetable(){
  if(Object.keys(timetableData).length===0){ showToast('Grid is already empty','warn'); return; }
  if(!confirm('Clear all classes? This cannot be undone.')) return;
  try {
    await API.delete('/timetable/clear');
    timetableData={}; recentAdds=[];
    renderRecentLog(); refreshGrid();
    showToast('🗑️ Timetable cleared','warn');
  } catch(err) {
    showToast(err.message||'Failed to clear','error');
  }
}

async function saveDraft(){
  try {
    const res = await API.post('/timetable/draft', {});
    showToast(`💾 ${res.message||'Draft saved'}`,'success');
  } catch(err) {
    showToast(err.message||'Failed to save draft','error');
  }
}
