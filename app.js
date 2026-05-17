// === ÁLBUM DO CAUÃ - COPA 2026 - App Principal ===

(function () {
  'use strict';

  // ---------- BOOTSTRAP ----------
  const profileName = localStorage.getItem('caua_currentProfile');
  if (!profileName) { window.location.href = 'index.html'; return; }

  const storageKey = `caua_data_${profileName}`;
  const themeKey = `caua_theme_${profileName}`;

  function loadData() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { counts: {}, sectionsCollapsed: {} };
      const parsed = JSON.parse(raw);
      return {
        counts: parsed.counts || {},
        sectionsCollapsed: parsed.sectionsCollapsed || {}
      };
    } catch (e) {
      return { counts: {}, sectionsCollapsed: {} };
    }
  }
  function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(themeKey) || '{}'); }
    catch (e) { return {}; }
  }
  function saveTheme() { localStorage.setItem(themeKey, JSON.stringify(theme)); }

  const state = loadData();
  const theme = Object.assign({ color: '#0a2463', font: "'Bebas Neue', sans-serif" }, loadTheme());

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Header
  $('#headerName').textContent = profileName;
  $('#headerAvatar').textContent = profileName.charAt(0).toUpperCase();

  // ---------- THEME ----------
  function applyTheme() {
    document.documentElement.style.setProperty('--c-blue', theme.color);
    document.documentElement.style.setProperty('--font-display', theme.font);
    document.documentElement.style.setProperty('--c-blue-deep', shadeColor(theme.color, -30));
  }
  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent);
    let b = (num & 0x0000FF) + Math.round(2.55 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  applyTheme();

  // ---------- STICKER HELPERS ----------
  function ownedCount(n) { return state.counts[n] || 0; }
  function isOwned(n) { return ownedCount(n) > 0; }
  function isDuplicate(n) { return ownedCount(n) > 1; }
  function totalOwned() {
    let c = 0;
    for (const n in state.counts) if (state.counts[n] > 0) c++;
    return c;
  }
  function totalDuplicates() {
    let c = 0;
    for (const n in state.counts) if (state.counts[n] > 1) c += (state.counts[n] - 1);
    return c;
  }

  // ---------- GROUPED DATA ----------
  // Agrupa stickers por seção
  const SECTION_ORDER = ['intro'];
  window.COUNTRIES.forEach(c => SECTION_ORDER.push(c.code));

  const sectionsMap = {};
  window.STICKERS.forEach(s => {
    if (!sectionsMap[s.section]) sectionsMap[s.section] = { name: s.sectionName, items: [], country: s.country };
    sectionsMap[s.section].items.push(s);
  });

  // Mapa código → país
  const countryByCode = {};
  window.COUNTRIES.forEach(c => countryByCode[c.code] = c);

  function sectionFlag(sec) {
    const c = countryByCode[sec];
    if (c) return c.flag;
    if (sec === 'intro') return '🏆';
    return '⚽';
  }

  // ---------- RENDER: COLEÇÃO ----------
  let currentFilter = 'all';
  let currentSearch = '';

  function matchesFilter(s) {
    const c = ownedCount(s.number);
    if (currentFilter === 'owned') return c > 0;
    if (currentFilter === 'missing') return c === 0;
    if (currentFilter === 'duplicates') return c > 1;
    return true;
  }
  function matchesSearch(s) {
    if (!currentSearch) return true;
    const q = currentSearch.toLowerCase();
    if (String(s.number).includes(q)) return true;
    if (String(s.localNumber).includes(q)) return true;
    if (s.name.toLowerCase().includes(q)) return true;
    if ((s.description || '').toLowerCase().includes(q)) return true;
    return false;
  }

  function renderCollection() {
    const container = $('#sectionsList');
    container.innerHTML = '';

    SECTION_ORDER.forEach(sec => {
      const data = sectionsMap[sec];
      if (!data) return;
      const filteredItems = data.items.filter(s => matchesFilter(s) && matchesSearch(s));
      if (filteredItems.length === 0 && (currentFilter !== 'all' || currentSearch)) return;

      const ownedInSection = data.items.filter(s => isOwned(s.number)).length;
      const totalInSection = data.items.length;
      const isComplete = ownedInSection === totalInSection;
      const collapsed = state.sectionsCollapsed[sec] === true;

      const block = document.createElement('div');
      block.className = 'section-block' + (collapsed ? ' collapsed' : '');
      block.dataset.section = sec;

      const country = countryByCode[sec];
      const groupTag = country ? `<span class="country-group-tag">Grupo ${country.group}</span>` : '';

      block.innerHTML = `
        <div class="section-header">
          <span class="section-flag">${sectionFlag(sec)}</span>
          <div class="section-info">
            <div class="section-title">${data.name} ${groupTag}</div>
            <div class="section-meta">${data.items[0].code}-01 a ${data.items[0].code}-${String(data.items.length).padStart(2,'0')}</div>
          </div>
          <div class="section-progress-mini ${isComplete ? 'complete' : ''}">${ownedInSection}/${totalInSection}</div>
          <div class="section-toggle">▼</div>
        </div>
        <div class="section-progress-bar"><div style="width:${(ownedInSection/totalInSection*100).toFixed(1)}%"></div></div>
        <div class="stickers-grid"></div>
      `;
      const grid = block.querySelector('.stickers-grid');
      filteredItems.forEach(s => grid.appendChild(buildSticker(s)));
      block.querySelector('.section-header').addEventListener('click', () => {
        state.sectionsCollapsed[sec] = !state.sectionsCollapsed[sec];
        block.classList.toggle('collapsed');
        saveData();
      });
      container.appendChild(block);
    });

    if (container.children.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--c-muted);">Nenhuma figurinha encontrada com esses filtros.</div>';
    }

    updateGlobalProgress();
  }

  function buildSticker(s) {
    const el = document.createElement('div');
    const count = ownedCount(s.number);
    el.className = 'sticker';
    if (count > 0) el.classList.add('owned');
    if (s.shiny) el.classList.add('shiny');
    if (count > 1) {
      el.classList.add('duplicate');
      el.dataset.count = '+' + (count - 1);
    }
    const flag = s.country ? countryByCode[s.country].flag : sectionFlag(s.section);
    el.innerHTML = `
      <div class="flag-mini">${flag}</div>
      <div class="sticker-code">${s.code}</div>
      <div class="sticker-num">${String(s.localNumber).padStart(2,'0')}</div>
      ${count > 1 ? `<button class="dup-minus" type="button" aria-label="Tirar uma repetida (troquei)">−</button>` : ''}
      ${count > 1 ? `<span class="dup-badge">+${count-1}</span>` : ''}
    `;
    el.title = `${s.name} — toque pra colar · toque de novo vira repetida · botão − tira repetida (quando troquei)`;
    const minusBtn = el.querySelector('.dup-minus');
    if (minusBtn) {
      minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cur = ownedCount(s.number);
        if (cur > 1) {
          state.counts[s.number] = cur - 1;
          saveData();
          renderCollection();
          if (navigator.vibrate) navigator.vibrate(20);
        }
      });
      minusBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      minusBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    let pressTimer = null;
    let longPressed = false;
    const startPress = (e) => {
      longPressed = false;
      pressTimer = setTimeout(() => {
        longPressed = true;
        // Long-press: decrementa
        const cur = ownedCount(s.number);
        if (cur > 0) {
          if (cur === 1) delete state.counts[s.number];
          else state.counts[s.number] = cur - 1;
          saveData();
          renderCollection();
          if (navigator.vibrate) navigator.vibrate(40);
        }
      }, 600);
    };
    const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
    el.addEventListener('mousedown', startPress);
    el.addEventListener('touchstart', startPress, { passive: true });
    el.addEventListener('mouseup', cancelPress);
    el.addEventListener('mouseleave', cancelPress);
    el.addEventListener('touchend', cancelPress);
    el.addEventListener('touchcancel', cancelPress);

    el.addEventListener('click', (e) => {
      if (longPressed) { longPressed = false; return; }
      incrementSticker(s, el, e);
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cur = ownedCount(s.number);
      if (cur > 0) {
        if (cur === 1) delete state.counts[s.number];
        else state.counts[s.number] = cur - 1;
        saveData();
        renderCollection();
      }
    });
    return el;
  }

  function incrementSticker(s, el, evt) {
    const current = ownedCount(s.number);
    const next = current + 1;
    if (next > 9) return; // máximo 9 (1 colada + 8 repetidas)
    state.counts[s.number] = next;
    if (current === 0) animateStickerGet(el, evt, s.shiny, false);
    else animateStickerGet(el, evt, s.shiny, true); // animação de "repetida"
    saveData();
    renderCollection();
  }

  function animateStickerGet(el, evt, shiny, isDuplicate) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const confettiBox = $('#confetti');
    const star = document.createElement('div');
    star.className = 'star-burst';
    star.style.left = cx + 'px';
    star.style.top = cy + 'px';
    star.textContent = isDuplicate ? '➕' : (shiny ? '🌟' : '⭐');
    confettiBox.appendChild(star);
    setTimeout(() => star.remove(), 900);
    const colors = ['#FFD700', '#d4444a', '#4a8ec6', '#fff', '#54a96d', '#f06a25', '#5d4a9c'];
    const num = isDuplicate ? 6 : (shiny ? 18 : 10);
    for (let i = 0; i < num; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      p.style.setProperty('--dy', (Math.random() * -180 - 40) + 'px');
      p.style.borderRadius = (Math.random() > .5 ? '50%' : '2px');
      confettiBox.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  function updateGlobalProgress() {
    const owned = totalOwned();
    const total = window.STICKERS_TOTAL;
    const pct = (owned / total * 100);
    $('#globalProgressBar').style.width = pct.toFixed(1) + '%';
    const dup = totalDuplicates();
    $('#headerProgress').textContent = `${owned} / ${total}${dup ? ' • ' + dup + ' rep.' : ''}`;
  }

  // ---------- RENDER: PAÍSES ----------
  function renderCountries() {
    const grid = $('#countriesGrid');
    grid.innerHTML = '';
    window.COUNTRIES.forEach(c => {
      const sec = sectionsMap[c.code];
      const owned = sec.items.filter(s => isOwned(s.number)).length;
      const total = sec.items.length;
      const complete = owned === total;
      const card = document.createElement('div');
      card.className = 'country-card' + (complete ? ' complete' : '');
      card.innerHTML = `
        <div class="country-flag">${c.flag}</div>
        <div class="country-name">${c.name}</div>
        <div class="country-progress ${complete ? 'complete' : ''}">${owned}/${total}</div>
        <span class="country-group-tag">Grupo ${c.group}</span>
      `;
      card.addEventListener('click', () => openCountryModal(c.code));
      grid.appendChild(card);
    });
  }

  // FIFA 3-letter → ISO 3166-1 alpha-2 (lowercase, como no SVG)
  const FIFA_TO_ISO = {
    CAN: 'ca', USA: 'us', MEX: 'mx', HAI: 'ht', PAN: 'pa', CUW: 'cw',
    BRA: 'br', ARG: 'ar', URU: 'uy', COL: 'co', ECU: 'ec', PAR: 'py',
    ESP: 'es', FRA: 'fr', ENG: 'gb', GER: 'de', POR: 'pt', NED: 'nl',
    BEL: 'be', CRO: 'hr', SUI: 'ch', AUT: 'at', NOR: 'no', TUR: 'tr',
    SCO: 'gb', CZE: 'cz', BIH: 'ba', SWE: 'se',
    MAR: 'ma', SEN: 'sn', EGY: 'eg', ALG: 'dz', CIV: 'ci', TUN: 'tn',
    GHA: 'gh', RSA: 'za', CPV: 'cv', COD: 'cd',
    JPN: 'jp', KOR: 'kr', IRN: 'ir', AUS: 'au', KSA: 'sa', QAT: 'qa',
    UZB: 'uz', JOR: 'jo', IRQ: 'iq', NZL: 'nz'
  };

  function renderWorldMap() {
    const map = $('#worldMap');
    if (!window.WORLD_MAP_SVG) {
      map.innerHTML = '<div style="padding:40px;text-align:center;color:var(--c-red)">Não consegui carregar o mapa.</div>';
      return;
    }
    map.innerHTML = window.WORLD_MAP_SVG;
    const svg = map.querySelector('svg');
    if (!svg) return;
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.maxHeight = '70vh';

    // Estado de cada país participante
    const stateByIso = {};
    window.COUNTRIES.forEach(c => {
      const iso = FIFA_TO_ISO[c.code];
      if (!iso) return;
      const sec = sectionsMap[c.code];
      const owned = sec.items.filter(s => isOwned(s.number)).length;
      const total = sec.items.length;
      const complete = owned === total;
      const partial = owned > 0 && !complete;
      const cls = complete ? 'wm-complete' : (partial ? 'wm-partial' : 'wm-participating');
      if (!stateByIso[iso]) stateByIso[iso] = { codes: [], cls };
      stateByIso[iso].codes.push(c.code);
      // País mais avançado define a cor
      if (complete) stateByIso[iso].cls = 'wm-complete';
      else if (partial && stateByIso[iso].cls !== 'wm-complete') stateByIso[iso].cls = 'wm-partial';
    });

    // Colore os caminhos dos países participantes (e seus filhos)
    Object.keys(stateByIso).forEach(iso => {
      const els = svg.querySelectorAll(`#${iso}, [id="${iso}"]`);
      els.forEach(el => {
        el.classList.add('wm-country', stateByIso[iso].cls);
        el.style.cursor = 'pointer';
        const code = stateByIso[iso].codes[0];
        const country = countryByCode[code];
        el.addEventListener('click', () => openCountryModal(code));
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${country.flag} ${country.name} (Grupo ${country.group})`;
        el.appendChild(title);
      });
    });
  }

  function openCountryModal(code) {
    const c = countryByCode[code];
    const sec = sectionsMap[code];
    const owned = sec.items.filter(s => isOwned(s.number)).length;
    const total = sec.items.length;
    const pct = (owned / total * 100).toFixed(0);

    const body = $('#countryModalBody');
    body.innerHTML = `
      <div class="country-modal-header">
        <div class="country-modal-flag">${c.flag}</div>
        <div class="country-modal-name">${c.name}</div>
        <div class="country-modal-meta">${c.confederation} · Grupo ${c.group}</div>
      </div>
      <div class="country-modal-progress">
        ${owned} de ${total} figurinhas (${pct}%)
        <div class="country-modal-progress-bar"><div style="width:${pct}%"></div></div>
      </div>
      <div class="stickers-grid" id="modalStickerGrid"></div>
    `;
    const grid = body.querySelector('#modalStickerGrid');
    sec.items.forEach(s => grid.appendChild(buildSticker(s)));
    $('#countryModal').hidden = false;
  }

  // ---------- RENDER: JOGOS ----------
  let currentPhase = 'all';
  let currentCountryFilter = '';

  function fillCountryFilter() {
    const sel = $('#countryFilter');
    window.COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = `${c.flag} ${c.name}`;
      sel.appendChild(opt);
    });
  }

  function getMatchDateObj(m) {
    return new Date(`${m.date}T${m.time}:00-03:00`);
  }

  function teamHTML(code, label) {
    if (code) {
      const c = countryByCode[code];
      return `<span class="match-team"><span class="flag-mini">${c.flag}</span>${c.name}</span>`;
    }
    return `<span class="match-team" style="color:var(--c-muted)"><span class="flag-mini">❓</span>${label || '?'}</span>`;
  }

  function renderSchedule() {
    const list = $('#matchesList');
    list.innerHTML = '';
    const filtered = window.SCHEDULE.filter(m => {
      if (currentPhase !== 'all' && m.phase !== currentPhase) return false;
      if (currentCountryFilter && m.homeCode !== currentCountryFilter && m.awayCode !== currentCountryFilter) return false;
      return true;
    });

    // Próximo jogo
    const now = new Date();
    const nextBox = $('#nextMatch');
    if (currentPhase === 'all' && !currentCountryFilter) {
      const upcoming = window.SCHEDULE.find(m => getMatchDateObj(m) >= now);
      if (upcoming) {
        nextBox.style.display = '';
        nextBox.innerHTML = `<div class="next-match-label">⏭ PRÓXIMO JOGO</div>` + matchCardHTML(upcoming);
      } else {
        nextBox.style.display = 'none';
      }
    } else {
      nextBox.style.display = 'none';
    }

    if (filtered.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--c-muted)">Nenhum jogo encontrado.</div>';
      return;
    }
    filtered.forEach(m => {
      list.insertAdjacentHTML('beforeend', matchCardHTML(m));
    });
  }

  function matchCardHTML(m) {
    const d = getMatchDateObj(m);
    const day = d.getDate();
    const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const month = months[d.getMonth()];
    return `
      <div class="match-card">
        <div class="match-date">
          <div class="match-day">${day}</div>
          <div class="match-month">${month}</div>
          <div class="match-time">${m.time}</div>
        </div>
        <div class="match-teams">
          ${teamHTML(m.homeCode, m.homeLabel)}
          <span class="match-vs">×</span>
          ${teamHTML(m.awayCode, m.awayLabel)}
        </div>
        <div class="match-meta">
          <div class="match-phase">${m.round || m.phase}</div>
          <div class="match-venue">${m.venue || ''}</div>
        </div>
      </div>
    `;
  }

  // ---------- DASHBOARD ----------
  function renderDashboard() {
    const owned = totalOwned();
    const total = window.STICKERS_TOTAL;
    const dup = totalDuplicates();
    const missing = total - owned;
    const pct = (owned / total * 100).toFixed(1);

    // por país
    const byCountry = window.COUNTRIES.map(c => {
      const sec = sectionsMap[c.code];
      const cOwned = sec.items.filter(s => isOwned(s.number)).length;
      const cTotal = sec.items.length;
      return {
        ...c,
        owned: cOwned,
        total: cTotal,
        missing: cTotal - cOwned,
        pct: cOwned / cTotal * 100
      };
    });
    const completed = byCountry.filter(c => c.missing === 0).length;
    const almostDone = byCountry.filter(c => c.missing > 0 && c.missing <= 3).sort((a,b) => a.missing - b.missing);
    const inProgress = byCountry.filter(c => c.missing > 3 && c.owned > 0).sort((a,b) => b.pct - a.pct);
    const notStarted = byCountry.filter(c => c.owned === 0);

    const row = (c) => `
      <div class="country-missing-row" data-code="${c.code}">
        <span class="flag">${c.flag}</span>
        <div style="flex:1;min-width:0">
          <div class="name">${c.name} <span class="country-group-tag">${c.group}</span></div>
          <div class="progress-mini" style="margin-top:4px"><div style="width:${c.pct}%"></div></div>
        </div>
        <span class="count">${c.owned}/${c.total}${c.missing>0?' · faltam '+c.missing:' ✓'}</span>
      </div>
    `;

    const html = `
      <div class="dashboard-stats">
        <div class="stat-card big">
          <div class="stat-value">${pct}%</div>
          <div class="stat-label">do álbum completo</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--p-green)">${owned}</div>
          <div class="stat-label">figurinhas coladas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--p-red)">${missing}</div>
          <div class="stat-label">faltam</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--p-purple)">${dup}</div>
          <div class="stat-label">repetidas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--p-blue)">${completed}/48</div>
          <div class="stat-label">seleções completas</div>
        </div>
      </div>

      ${almostDone.length ? `
        <div class="dashboard-section">
          <h3>🔥 Quase lá (faltam até 3)</h3>
          ${almostDone.map(row).join('')}
        </div>
      ` : ''}

      ${inProgress.length ? `
        <div class="dashboard-section">
          <h3>📈 Em andamento</h3>
          ${inProgress.map(row).join('')}
        </div>
      ` : ''}

      ${notStarted.length ? `
        <div class="dashboard-section">
          <h3>🆕 Ainda não comecei</h3>
          ${notStarted.map(row).join('')}
        </div>
      ` : ''}
    `;
    $('#dashboardContent').innerHTML = html;
    $$('#dashboardContent .country-missing-row').forEach(r => {
      r.addEventListener('click', () => openCountryModal(r.dataset.code));
    });
  }

  // ---------- TABS ----------
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab-pane').forEach(p => p.hidden = (p.dataset.pane !== tab));
      if (tab === 'collection') renderCollection();
      if (tab === 'dashboard') renderDashboard();
      if (tab === 'countries') { renderCountries(); renderWorldMap(); }
      if (tab === 'schedule') renderSchedule();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ---------- FILTROS ----------
  $('#filterChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    $$('#filterChips .chip').forEach(c => c.classList.toggle('active', c === chip));
    renderCollection();
  });
  $('#searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderCollection();
  });
  $('#phaseChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    currentPhase = chip.dataset.phase;
    $$('#phaseChips .chip').forEach(c => c.classList.toggle('active', c === chip));
    renderSchedule();
  });
  $('#countryFilter').addEventListener('change', (e) => {
    currentCountryFilter = e.target.value;
    renderSchedule();
  });

  // Toggle mapa / grid
  $('.map-toggle').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.map-toggle .chip').forEach(c => c.classList.toggle('active', c === chip));
    const view = chip.dataset.view;
    $('#countriesGrid').hidden = (view !== 'grid');
    $('#worldMap').hidden = (view !== 'map');
    $('#worldMapLegend').hidden = (view !== 'map');
    if (view === 'map') renderWorldMap();
  });

  // ---------- MODAIS (com delegação global pra evitar bugs) ----------
  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.hidden = true);
  }
  // Click delegation - funciona pra qualquer modal/botão de fechar
  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close')) {
      e.preventDefault();
      e.stopPropagation();
      closeAllModals();
      return;
    }
    // Click no fundo escuro fecha o modal
    if (e.target.classList && e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
  // Touch também (pra mobile, alguns navegadores)
  document.addEventListener('touchend', (e) => {
    if (e.target.closest('.modal-close')) {
      e.preventDefault();
      closeAllModals();
    }
  });
  // ESC fecha qualquer modal aberto
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeAllModals();
    }
  });

  // ---------- SETTINGS ----------
  $('#settingsBtn').addEventListener('click', () => {
    $('#settingsProfileName').textContent = profileName;
    $('#settingsModal').hidden = false;
  });
  $('#logoutBtn').addEventListener('click', () => {
    if (confirm('Sair do perfil de ' + profileName + '?')) {
      localStorage.removeItem('caua_currentProfile');
      window.location.href = 'index.html';
    }
  });

  // Color swatches
  const COLORS = ['#0a2463', '#c8102e', '#10b981', '#ff6b35', '#7b2cbf', '#000', '#ffd700'];
  const colorBox = $('#colorOptions');
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c === theme.color ? ' active' : '');
    sw.style.background = c;
    sw.addEventListener('click', () => {
      theme.color = c;
      saveTheme();
      applyTheme();
      $$('.color-swatch').forEach(s => s.classList.toggle('active', s === sw));
    });
    colorBox.appendChild(sw);
  });

  $('#fontSelect').value = theme.font;
  $('#fontSelect').addEventListener('change', (e) => {
    theme.font = e.target.value;
    saveTheme();
    applyTheme();
  });

  // Export
  $('#exportBtn').addEventListener('click', () => {
    const data = {
      profile: profileName,
      exportedAt: new Date().toISOString(),
      version: 1,
      counts: state.counts
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `album-caua-${profileName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Import
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.counts) throw new Error('formato inválido');
        if (!confirm('Importar coleção? Isso substituirá suas figurinhas atuais.')) return;
        state.counts = data.counts;
        saveData();
        renderCollection();
        alert('Coleção importada com sucesso!');
      } catch (err) {
        alert('Arquivo inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Reset
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que quer zerar TODAS as figurinhas de ' + profileName + '? Esta ação não pode ser desfeita.')) {
      state.counts = {};
      saveData();
      renderCollection();
      $('#settingsModal').hidden = true;
    }
  });

  // ---------- INIT ----------
  fillCountryFilter();
  renderCollection();
})();
