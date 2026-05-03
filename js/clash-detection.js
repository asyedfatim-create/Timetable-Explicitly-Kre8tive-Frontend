/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — clash-detection.js
   §15  CLASH DETECTION (hybrid: local for stats, API for page)
═══════════════════════════════════════════════════════════════ */

/* Local detection for quick stats (used by updateStats) */
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

async function renderClashPage(){
  /* Try to fetch from backend API first */
  try {
    const res = await API.get('/timetable/clashes');
    APP.clashes = res.clashes || [];
  } catch(err) {
    detectClashes(); /* fallback to local */
  }

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

async function resolveClash(clashId){
  try {
    const res = await API.post(`/timetable/clashes/${clashId}/resolve`, {});
    if(res.success){
      showToast(`✓ ${res.message}`,'success');
      await loadTimetableData();
      renderClashPage();
      updateStats();
    }
  } catch(err) {
    /* Fallback to local resolution */
    const clash = APP.clashes.find(c=>String(c.id)===String(clashId));
    if(!clash){ showToast('Clash not found','error'); return; }
    const key = ttKey(clash.dayIdx||clash.dayIndex,clash.slotIdx||clash.slotIndex,clash.secB||clash.sectionBId);
    if(timetableData[key]){
      const cls = timetableData[key];
      if(cls.entryId) try { await API.delete(`/timetable/entry/${cls.entryId}`); } catch(e){}
      delete timetableData[key];
      showToast(`✓ Conflict resolved — removed ${cls.code}`,'success');
      APP.clashes = APP.clashes.filter(c=>String(c.id)!==String(clashId));
      document.getElementById(`clash-${clashId}`)?.remove();
      updateStats();
      if(APP.clashes.length===0) renderClashPage();
    } else {
      showToast('Could not auto-resolve. Remove the class manually from the builder.','warn');
    }
  }
}
