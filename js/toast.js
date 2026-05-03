/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — toast.js
   §7  TOAST
═══════════════════════════════════════════════════════════════ */

function showToast(msg, type=''){
  const c=document.getElementById('toastContainer'); if(!c) return;
  const el=document.createElement('div');
  el.className=`toast-msg ${type}`; el.textContent=msg;
  c.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),350); },2800);
}
