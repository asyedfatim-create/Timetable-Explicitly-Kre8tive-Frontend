/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — timetable-view.js
   §14  TIMETABLE VIEW — Batch + Section filter
═══════════════════════════════════════════════════════════════ */

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
