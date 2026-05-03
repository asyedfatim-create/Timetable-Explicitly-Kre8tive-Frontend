/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-common.js
   §19  MANAGE TAB SWITCHER
   §20  EXPORT CSV, SORT, SETTINGS
═══════════════════════════════════════════════════════════════ */

/* §19  TAB SWITCHER */
function switchTab(btn,tabId){
  btn.closest('.req-type-tabs')?.querySelectorAll('.req-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
}

/* §20  EXPORT CSV */
function exportManage(type){
  let header='', rows=[];
  if(type==='teachers'){
    header='Name,Email,Department,Status,Courses,Load';
    rows=teachersData.map(t=>`"${t.name}","${t.email}","${t.dept}","${t.status}","${t.courses.join(';')}","${t.load}"`);
  } else if(type==='rooms'){
    header='Room,Type,Capacity,Floor,Facilities,Utilisation,Status';
    rows=roomsData.map(r=>`"${r.name}","${r.type}",${r.capacity},"${r.floor}","${(r.facilities||[]).join(';')}",${r.util}%,"${r.status}"`);
  } else if(type==='courses'){
    header='Name,Code,Type,CH,Teacher,Sessions/wk';
    rows=coursesData.map(c=>`"${c.name}","${c.code}","${c.type}",${c.ch},"${c.teacher}",${c.sessions}`);
  } else if(type==='sections'){
    header='Section,Batch,Shift,Students,Capacity,Courses';
    rows=sectionsData.map(s=>`"${s.name}","${s.batch}","${s.shift}",${s.students},${s.capacity},"${s.courses?.join(';')||''}"`);
  }
  if(!header){ showToast('Nothing to export','warn'); return; }
  const csv = header+'\n'+rows.join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`IBIT_TAS_${type}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast(`✓ Exported ${rows.length} ${type}`,'success');
}

/* SORT */
function sortManage(type,key){
  if(type==='teachers'){    teacherSortAsc=(teacherSortKey===key)?!teacherSortAsc:true; teacherSortKey=key; renderTeacherTable(); }
  else if(type==='rooms'){  roomSortAsc=(roomSortKey===key)?!roomSortAsc:true; roomSortKey=key; renderRoomTable(); }
  else if(type==='courses'){courseSortAsc=(courseSortKey===key)?!courseSortAsc:true; courseSortKey=key; renderCourseTable(); }
  else if(type==='sections'){sectionSortAsc=(sectionSortKey===key)?!sectionSortAsc:true; sectionSortKey=key; renderSectionTable(); }
}

function comingSoon(feature){ showToast(`${feature} is coming soon!`,'warn'); }

function openSettingsModal(){ comingSoon('Settings'); }

function toggleDarkMode(){
  document.body.classList.toggle('dark-mode');
  showToast('Dark mode toggled','success');
}
