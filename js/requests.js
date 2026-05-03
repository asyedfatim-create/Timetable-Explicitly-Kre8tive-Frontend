/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — requests.js
   §10  PENDING REQUESTS (API-backed)
═══════════════════════════════════════════════════════════════ */

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
        <div class="req-teacher">${r.teacher||r.teacherName} – ${r.type}</div>
        <div class="req-detail">${r.detail}</div>
      </div>
      <div class="req-actions">
        <button class="req-btn req-approve" onclick="approveRequest(${r.id})">✓ Approve</button>
        <button class="req-btn req-reject"  onclick="rejectRequest(${r.id})">✕ Reject</button>
      </div>
    </div>`;
}

async function renderDashPendingRequests(){
  /* Refresh from API */
  try {
    const res = await API.get('/requests?status=pending');
    APP.pendingRequests = (res.data||[]).map(r => ({
      id:r.id, type:r.type, teacher:r.teacherName, teacherName:r.teacherName,
      detail:r.detail, course:r.course, section:r.section, status:r.status
    }));
    _updateRequestBadges();
  } catch(e) { /* use cached */ }

  const list = document.querySelector('#dash .req-list');
  if(!list) return;
  const pending = APP.pendingRequests.filter(r=>r.status==='pending');
  list.innerHTML = pending.length===0
    ? '<div style="padding:1rem;text-align:center;color:var(--text3);font-size:.85rem">No pending requests</div>'
    : pending.map(_buildReqItemHTML).join('');
}

async function renderAdminReqList(){
  /* Refresh from API */
  try {
    const res = await API.get('/requests?status=pending');
    APP.pendingRequests = (res.data||[]).map(r => ({
      id:r.id, type:r.type, teacher:r.teacherName, teacherName:r.teacherName,
      detail:r.detail, course:r.course, section:r.section, status:r.status
    }));
    _updateRequestBadges();
  } catch(e) { /* use cached */ }

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

async function approveRequest(id){
  id = Number(id);
  try {
    const res = await API.patch(`/requests/${id}/approve`, {});
    showToast(`✓ ${res.message||'Request approved'}`,'success');
  } catch(err) {
    showToast(err.message||'Failed to approve','error'); return;
  }
  const req = APP.pendingRequests.find(r=>r.id===id);
  if(req) req.status = 'approved';
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el=>el.remove());
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
}

async function rejectRequest(id){
  id = Number(id);
  try {
    const res = await API.patch(`/requests/${id}/reject`, {});
    showToast(`✕ ${res.message||'Request rejected'}`,'error');
  } catch(err) {
    showToast(err.message||'Failed to reject','error'); return;
  }
  const req = APP.pendingRequests.find(r=>r.id===id);
  if(req) req.status = 'rejected';
  document.querySelectorAll(`[data-req-id="${id}"]`).forEach(el=>el.remove());
  _updateRequestBadges();
  renderAdminReqList();
  renderDashPendingRequests();
}
