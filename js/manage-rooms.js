/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-rooms.js
   §22  ROOMS CRUD (API-backed)
═══════════════════════════════════════════════════════════════ */

const ROOM_ICONS={ Lab:'🧪',Lecture:'📋',Auditorium:'🎭' };

function renderRoomTable(){
  const q     =(document.getElementById('roomSearch')?.value||'').toLowerCase();
  const type  = document.getElementById('roomTypeFilter')?.value||'all';
  const status= document.getElementById('roomStatusFilter')?.value||'all';
  let rows=roomsData.filter(r=>(r.name.toLowerCase().includes(q)||r.type.toLowerCase().includes(q))&&(type==='all'||r.type===type)&&(status==='all'||r.status===status));
  rows=_sortArray(rows,roomSortKey,roomSortAsc);
  const tbody=document.getElementById('roomTbody'); if(!tbody) return;
  tbody.innerHTML=rows.length===0?_emptyRow('🏫','No rooms match.',9):rows.map(r=>{
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
        <button class="row-btn rb-edit"   onclick="editRoom(${r.id})">✏️ Edit</button>
        <button class="row-btn rb-delete" onclick="deleteRoom(${r.id})">🗑</button>
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
  _setVal('roomEditIdx',''); safeSet('roomFormTitle','➕ Add Room');
  _clearField('rfName'); _setVal('rfType','Lecture'); _setVal('rfFloor','1');
  _clearField('rfCapacity'); _setVal('rfStatus','Available');
  document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]').forEach(cb=>cb.checked=false);
  document.getElementById('roomFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function editRoom(id){
  const r=roomsData.find(x=>x.id===id); if(!r) return;
  _setVal('roomEditIdx',id); safeSet('roomFormTitle','✏️ Edit Room');
  _setVal('rfName',r.name); _setVal('rfType',r.type); _setVal('rfFloor',r.floor);
  _setVal('rfCapacity',r.capacity); _setVal('rfStatus',r.status);
  document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]').forEach(cb=>cb.checked=r.facilities.includes(cb.value));
  document.getElementById('roomFormPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveRoom(){
  const name=document.getElementById('rfName')?.value.trim();
  const cap =parseInt(document.getElementById('rfCapacity')?.value);
  if(!name){ showToast('Room name required','error'); return; }
  if(!cap||cap<1){ showToast('Enter a valid capacity','error'); return; }
  const type=document.getElementById('rfType')?.value||'Lecture';
  const floor=document.getElementById('rfFloor')?.value||'1';
  const status=document.getElementById('rfStatus')?.value||'Available';
  const facilities=[...document.querySelectorAll('#rfFacilitiesWrap input[type=checkbox]:checked')].map(cb=>cb.value);
  const id=document.getElementById('roomEditIdx')?.value;

  try {
    if(!id){
      await API.post('/rooms', {name,type,capacity:cap,floor,facilities,status});
      showToast(`✓ ${name} added`,'success');
    } else {
      await API.put(`/rooms/${id}`, {name,type,capacity:cap,floor,facilities,status});
      showToast(`✓ ${name} updated`,'success');
    }
    const res = await API.get('/rooms');
    roomsData = (res.data||[]).map(r => ({
      id:r.id, name:r.name, type:r.type, capacity:r.capacity,
      floor:r.floor, facilities:r.facilities||[], util:r.utilization||0, status:r.status
    }));
    ROOMS = roomsData.map(r => r.name);
    cancelRoomForm(); renderRoomTable();
  } catch(err) {
    showToast(err.message||'Failed to save room','error');
  }
}

function cancelRoomForm(){ _setVal('roomEditIdx',''); safeSet('roomFormTitle','➕ Add Room'); }

async function deleteRoom(id){
  const r=roomsData.find(x=>x.id===id); if(!r||!confirm(`Delete ${r.name}?`)) return;
  try {
    await API.delete(`/rooms/${id}`);
    showToast(`🗑 ${r.name} removed`,'warn');
    const res = await API.get('/rooms');
    roomsData = (res.data||[]).map(r => ({
      id:r.id, name:r.name, type:r.type, capacity:r.capacity,
      floor:r.floor, facilities:r.facilities||[], util:r.utilization||0, status:r.status
    }));
    ROOMS = roomsData.map(r => r.name);
    renderRoomTable();
  } catch(err) {
    showToast(err.message||'Failed to delete','error');
  }
}
