/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — teacher-request.js
   §16  TEACHER REQUEST SUBMISSION (API-backed)
═══════════════════════════════════════════════════════════════ */

async function submitRequest(type){
  if(APP.currentRole!=='teacher'){ showToast('Only teachers can submit requests','error'); return; }
  let reqData = {};

  if(type==='makeup'){
    const selects = document.querySelectorAll('#tab-makeup select');
    const dates   = document.querySelectorAll('#tab-makeup input[type="date"]');
    const reason  = document.querySelector('#tab-makeup textarea')?.value||'';
    const course  = selects[0]?.value||'Unknown';
    const section = selects[1]?.value||'';
    const newDate = dates[1]?.value||'';
    const room    = selects[3]?.value||'Auto-assign';
    reqData = { type:'Makeup / Reschedule', course, section, newDate, room, reason };
  } else if(type==='merge'){
    const sels = document.querySelectorAll('#tab-merge select');
    const course=sels[0]?.value||'', sectionA=sels[1]?.value||'', sectionB=sels[2]?.value||'', venue=sels[3]?.value||'';
    reqData = { type:'Section Merge', course, sectionA, sectionB, venue };
  } else if(type==='cancel'){
    const sels=document.querySelectorAll('#tab-cancel select');
    const dates=document.querySelectorAll('#tab-cancel input[type="date"]');
    const course=sels[0]?.value||'', section=sels[1]?.value||'', date=dates[0]?.value||'', reason=sels[2]?.value||'';
    reqData = { type:'Cancel Lecture', course, section, date, reason };
  }

  if(!reqData.type){ showToast('Unknown request type','error'); return; }

  try {
    const res = await API.post('/requests', reqData);
    showToast('✓ Request submitted! Admin will review shortly.','success');
    if(res.data) _addToRequestHistory(res.data);
  } catch(err) {
    showToast(err.message||'Failed to submit request','error');
  }
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
        <div class="hist-title">${req.type} · ${(req.detail||'').split('·')[0]||''}</div>
        <div class="hist-meta">Pending Admin Review · ${timestamp()}</div>
      </div>`;
    histBody.prepend(item);
  });
}
