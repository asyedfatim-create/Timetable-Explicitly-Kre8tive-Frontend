/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — dash-preview.js
   Dashboard Timetable Preview + Hooks
═══════════════════════════════════════════════════════════════ */

const PREVIEW_COLOR = {
  IP:  { bg:'rgba(29,78,216,.09)',  border:'var(--gold-lt)', fg:'var(--gold-lt)' },
  OS:  { bg:'rgba(8,145,178,.09)',  border:'var(--teal)',    fg:'var(--teal)'    },
  DS:  { bg:'rgba(217,119,6,.09)', border:'var(--amber)',   fg:'var(--amber)'   },
  MAD: { bg:'rgba(220,38,38,.09)', border:'var(--coral)',   fg:'var(--coral)'   },
  DM:  { bg:'rgba(3,105,161,.09)', border:'var(--blue)',    fg:'var(--blue)'    },
  IPL: { bg:'rgba(29,78,216,.09)',  border:'var(--gold-lt)', fg:'var(--gold-lt)' },
};

function _previewColor(code){
  return PREVIEW_COLOR[code] || { bg:'rgba(139,92,246,.09)', border:'#8B5CF6', fg:'#8B5CF6' };
}

/* Static fallback data removed to ensure only real API data is shown */
const STATIC_PREVIEW = {};

const PREVIEW_SLOTS = [
  { label:'8–9',   idx:0 },
  { label:'9–10',  idx:1 },
  { label:'10–11', idx:2 },
  { label:'11–12', idx:3 },
];
const PREVIEW_DAYS = ['Mon','Tue','Wed','Thu','Fri'];

const CANCELLED_SLOTS = new Set();

function renderDashTTPreview(){
  const table = document.getElementById('dashTTPreviewTable');
  if(!table) return;

  /* Decide data source */
  const hasDraft     = Object.keys(timetableData || {}).length > 0;
  const hasPublished = Object.keys(APP.publishedTimetable || {}).length > 0;
  const useStatic    = !hasDraft && !hasPublished;
  const source       = hasDraft ? timetableData : (hasPublished ? APP.publishedTimetable : null);

  /* Update status label */
  const statusEl = document.getElementById('dashPreviewStatus');
  const pill     = document.getElementById('ttPreviewPill');
  if(statusEl){
    if(useStatic){
      statusEl.textContent = 'No timetable built yet — showing example preview';
      statusEl.style.color = 'var(--text3)';
    } else if(hasDraft && !hasPublished){
      statusEl.textContent = '✏️ Showing draft (unpublished)';
      statusEl.style.color = 'var(--amber)';
      if(pill){ pill.textContent='Draft'; pill.className='pill pill-amber'; }
    } else {
      statusEl.textContent = '✅ Live published timetable';
      statusEl.style.color = 'var(--teal)';
      if(pill){ pill.textContent='Live'; pill.className='pill pill-teal'; }
    }
  }

  /* Determine which sections to show */
  const secSel = document.getElementById('dashPreviewSection');
  const secVal = secSel?.value || 'all';
  const secIdxs = secVal === 'all' ? [0,1,2,3] : [parseInt(secVal)];

  /* Today's day index (0=Mon…4=Fri) for highlight */
  const todayDow = new Date().getDay();
  const todayIdx = (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : -1;

  /* Build header */
  let html = `<tr><th>Time</th>`;
  PREVIEW_DAYS.forEach((d,i)=>{
    const isToday = i === todayIdx;
    html += `<th${isToday?' class="today"':''}>${d}${isToday?'<br><small style="font-size:.62rem;font-weight:400">Today</small>':''}</th>`;
  });
  html += `</tr>`;

  /* Build rows */
  PREVIEW_SLOTS.forEach(({ label, idx: slotIdx }) => {
    html += `<tr><td class="tt-time">${label}</td>`;

    for(let d=0; d<5; d++){
      let cellHTML = '';

      if(useStatic){
        /* Empty cell when no data is built yet */
        cellHTML = `<div class="tt-cell" style="background:var(--bg2);color:var(--text3);border-left:2px solid #E2E8F0;opacity:0.6;display:flex;align-items:center;justify-content:center;font-size:0.75rem">
          Empty
        </div>`;
      } else {
        const blocks = [];
        secIdxs.forEach(secIdx => {
          const key = `${d}-${slotIdx}-${secIdx}`;
          const cls = source[key];
          if(cls) blocks.push({ cls, secIdx });
        });

        if(blocks.length > 0){
          cellHTML = blocks.map(({ cls, secIdx }) => {
            const c = _previewColor(cls.code);
            const secLabel = secVal==='all' && typeof SECTIONS !== 'undefined'
              ? `<small style="font-size:.58rem;opacity:.6;display:block">${SECTIONS[secIdx]?.split('-').pop()||''}</small>`
              : '';
            const isCancelled = CANCELLED_SLOTS.has(`${d}-${slotIdx}-${secIdx}`);

            if(isCancelled){
              return `<div class="tt-cell" style="background:rgba(220,38,38,.07);color:var(--coral);border-left:2px dashed var(--coral);font-size:.68rem">
                ✕ Cancelled<br><small style="opacity:.65">${cls.code}</small>
              </div>`;
            }
            return `<div class="tt-cell" style="background:${c.bg};color:${c.fg};border-left:2px solid ${c.border}">
              ${cls.code}<br><small style="opacity:.75">${cls.room}</small>${secLabel}
            </div>`;
          }).join('');
        }
      }

      html += `<td>${cellHTML}</td>`;
    }

    html += `</tr>`;
  });

  table.innerHTML = html;
}
