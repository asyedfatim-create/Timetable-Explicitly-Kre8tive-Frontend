/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — manage-common.js  [FIXED]
   §19  MANAGE TAB SWITCHER
   §20  EXPORT CSV, SORT
   §21  SETTINGS MODAL (dark mode, font size, accent, notifications)
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

/* ══════════════════════════════════════════
   §21  SETTINGS MODAL — works for all roles
══════════════════════════════════════════ */

/* Load persisted prefs from localStorage */
const SETTINGS_DEFAULTS = {
  darkMode: false,
  fontSize: 'medium',   // small | medium | large
  accentColor: 'gold',  // gold | teal | blue | coral
  notifSound: true,
  compactSidebar: false,
  showClock: true,
};

function _loadSettings(){
  try {
    const saved = localStorage.getItem('ibit_tas_settings');
    return saved ? { ...SETTINGS_DEFAULTS, ...JSON.parse(saved) } : { ...SETTINGS_DEFAULTS };
  } catch { return { ...SETTINGS_DEFAULTS }; }
}

function _saveSettings(prefs){
  localStorage.setItem('ibit_tas_settings', JSON.stringify(prefs));
}

function _applySettings(prefs){
  /* Dark mode */
  document.body.classList.toggle('dark-mode', !!prefs.darkMode);

  /* Font size */
  document.documentElement.style.setProperty('--base-font-size',
    prefs.fontSize === 'small' ? '13px' : prefs.fontSize === 'large' ? '16px' : '14px'
  );

  /* Accent color — swap --gold-lt CSS var to chosen color */
  const ACCENT_MAP = {
    gold:  { lt:'#C9A227', dim:'rgba(201,162,39,.12)' },
    teal:  { lt:'#0891B2', dim:'rgba(8,145,178,.12)'  },
    blue:  { lt:'#2563EB', dim:'rgba(37,99,235,.12)'  },
    coral: { lt:'#DC2626', dim:'rgba(220,38,38,.12)'  },
  };
  const acc = ACCENT_MAP[prefs.accentColor] || ACCENT_MAP.gold;
  document.documentElement.style.setProperty('--accent-lt',  acc.lt);
  document.documentElement.style.setProperty('--accent-dim', acc.dim);

  /* Compact sidebar */
  document.querySelectorAll('.sidebar').forEach(s =>
    s.classList.toggle('sidebar-compact', !!prefs.compactSidebar)
  );
}

