/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — notifications.js
   §9  NOTIFICATIONS SYSTEM (API-backed)
═══════════════════════════════════════════════════════════════ */

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

async function renderNotifFeed(){
  /* Try to refresh from API */
  try {
    const res = await API.get('/notifications');
    APP.notifications = (res.data||[]).map(n => ({
      id: n.id, title: n.title, msg: n.message, type: n.type,
      time: n.time ? new Date(n.time).toLocaleString() : '',
      unread: n.unread
    }));
  } catch(err) { /* use cached */ }

  const feed = document.querySelector('#notif .notif-feed');
  if(!feed) return;
  const typeMap = { gold:'nd-gold', teal:'nd-teal', coral:'nd-coral', amber:'nd-amber' };
  const iconMap = { gold:'📅', teal:'✅', coral:'❌', amber:'⚠️' };
  let filtered = notifActiveFilter==='all' ? APP.notifications : APP.notifications.filter(n=>n.type===notifActiveFilter);

  if(filtered.length===0){
    feed.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text3)">No notifications in this category</div>';
  } else {
    feed.innerHTML = filtered.map((n,idx)=>{
      return `
      <div class="notif-card ${n.unread?'unread '+n.type:''}" onclick="markRead(${n.id})">
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
  _updateNotifBadges();
}

function _updateNotifFilterCounts(all, cancels, makeup, changes, reqs){
  const nfBtns = document.querySelectorAll('#notif .nf-btn');
  const counts = [all, cancels, makeup, changes, reqs];
  nfBtns.forEach((btn,i)=>{ const badge=btn.querySelector('.nf-count'); if(badge&&counts[i]!==undefined) badge.textContent=counts[i]; });
}

async function markRead(id){
  try { await API.patch(`/notifications/${id}/read`, {}); } catch(e) { /* ignore */ }
  const notif = APP.notifications.find(n=>n.id===id);
  if(notif) notif.unread=false;
  _updateNotifBadges();
  renderNotifFeed();
}

async function markAllRead(){
  try { await API.patch('/notifications/read-all', {}); } catch(e) { /* ignore */ }
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
