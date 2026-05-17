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
      <div class="sticker-name">${s.description || ''}</div>
    `;
    el.title = `${s.name} — ${s.description || ''} (global #${s.number})`;
    el.addEventListener('click', (e) => toggleSticker(s, el, e));
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Long-press / right-click adiciona uma repetida
      state.counts[s.number] = (state.counts[s.number] || 0) + 1;
      saveData();
      renderCollection();
    });
    return el;
  }

  function toggleSticker(s, el, evt) {
    const current = ownedCount(s.number);
    if (current === 0) {
      state.counts[s.number] = 1;
      animateStickerGet(el, evt, s.shiny);
    } else {
      // Cicla: 0 -> 1 -> 2 -> 3 -> 0
      // tap normal alterna apenas: se já tem, remove
      delete state.counts[s.number];
    }
    saveData();
    renderCollection();
  }

  function animateStickerGet(el, evt, shiny) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const confettiBox = $('#confetti');
    // Estrelas
    const star = document.createElement('div');
    star.className = 'star-burst';
    star.style.left = cx + 'px';
    star.style.top = cy + 'px';
    star.textContent = shiny ? '🌟' : '⭐';
    confettiBox.appendChild(star);
    setTimeout(() => star.remove(), 900);
    // Confete
    const colors = ['#FFD700', '#c8102e', '#0a2463', '#fff', '#10b981'];
    const num = shiny ? 18 : 10;
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

  function renderWorldMap() {
    const map = $('#worldMap');
    // Mapa-múndi: lat/lon real convertido para equirectangular em viewBox 1000x500
    // x = (lon+180)/360*1000 ; y = (90-lat)/180*500
    const latlon = {
      CAN: [56, -106], USA: [40, -100], MEX: [23, -102], HAI: [19, -72], PAN: [8, -80], CUW: [12, -69],
      BRA: [-14, -52], ARG: [-38, -64], URU: [-33, -56], COL: [4, -74], ECU: [-1, -78], PAR: [-23, -58],
      ESP: [40, -3], FRA: [47, 2], ENG: [53, -1], GER: [51, 10], POR: [39, -8], NED: [52, 5],
      BEL: [51, 4], CRO: [45, 16], SUI: [47, 8], AUT: [47, 14], NOR: [62, 10], TUR: [39, 35],
      SCO: [57, -4], CZE: [50, 15], BIH: [44, 18], SWE: [62, 17],
      MAR: [32, -7], SEN: [14, -14], EGY: [27, 30], ALG: [28, 2], CIV: [8, -5], TUN: [34, 10],
      GHA: [8, -1], RSA: [-29, 24], CPV: [16, -24], COD: [-2, 23],
      JPN: [36, 138], KOR: [37, 128], IRN: [32, 53], AUS: [-25, 134], KSA: [24, 45], QAT: [25, 51],
      UZB: [41, 64], JOR: [31, 36], IRQ: [33, 44], NZL: [-41, 174]
    };
    const project = ([lat, lon]) => [
      Math.round((lon + 180) / 360 * 1000),
      Math.round((90 - lat) / 180 * 500)
    ];

    // Continentes (paths simplificados mas reconhecíveis em viewBox 1000x500)
    const continents = [
      // America do Norte + Groenlândia
      'M 30,103 L 70,55 L 130,42 L 230,40 L 320,40 L 390,30 L 440,40 L 420,58 L 395,72 L 375,90 L 355,108 L 340,118 L 320,130 L 305,150 L 285,165 L 280,180 L 270,200 L 250,205 L 245,222 L 278,232 L 260,228 L 230,215 L 208,205 L 188,195 L 175,170 L 165,135 L 158,118 L 145,112 L 125,108 L 100,98 L 85,85 L 60,80 L 30,103 Z',
      // America do Sul
      'M 290,217 L 322,219 L 350,233 L 380,250 L 400,265 L 395,290 L 380,315 L 362,325 L 345,344 L 330,358 L 320,380 L 312,400 L 304,408 L 298,395 L 300,370 L 297,340 L 298,310 L 290,280 L 280,255 L 286,235 L 290,217 Z',
      // Europa (sem ilhas)
      'M 478,150 L 470,140 L 465,127 L 472,115 L 488,108 L 485,98 L 478,90 L 490,76 L 525,68 L 555,55 L 600,52 L 615,68 L 620,90 L 610,108 L 595,125 L 575,140 L 555,142 L 530,140 L 515,148 L 495,152 L 478,150 Z',
      // Reino Unido
      'M 487,90 L 498,90 L 503,98 L 502,108 L 495,115 L 487,108 L 484,98 Z',
      // Irlanda
      'M 475,103 L 482,103 L 482,112 L 475,112 Z',
      // Africa
      'M 528,147 L 555,148 L 580,160 L 595,170 L 605,182 L 615,200 L 635,215 L 640,225 L 625,232 L 610,250 L 605,275 L 605,300 L 600,320 L 588,335 L 575,345 L 555,346 L 545,338 L 538,318 L 535,290 L 528,260 L 515,238 L 500,228 L 480,225 L 462,215 L 452,205 L 458,188 L 470,175 L 482,168 L 500,158 L 528,147 Z',
      // Asia
      'M 597,140 L 625,128 L 650,118 L 680,108 L 720,98 L 770,85 L 820,75 L 870,65 L 905,75 L 925,95 L 940,115 L 920,135 L 895,128 L 880,135 L 875,150 L 870,165 L 860,175 L 850,188 L 845,200 L 855,210 L 835,210 L 815,225 L 800,240 L 785,250 L 760,245 L 740,238 L 728,225 L 720,210 L 710,195 L 700,180 L 698,170 L 695,165 L 685,170 L 670,182 L 655,200 L 640,215 L 625,215 L 615,200 L 605,180 L 600,160 L 597,140 Z',
      // Indonesia
      'M 790,260 L 820,255 L 835,268 L 830,278 L 800,278 L 785,270 Z',
      // Australia
      'M 815,295 L 855,288 L 893,290 L 925,305 L 925,322 L 905,335 L 885,343 L 855,343 L 830,338 L 815,325 L 813,305 Z',
      // Nova Zelândia
      'M 950,360 L 975,355 L 982,370 L 970,378 L 953,372 Z',
      // Japão
      'M 880,150 L 895,145 L 900,160 L 890,175 L 882,168 Z',
      // Madagascar
      'M 622,300 L 632,295 L 635,315 L 625,325 L 620,315 Z'
    ];

    let svg = '<svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">';
    svg += '<rect width="1000" height="500" fill="#cfe3f4"/>';
    // Linhas de referência
    svg += '<line x1="0" y1="250" x2="1000" y2="250" stroke="#b4c9da" stroke-width="0.5" stroke-dasharray="3,3"/>'; // Equador
    svg += '<line x1="500" y1="0" x2="500" y2="500" stroke="#b4c9da" stroke-width="0.5" stroke-dasharray="3,3"/>'; // Meridiano
    continents.forEach(d => {
      svg += `<path d="${d}" fill="#e8eee5" stroke="#a8b8a4" stroke-width="0.7" stroke-linejoin="round"/>`;
    });

    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--c-blue').trim() || '#0a2463';
    window.COUNTRIES.forEach(c => {
      const ll = latlon[c.code];
      if (!ll) return;
      const [x, y] = project(ll);
      const sec = sectionsMap[c.code];
      const owned = sec.items.filter(s => isOwned(s.number)).length;
      const complete = owned === sec.items.length;
      const partial = owned > 0 && !complete;
      const fillColor = complete ? '#10b981' : (partial ? '#f59e0b' : themeColor);
      svg += `<g data-code="${c.code}" style="cursor:pointer">
        <circle cx="${x}" cy="${y}" r="11" fill="${fillColor}" stroke="#fff" stroke-width="1.8"/>
        <text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" style="pointer-events:none">${c.flag}</text>
      </g>`;
    });
    svg += '</svg>';
    map.innerHTML = svg;
    map.querySelectorAll('g[data-code]').forEach(g => {
      g.addEventListener('click', () => openCountryModal(g.dataset.code));
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

  // ---------- TABS ----------
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab-pane').forEach(p => p.hidden = (p.dataset.pane !== tab));
      if (tab === 'collection') renderCollection();
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
