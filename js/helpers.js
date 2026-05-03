/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — helpers.js
   §6  HELPERS
═══════════════════════════════════════════════════════════════ */

function safeSet(id,val){ const e=document.getElementById(id); if(e) e.textContent=val; }
function _setVal(id,val){ const e=document.getElementById(id); if(e) e.value=val; }
function _clearField(id){ const e=document.getElementById(id); if(e) e.value=''; }
function ttKey(d,s,sec){ return `${d}-${s}-${sec}`; }
function _sortArray(arr,key,asc){
  return [...arr].sort((a,b)=>{
    let av=a[key]??'', bv=b[key]??'';
    if(typeof av==='string') av=av.toLowerCase();
    if(typeof bv==='string') bv=bv.toLowerCase();
    return asc ? (av>bv?1:-1) : (av<bv?1:-1);
  });
}
function _emptyRow(icon,text,cols){
  return `<tr><td colspan="${cols}"><div class="manage-empty"><div class="manage-empty-icon">${icon}</div><div class="manage-empty-text">${text}</div></div></td></tr>`;
}
function timestamp(){
  const now=new Date();
  return now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+now.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});
}