/* Build settings modal HTML and inject into body (once) */
function _ensureSettingsModal(){
  if(document.getElementById('settingsModal')) return;
  const modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.style.cssText = `
    display:none; position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.45); backdrop-filter:blur(4px);
    align-items:center; justify-content:center;
  `;
  modal.innerHTML = `
    <div class="settings-panel" style="
      background:var(--bg,#fff); border-radius:18px; width:min(480px,96vw);
      box-shadow:0 20px 60px rgba(0,0,0,.25); overflow:hidden;
      font-family:'Inter',sans-serif; border:1.5px solid rgba(201,162,39,.18);
    ">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1.5px solid #E2E8F0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;color:var(--text,#0F172A)">
          ⚙️ Settings
        </div>
        <button onclick="closeSettingsModal()" style="
          background:none;border:none;cursor:pointer;font-size:1.2rem;
          color:var(--text3,#94A3B8);padding:.2rem .4rem;border-radius:6px;
          transition:.15s
        " onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='none'">✕</button>
      </div>

      <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;max-height:70vh;overflow-y:auto">

        <!-- Dark Mode -->
        <div class="s-row" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem">🌙 Dark Mode</div>
            <div style="font-size:.75rem;color:var(--text3,#94A3B8);margin-top:.15rem">Switch to dark theme</div>
          </div>
          <label class="s-toggle" style="position:relative;display:inline-block;width:46px;height:26px;cursor:pointer">
            <input type="checkbox" id="sDarkMode" style="opacity:0;width:0;height:0" onchange="onSettingChange()">
            <span style="
              position:absolute;inset:0;background:#CBD5E1;border-radius:26px;transition:.3s;
            " id="sDarkModeTrack"></span>
            <span style="
              position:absolute;left:3px;top:3px;width:20px;height:20px;background:#fff;
              border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2);
            " id="sDarkModeThumb"></span>
          </label>
        </div>

        <!-- Font Size -->
        <div>
          <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem;margin-bottom:.6rem">🔡 Font Size</div>
          <div style="display:flex;gap:.5rem">
            ${['small','medium','large'].map(s=>`
              <button id="sFont-${s}" onclick="setFontSize('${s}')" style="
                flex:1;padding:.45rem;border-radius:8px;border:1.5px solid #E2E8F0;
                background:none;cursor:pointer;font-size:.82rem;font-weight:600;
                color:var(--text2,#475569);transition:.15s;text-transform:capitalize
              ">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- Accent Color -->
        <div>
          <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem;margin-bottom:.6rem">🎨 Accent Color</div>
          <div style="display:flex;gap:.6rem">
            ${[
              {id:'gold',  color:'#C9A227', label:'Gold' },
              {id:'teal',  color:'#0891B2', label:'Teal' },
              {id:'blue',  color:'#2563EB', label:'Blue' },
              {id:'coral', color:'#DC2626', label:'Coral'},
            ].map(a=>`
              <button id="sAccent-${a.id}" onclick="setAccent('${a.id}')" title="${a.label}" style="
                width:32px;height:32px;border-radius:50%;background:${a.color};
                border:3px solid transparent;cursor:pointer;transition:.15s;
                box-shadow:0 2px 6px ${a.color}55
              "></button>
            `).join('')}
          </div>
        </div>

        <!-- Notification Sound -->
        <div class="s-row" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem">🔔 Notification Sound</div>
            <div style="font-size:.75rem;color:var(--text3,#94A3B8);margin-top:.15rem">Play sound on new alerts</div>
          </div>
          <label style="position:relative;display:inline-block;width:46px;height:26px;cursor:pointer">
            <input type="checkbox" id="sNotifSound" style="opacity:0;width:0;height:0" onchange="onSettingChange()">
            <span style="position:absolute;inset:0;background:#CBD5E1;border-radius:26px;transition:.3s" id="sNotifSoundTrack"></span>
            <span style="position:absolute;left:3px;top:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)" id="sNotifSoundThumb"></span>
          </label>
        </div>

        <!-- Compact Sidebar -->
        <div class="s-row" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem">📌 Compact Sidebar</div>
            <div style="font-size:.75rem;color:var(--text3,#94A3B8);margin-top:.15rem">Show icons only in sidebar</div>
          </div>
          <label style="position:relative;display:inline-block;width:46px;height:26px;cursor:pointer">
            <input type="checkbox" id="sCompact" style="opacity:0;width:0;height:0" onchange="onSettingChange()">
            <span style="position:absolute;inset:0;background:#CBD5E1;border-radius:26px;transition:.3s" id="sCompactTrack"></span>
            <span style="position:absolute;left:3px;top:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)" id="sCompactThumb"></span>
          </label>
        </div>

        <!-- Show Clock -->
        <div class="s-row" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600;color:var(--text,#0F172A);font-size:.9rem">🕐 Show Clock</div>
            <div style="font-size:.75rem;color:var(--text3,#94A3B8);margin-top:.15rem">Live clock in top-right corner</div>
          </div>
          <label style="position:relative;display:inline-block;width:46px;height:26px;cursor:pointer">
            <input type="checkbox" id="sShowClock" style="opacity:0;width:0;height:0" onchange="onSettingChange()">
            <span style="position:absolute;inset:0;background:#CBD5E1;border-radius:26px;transition:.3s" id="sShowClockTrack"></span>
            <span style="position:absolute;left:3px;top:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)" id="sShowClockThumb"></span>
          </label>
        </div>

      </div>

      <!-- Footer -->
      <div style="display:flex;gap:.75rem;padding:1rem 1.5rem;border-top:1.5px solid #E2E8F0">
        <button onclick="resetSettings()" style="
          flex:1;padding:.6rem;border-radius:10px;border:1.5px solid #E2E8F0;
          background:none;cursor:pointer;font-size:.85rem;font-weight:600;color:var(--text3,#94A3B8)
        ">Reset Defaults</button>
        <button onclick="closeSettingsModal()" style="
          flex:2;padding:.6rem;border-radius:10px;border:none;
          background:var(--gold-lt,#C9A227);cursor:pointer;font-size:.85rem;
          font-weight:700;color:#fff;font-family:'Syne',sans-serif
        ">Save &amp; Close</button>
      </div>
    </div>
  `;
  /* Close on backdrop click */
  modal.addEventListener('click', e => { if(e.target === modal) closeSettingsModal(); });
  document.body.appendChild(modal);
}

/* ── Toggle helpers for custom checkboxes ── */
function _syncToggle(id, checked){
  const track = document.getElementById(id+'Track');
  const thumb = document.getElementById(id+'Thumb');
  const inp   = document.getElementById(id);
  if(inp)   inp.checked = checked;
  if(track) track.style.background = checked ? 'var(--gold-lt,#C9A227)' : '#CBD5E1';
  if(thumb) thumb.style.transform  = checked ? 'translateX(20px)' : 'translateX(0)';
}

function _syncFontButtons(size){
  ['small','medium','large'].forEach(s=>{
    const btn = document.getElementById(`sFont-${s}`);
    if(btn){
      btn.style.background    = s===size ? 'var(--gold-lt,#C9A227)' : 'none';
      btn.style.color         = s===size ? '#fff' : 'var(--text2,#475569)';
      btn.style.borderColor   = s===size ? 'var(--gold-lt,#C9A227)' : '#E2E8F0';
    }
  });
}

function _syncAccentButtons(accent){
  ['gold','teal','blue','coral'].forEach(a=>{
    const btn = document.getElementById(`sAccent-${a}`);
    if(btn) btn.style.borderColor = a===accent ? '#0F172A' : 'transparent';
  });
}

/* Open settings modal */
function openSettingsModal(){
  _ensureSettingsModal();
  const prefs = _loadSettings();
  /* Sync all controls */
  _syncToggle('sDarkMode',    prefs.darkMode);
  _syncToggle('sNotifSound',  prefs.notifSound);
  _syncToggle('sCompact',     prefs.compactSidebar);
  _syncToggle('sShowClock',   prefs.showClock);
  _syncFontButtons(prefs.fontSize);
  _syncAccentButtons(prefs.accentColor);
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'flex';
  requestAnimationFrame(()=>{ modal.style.opacity='1'; });
}

function closeSettingsModal(){
  const modal = document.getElementById('settingsModal');
  if(modal) modal.style.display = 'none';
}

/* Called whenever any setting changes */
function onSettingChange(){
  const prefs = {
    darkMode:       document.getElementById('sDarkMode')?.checked    || false,
    notifSound:     document.getElementById('sNotifSound')?.checked  || false,
    compactSidebar: document.getElementById('sCompact')?.checked     || false,
    showClock:      document.getElementById('sShowClock')?.checked   || false,
    fontSize:       _activeFontSize(),
    accentColor:    _activeAccent(),
  };
  /* Sync toggle visuals */
  _syncToggle('sDarkMode',   prefs.darkMode);
  _syncToggle('sNotifSound', prefs.notifSound);
  _syncToggle('sCompact',    prefs.compactSidebar);
  _syncToggle('sShowClock',  prefs.showClock);
  _saveSettings(prefs);
  _applySettings(prefs);
  _manageClock(prefs.showClock);
}

function setFontSize(size){
  const prefs = _loadSettings();
  prefs.fontSize = size;
  _saveSettings(prefs);
  _applySettings(prefs);
  _syncFontButtons(size);
}

function setAccent(accent){
  const prefs = _loadSettings();
  prefs.accentColor = accent;
  _saveSettings(prefs);
  _applySettings(prefs);
  _syncAccentButtons(accent);
}

function resetSettings(){
  _saveSettings({ ...SETTINGS_DEFAULTS });
  _applySettings(SETTINGS_DEFAULTS);
  /* Re-sync controls */
  _syncToggle('sDarkMode',   SETTINGS_DEFAULTS.darkMode);
  _syncToggle('sNotifSound', SETTINGS_DEFAULTS.notifSound);
  _syncToggle('sCompact',    SETTINGS_DEFAULTS.compactSidebar);
  _syncToggle('sShowClock',  SETTINGS_DEFAULTS.showClock);
  _syncFontButtons(SETTINGS_DEFAULTS.fontSize);
  _syncAccentButtons(SETTINGS_DEFAULTS.accentColor);
  _manageClock(SETTINGS_DEFAULTS.showClock);
  showToast('Settings reset to defaults', 'success');
}

function _activeFontSize(){
  for(const s of ['small','medium','large']){
    if(document.getElementById(`sFont-${s}`)?.style.background?.includes('C9A227') ||
       document.getElementById(`sFont-${s}`)?.style.background?.includes('gold')) return s;
  }
  /* fallback: read from saved */
  return _loadSettings().fontSize || 'medium';
}

function _activeAccent(){
  for(const a of ['gold','teal','blue','coral']){
    if(document.getElementById(`sAccent-${a}`)?.style.borderColor === '#0F172A') return a;
  }
  return _loadSettings().accentColor || 'gold';
}

/* ── Live clock ── */
let _clockInterval = null;

function _manageClock(show){
  let clockEl = document.getElementById('liveClock');
  if(show){
    if(!clockEl){
      clockEl = document.createElement('div');
      clockEl.id = 'liveClock';
      clockEl.style.cssText = `
        position:fixed; top:12px; right:16px; z-index:999;
        font-family:'Space Mono',monospace; font-size:.72rem; font-weight:700;
        color:var(--text3,#94A3B8); background:var(--bg,#fff);
        padding:.2rem .55rem; border-radius:8px; border:1px solid #E2E8F0;
        letter-spacing:.03em; pointer-events:none;
      `;
      document.body.appendChild(clockEl);
    }
    _tickClock();
    if(!_clockInterval) _clockInterval = setInterval(_tickClock, 1000);
  } else {
    if(clockEl) clockEl.remove();
    if(_clockInterval){ clearInterval(_clockInterval); _clockInterval = null; }
  }
}

function _tickClock(){
  const el = document.getElementById('liveClock');
  if(!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

/* Apply saved settings on page load */
(function initSettings(){
  const prefs = _loadSettings();
  _applySettings(prefs);
  document.addEventListener('DOMContentLoaded', ()=>{
    _manageClock(prefs.showClock);
  });
})();

/* Also expose toggleDarkMode for any existing onclick references */
function toggleDarkMode(){
  const prefs = _loadSettings();
  prefs.darkMode = !prefs.darkMode;
  _saveSettings(prefs);
  _applySettings(prefs);
  showToast(prefs.darkMode ? '🌙 Dark mode on' : '☀️ Light mode on', 'success');
}

