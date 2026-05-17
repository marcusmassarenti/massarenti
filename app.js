// === ÁLBUM DO CAUÃ - COPA 2026 - App Principal ===

(function () {
  'use strict';

  // ---------- BOOTSTRAP ----------
  const profileName = localStorage.getItem('caua_currentProfile');
  if (!profileName) { window.location.href = 'index.html'; return; }

  const storageKey = `caua_data_${profileName}`;
  const themeKey = `caua_theme_${profileName}`;
  const storedPin = localStorage.getItem('caua_currentPin') || '';

  // Cliente Supabase
  let supabaseClient = null;
  try {
    if (window.SUPABASE_CONFIG && window.supabase) {
      supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );
    }
  } catch (e) { console.warn('Supabase indisponível, modo local', e); }

  function loadData() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { counts: {}, sectionsCollapsed: {}, scores: {} };
      const parsed = JSON.parse(raw);
      return {
        counts: parsed.counts || {},
        sectionsCollapsed: parsed.sectionsCollapsed || {},
        scores: parsed.scores || {}
      };
    } catch (e) {
      return { counts: {}, sectionsCollapsed: {}, scores: {} };
    }
  }
  // Grupo atualmente selecionado (salvo localmente)
  let selectedGroupCode = localStorage.getItem('caua_selectedGroup') || '';
  function setSelectedGroup(code) {
    selectedGroupCode = code || '';
    localStorage.setItem('caua_selectedGroup', selectedGroupCode);
  }

  // Salva local SEMPRE imediato. Sincroniza com nuvem com debounce curto.
  let _syncTimer = null;
  let _hasPendingSync = false;
  function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem(storageKey + '_updated', new Date().toISOString());
    if (supabaseClient && !viewMode) {
      _hasPendingSync = true;
      setCloudStatus('syncing', 'Aguardando sync...');
      clearTimeout(_syncTimer);
      _syncTimer = setTimeout(syncToCloud, 300);
    }
  }

  async function syncToCloud(immediate) {
    if (!supabaseClient || viewMode) return;
    if (!_hasPendingSync && !immediate) return;
    setCloudStatus('syncing', 'Salvando na nuvem...');
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          counts: state.counts,
          scores: state.scores,
          updated_at: new Date().toISOString()
        })
        .eq('name', profileName);
      if (error) {
        console.warn('Sync error:', error);
        setCloudStatus('error', 'Erro ao salvar: ' + error.message);
      } else {
        _hasPendingSync = false;
        setCloudStatus('ok', 'Salvo na nuvem · ' + new Date().toLocaleTimeString('pt-BR'));
      }
    } catch (e) {
      console.warn('Sync failed:', e);
      setCloudStatus('error', 'Erro: ' + (e.message || 'desconhecido'));
    }
  }

  // Força sincronizar quando o app perde foco / o usuário fecha
  function forceSyncOnExit() {
    if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
    if (_hasPendingSync) syncToCloud(true);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') forceSyncOnExit();
  });
  window.addEventListener('pagehide', forceSyncOnExit);
  window.addEventListener('beforeunload', forceSyncOnExit);

  // Aviso visual se tem mudanças pendentes sem sync (impede perda)
  window.addEventListener('beforeunload', (e) => {
    if (_hasPendingSync) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  async function loadFromCloud() {
    if (!supabaseClient) return false;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('name', profileName)
        .maybeSingle();
      if (error) { console.warn(error); setCloudStatus('error', 'Erro: ' + error.message); return false; }
      if (data) {
        // Verifica timestamps: usa o mais recente (local vs nuvem)
        const cloudTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
        const localTimeRaw = localStorage.getItem(storageKey + '_updated');
        const localTime = localTimeRaw ? new Date(localTimeRaw).getTime() : 0;
        const cloudOwned = Object.values(data.counts || {}).filter(v => v > 0).length;
        const localOwned = Object.values(state.counts || {}).filter(v => v > 0).length;

        if (cloudTime > localTime || (cloudOwned > localOwned && localTime === 0)) {
          // Nuvem é mais nova → usa
          state.counts = data.counts || {};
          state.scores = data.scores || {};
          localStorage.setItem(storageKey, JSON.stringify(state));
          localStorage.setItem(storageKey + '_updated', data.updated_at || new Date().toISOString());
          setCloudStatus('ok', 'Carregado da nuvem');
          return true;
        } else if (localTime > cloudTime && _hasPendingSync !== false) {
          // Local é mais novo → empurra pra nuvem
          _hasPendingSync = true;
          syncToCloud(true);
          setCloudStatus('syncing', 'Enviando local pra nuvem...');
          return false;
        }
        setCloudStatus('ok', 'Já sincronizado');
        return true;
      }
      setCloudStatus('ok', 'Conectado (sem dados ainda)');
    } catch (e) {
      console.warn(e);
      setCloudStatus('error', 'Sem conexão: ' + (e.message || 'erro'));
    }
    return false;
  }

  async function loadFamilyProfiles(names) {
    if (!supabaseClient) return [];
    try {
      let query = supabaseClient
        .from('profiles')
        .select('name, counts, scores, updated_at');
      if (names && names.length > 0) query = query.in('name', names);
      const { data, error } = await query.order('name');
      if (error) { console.warn(error); return []; }
      return data || [];
    } catch (e) { console.warn(e); return []; }
  }

  // ===== GRUPOS =====
  function generateGroupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres confusos
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
  async function loadMyGroups() {
    if (!supabaseClient) return [];
    try {
      const { data: memberships } = await supabaseClient
        .from('group_members')
        .select('group_code')
        .eq('profile_name', profileName);
      if (!memberships || memberships.length === 0) return [];
      const codes = memberships.map(m => m.group_code);
      const { data: groups } = await supabaseClient
        .from('groups')
        .select('*')
        .in('code', codes);
      return groups || [];
    } catch (e) { console.warn(e); return []; }
  }
  async function loadAllGroups() {
    if (!supabaseClient) return [];
    try {
      const { data } = await supabaseClient.from('groups').select('*').order('created_at');
      return data || [];
    } catch (e) { console.warn(e); return []; }
  }
  async function loadGroupRequestsByMe() {
    if (!supabaseClient) return [];
    const { data } = await supabaseClient
      .from('group_requests')
      .select('group_code')
      .eq('profile_name', profileName);
    return (data || []).map(r => r.group_code);
  }
  async function loadPendingRequests(groupCode) {
    if (!supabaseClient) return [];
    const { data } = await supabaseClient
      .from('group_requests')
      .select('profile_name, requested_at')
      .eq('group_code', groupCode)
      .order('requested_at');
    return data || [];
  }
  async function loadMemberCount(groupCode) {
    if (!supabaseClient) return 0;
    const { count } = await supabaseClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_code', groupCode);
    return count || 0;
  }
  async function requestJoinGroup(code) {
    if (!supabaseClient) return { ok: false, error: 'Sem conexão' };
    const { error } = await supabaseClient
      .from('group_requests')
      .insert({ group_code: code, profile_name: profileName });
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }
  async function cancelJoinRequest(code) {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient
      .from('group_requests')
      .delete()
      .eq('group_code', code)
      .eq('profile_name', profileName);
    return !error;
  }
  async function approveRequest(groupCode, name) {
    if (!supabaseClient) return false;
    // Adiciona como membro + remove da request
    const { error: e1 } = await supabaseClient
      .from('group_members')
      .insert({ group_code: groupCode, profile_name: name });
    if (e1 && !String(e1.message).toLowerCase().includes('duplicate')) {
      console.warn(e1); return false;
    }
    await supabaseClient
      .from('group_requests')
      .delete()
      .eq('group_code', groupCode)
      .eq('profile_name', name);
    return true;
  }
  async function denyRequest(groupCode, name) {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient
      .from('group_requests')
      .delete()
      .eq('group_code', groupCode)
      .eq('profile_name', name);
    return !error;
  }
  async function loadGroupMembers(groupCode) {
    if (!supabaseClient) return [];
    try {
      const { data: members } = await supabaseClient
        .from('group_members')
        .select('profile_name')
        .eq('group_code', groupCode);
      if (!members) return [];
      const names = members.map(m => m.profile_name);
      return await loadFamilyProfiles(names);
    } catch (e) { console.warn(e); return []; }
  }
  async function createGroup(name) {
    if (!supabaseClient) return null;
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    // Tenta criar com código único
    for (let i = 0; i < 5; i++) {
      const code = generateGroupCode();
      const { error: groupErr } = await supabaseClient
        .from('groups')
        .insert({ code, name: trimmed, created_by: profileName });
      if (!groupErr) {
        // Adiciona o criador como membro
        await supabaseClient.from('group_members').insert({ group_code: code, profile_name: profileName });
        return { code, name: trimmed };
      }
    }
    return null;
  }
  async function joinGroup(code) {
    if (!supabaseClient) return { ok: false, error: 'Sem conexão' };
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return { ok: false, error: 'Código vazio' };
    const { data: g } = await supabaseClient.from('groups').select('*').eq('code', trimmed).maybeSingle();
    if (!g) return { ok: false, error: 'Grupo não encontrado. Confira o código.' };
    const { error } = await supabaseClient
      .from('group_members')
      .insert({ group_code: trimmed, profile_name: profileName });
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return { ok: false, error: error.message };
    }
    return { ok: true, group: g };
  }
  async function leaveGroup(code) {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient
      .from('group_members')
      .delete()
      .eq('group_code', code)
      .eq('profile_name', profileName);
    return !error;
  }
  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(themeKey) || '{}'); }
    catch (e) { return {}; }
  }
  function saveTheme() { localStorage.setItem(themeKey, JSON.stringify(theme)); }

  const state = loadData();
  const theme = Object.assign({ color: '#0a2463', font: "'Bebas Neue', sans-serif" }, loadTheme());

  // ===== MODO VIEW (visualizar álbum de outra pessoa) =====
  let viewMode = false;
  let viewerName = profileName;
  let viewedName = profileName;
  const urlParams = new URLSearchParams(window.location.search);
  const viewCode = urlParams.get('view');

  function encodeAlbumState() {
    const counts = [];
    for (let i = 1; i <= 980; i++) {
      counts.push(Math.min(9, state.counts[i] || 0).toString(16));
    }
    const scoresArr = [];
    Object.keys(state.scores || {}).forEach(id => {
      const sc = state.scores[id];
      let s = `${id},${sc.home},${sc.away}`;
      if (sc.penaltyWinner) s += ',' + (sc.penaltyWinner === 'home' ? 'h' : 'a');
      scoresArr.push(s);
    });
    const data = { n: profileName, c: counts.join(''), s: scoresArr.join('|') };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  function decodeAlbumState(b64) {
    const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    const counts = {};
    for (let i = 0; i < data.c.length; i++) {
      const v = parseInt(data.c[i], 16);
      if (v > 0) counts[i + 1] = v;
    }
    const scores = {};
    if (data.s) {
      data.s.split('|').filter(Boolean).forEach(s => {
        const parts = s.split(',');
        const sc = { home: parseInt(parts[1], 10), away: parseInt(parts[2], 10) };
        if (parts[3] === 'h') sc.penaltyWinner = 'home';
        if (parts[3] === 'a') sc.penaltyWinner = 'away';
        scores[parts[0]] = sc;
      });
    }
    return { name: data.n, counts, scores };
  }

  if (viewCode) {
    try {
      const view = decodeAlbumState(viewCode);
      state.counts = view.counts;
      state.scores = view.scores;
      viewedName = view.name;
      viewMode = true;
      document.body.classList.add('view-mode');
    } catch (e) { console.error('Código inválido', e); }
  }

  // saveData fica no-op quando em view mode
  if (viewMode) {
    saveData = () => {};
  }

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---------- TOAST (notificação não-bloqueante) ----------
  function showToast(msg, type = 'info', duration = 2500) {
    let host = document.getElementById('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  // Header
  $('#headerName').textContent = viewMode ? `Vendo: ${viewedName}` : profileName;
  $('#headerAvatar').textContent = (viewMode ? viewedName : profileName).charAt(0).toUpperCase();

  // Indicador da nuvem
  function setCloudStatus(status, msg) {
    const ind = $('#cloudStatus');
    if (!ind) return;
    ind.dataset.status = status;
    ind.title = msg || '';
    if (status === 'ok') ind.textContent = '☁️';
    else if (status === 'syncing') ind.textContent = '⏳';
    else if (status === 'offline') ind.textContent = '📴';
    else if (status === 'error') ind.textContent = '⚠️';
  }
  if (!$('#cloudStatus')) {
    const ind = document.createElement('span');
    ind.id = 'cloudStatus';
    ind.className = 'cloud-status';
    $('.header-right').insertBefore(ind, $('.header-right').firstChild);
  }
  setCloudStatus(supabaseClient ? 'syncing' : 'offline', supabaseClient ? 'Conectando à nuvem...' : 'Sem nuvem (só local)');

  // Banner de view mode + botão flutuante de "voltar"
  if (viewMode) {
    const banner = document.createElement('div');
    banner.className = 'view-banner';
    banner.innerHTML = `
      👀 Vendo álbum de <strong>${viewedName}</strong> · só leitura
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    // Botão flutuante "voltar ao meu álbum"
    const back = document.createElement('a');
    back.href = 'app.html';
    back.className = 'view-back-btn';
    back.innerHTML = '← Voltar ao meu álbum';
    document.body.appendChild(back);
  }

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

    // Quando não há busca/filtro, mostra GRID de cards de seleções (UX celular)
    if (!currentSearch && currentFilter === 'all') {
      renderCollectionGrid(container);
      updateGlobalProgress();
      return;
    }

    SECTION_ORDER.forEach(sec => {
      const data = sectionsMap[sec];
      if (!data) return;
      const filteredItems = data.items.filter(s => matchesFilter(s) && matchesSearch(s));
      if (filteredItems.length === 0) return;

      const ownedInSection = data.items.filter(s => isOwned(s.number)).length;
      const totalInSection = data.items.length;
      const isComplete = ownedInSection === totalInSection;

      const block = document.createElement('div');
      block.className = 'section-block';
      block.dataset.section = sec;

      const country = countryByCode[sec];
      const groupTag = country ? `<span class="country-group-tag">Grupo ${country.group}</span>` : '';

      block.innerHTML = `
        <div class="section-header">
          <span class="section-flag">${sectionFlag(sec)}</span>
          <div class="section-info">
            <div class="section-title">${data.name} ${groupTag}</div>
            <div class="section-meta">${data.items[0].code}-${String(data.items[0].localNumber).padStart(2,'0')} a ${data.items[0].code}-${String(data.items[data.items.length-1].localNumber).padStart(2,'0')}</div>
          </div>
          <div class="section-progress-mini ${isComplete ? 'complete' : ''}">${ownedInSection}/${totalInSection}</div>
        </div>
        <div class="section-progress-bar"><div style="width:${(ownedInSection/totalInSection*100).toFixed(1)}%"></div></div>
        <div class="stickers-grid"></div>
      `;
      const grid = block.querySelector('.stickers-grid');
      filteredItems.forEach(s => grid.appendChild(buildSticker(s)));
      container.appendChild(block);
    });

    if (container.children.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--c-muted);">Nenhuma figurinha encontrada com esses filtros.</div>';
    }
    updateGlobalProgress();
  }

  function renderCollectionGrid(container) {
    const grid = document.createElement('div');
    grid.className = 'collection-grid';
    SECTION_ORDER.forEach(sec => {
      const data = sectionsMap[sec];
      if (!data) return;
      const owned = data.items.filter(s => isOwned(s.number)).length;
      const total = data.items.length;
      const dup = data.items.reduce((acc, s) => acc + Math.max(0, ownedCount(s.number) - 1), 0);
      const complete = owned === total;
      const partial = owned > 0 && !complete;
      const country = countryByCode[sec];
      const groupTag = country ? `<span class="country-group-tag">Grupo ${country.group}</span>` : '<span class="country-group-tag" style="background:var(--p-purple)">INTRO</span>';
      const card = document.createElement('div');
      card.className = 'collection-card' + (complete ? ' complete' : partial ? ' partial' : '');
      card.innerHTML = `
        <div class="cc-flag">${sectionFlag(sec)}</div>
        <div class="cc-info">
          <div class="cc-name">${data.name}</div>
          ${groupTag}
        </div>
        <div class="cc-stats">
          <div class="cc-stat-main">${owned}<span class="cc-divider">/${total}</span></div>
          ${dup > 0 ? `<div class="cc-stat-dup">🔁 ${dup} rep.</div>` : ''}
        </div>
        <div class="cc-progress"><div style="width:${(owned/total*100).toFixed(1)}%"></div></div>
      `;
      card.addEventListener('click', () => {
        if (sec === 'intro') {
          // Para o intro, abre modal especial
          openIntroModal();
        } else {
          openCountryModal(sec);
        }
      });
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function openIntroModal() {
    currentOpenCountry = '__intro__';
    const sec = sectionsMap.intro;
    const owned = sec.items.filter(s => isOwned(s.number)).length;
    const total = sec.items.length;
    const pct = (owned / total * 100).toFixed(0);
    const body = $('#countryModalBody');
    body.innerHTML = `
      <div class="country-modal-header">
        <div class="country-modal-flag">🏆</div>
        <div class="country-modal-name">Introdução</div>
        <div class="country-modal-meta">Mascotes, estádios e oficial</div>
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
      ${count > 0 ? `<button class="sticker-remove" type="button" aria-label="Desmarcar (errei)">✗</button>` : ''}
      ${count > 1 ? `<button class="dup-minus" type="button" aria-label="Tirar uma repetida (troquei)">−</button>` : ''}
      ${count > 1 ? `<span class="dup-badge">+${count-1}</span>` : ''}
    `;
    el.title = `${s.name} — toque pra colar · de novo vira repetida · botão ✗ desmarca · botão − tira uma repetida`;
    const minusBtn = el.querySelector('.dup-minus');
    if (minusBtn) {
      const handleMinus = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const cur = ownedCount(s.number);
        if (cur > 1) {
          state.counts[s.number] = cur - 1;
          saveData();
          renderCollection();
          if (!$('#countryModal').hidden) renderCountryModalContent();
          if (navigator.vibrate) navigator.vibrate(20);
        }
      };
      minusBtn.addEventListener('click', handleMinus);
      // Bloqueia bubbling em todos os eventos relacionados (pra não disparar o sticker)
      ['mousedown','touchstart','touchend','pointerdown'].forEach(evt => {
        minusBtn.addEventListener(evt, (e) => e.stopPropagation(), { passive: false });
      });
    }
    const removeBtn = el.querySelector('.sticker-remove');
    if (removeBtn) {
      const handleRemove = (e) => {
        e.stopPropagation();
        e.preventDefault();
        delete state.counts[s.number];
        saveData();
        renderCollection();
        if (!$('#countryModal').hidden) renderCountryModalContent();
        if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
      };
      removeBtn.addEventListener('click', handleRemove);
      ['mousedown','touchstart','touchend','pointerdown'].forEach(evt => {
        removeBtn.addEventListener(evt, (e) => e.stopPropagation(), { passive: false });
      });
    }

    if (viewMode) return el; // view mode: sem interação

    el.addEventListener('click', (e) => {
      // Botões ✗ e − já tem stopPropagation; aqui é só o tap principal
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
    else animateStickerGet(el, evt, s.shiny, true);
    saveData();
    renderCollection();
    if (!$('#countryModal').hidden) renderCountryModalContent();
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

  let showMapFlags = false; // No mapa mundi, padrão é SEM bandeiras coladas (só o mapa)
  function renderWorldMap(container) {
    const map = container || $('#worldMap');
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
    // Salva o viewBox original pra reset
    if (!svg.dataset.originalViewBox) {
      svg.dataset.originalViewBox = svg.getAttribute('viewBox') || '0 0 1000 510';
    }
    attachMapPanZoom(svg, map);

    // Estado de cada país
    const stateByIso = {};
    window.COUNTRIES.forEach(c => {
      const iso = FIFA_TO_ISO[c.code];
      if (!iso) return;
      const sec = sectionsMap[c.code];
      const owned = sec.items.filter(s => isOwned(s.number)).length;
      const total = sec.items.length;
      const complete = owned === total;
      const partial = owned > 0 && !complete;
      if (!stateByIso[iso]) stateByIso[iso] = { codes: [], cls: 'wm-participating' };
      stateByIso[iso].codes.push(c.code);
      if (complete) stateByIso[iso].cls = 'wm-complete';
      else if (partial && stateByIso[iso].cls !== 'wm-complete') stateByIso[iso].cls = 'wm-partial';
    });

    // Colore os caminhos. Se for <g>, aplica a classe em todos os <path> dentro
    Object.keys(stateByIso).forEach(iso => {
      const root = svg.querySelector(`[id="${iso}"]`);
      if (!root) return;
      const paths = root.tagName.toLowerCase() === 'path' ? [root] : Array.from(root.querySelectorAll('path'));
      const codes = stateByIso[iso].codes;
      // Quando há mais de um país no mesmo ISO (ex: Inglaterra + Escócia no GB),
      // o click abre um menu de seleção
      paths.forEach(p => {
        p.classList.add('wm-country', stateByIso[iso].cls);
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
          if (codes.length === 1) openCountryModal(codes[0]);
          else openMultiCountryChoice(codes);
        });
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = codes.map(code => {
          const c = countryByCode[code];
          return `${c.flag} ${c.name} (Grupo ${c.group})`;
        }).join(' / ');
        p.appendChild(title);
      });
      // Adiciona bandeira(s) no centro do país (usando o MAIOR path do grupo,
      // pra evitar Alasca/Hawaii puxando o centro dos EUA pro Ártico, etc.)
      try {
        let bbox;
        if (paths.length === 1) {
          bbox = paths[0].getBBox();
        } else {
          let maxArea = 0, mainBbox = null;
          paths.forEach(p => {
            const pb = p.getBBox();
            const area = pb.width * pb.height;
            if (area > maxArea) { maxArea = area; mainBbox = pb; }
          });
          bbox = mainBbox || root.getBBox();
        }
        if (bbox && bbox.width > 4 && bbox.height > 4) {
          const cx = bbox.x + bbox.width / 2;
          const cy = bbox.y + bbox.height / 2;
          const size = Math.max(10, Math.min(bbox.width / 2.5, 22));
          codes.forEach((code, i) => {
            const country = countryByCode[code];
            const flagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            flagText.setAttribute('x', cx);
            const offsetY = codes.length > 1 ? (i - (codes.length - 1) / 2) * (size + 2) : 0;
            flagText.setAttribute('y', cy + 4 + offsetY);
            flagText.setAttribute('text-anchor', 'middle');
            flagText.setAttribute('font-size', size);
            flagText.setAttribute('pointer-events', 'none');
            flagText.setAttribute('class', 'wm-flag');
            if (!showMapFlags) flagText.style.display = 'none';
            flagText.textContent = country.flag;
            svg.appendChild(flagText);
          });
        }
      } catch (e) {}
    });

    // Países que NÃO têm path próprio no SVG (ex: Curaçao) - adiciona marcador
    const fallbackPositions = { CUW: [320, 580] }; // x,y aproximado no SVG (1000x510)
    window.COUNTRIES.forEach(c => {
      const iso = FIFA_TO_ISO[c.code];
      if (!iso || svg.querySelector(`[id="${iso}"]`)) return;
      const pos = fallbackPositions[c.code];
      if (!pos) return;
      const sec = sectionsMap[c.code];
      const owned = sec.items.filter(s => isOwned(s.number)).length;
      const total = sec.items.length;
      const fill = owned === total ? '#54a96d' : (owned > 0 ? '#f5d34c' : '#4a8ec6');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => openCountryModal(c.code));
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos[0]);
      circle.setAttribute('cy', pos[1]);
      circle.setAttribute('r', 10);
      circle.setAttribute('fill', fill);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', pos[0]);
      txt.setAttribute('y', pos[1] + 4);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', '11');
      txt.textContent = c.flag;
      g.appendChild(txt);
      svg.appendChild(g);
    });
  }

  let currentOpenCountry = null;
  function openCountryModal(code) {
    currentOpenCountry = code;
    renderCountryModalContent();
    $('#countryModal').hidden = false;
  }
  function openMultiCountryChoice(codes) {
    // Mostra um pequeno menu pra escolher qual país abrir (ex: ENG ou SCO no UK)
    const body = $('#countryModalBody');
    body.innerHTML = `
      <h2 style="margin-bottom:14px">Qual seleção?</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${codes.map(code => {
          const c = countryByCode[code];
          return `<button class="btn-secondary multi-choice" data-code="${code}" style="display:flex;align-items:center;gap:10px;text-align:left;padding:14px">
            <span style="font-size:28px">${c.flag}</span>
            <span style="font-weight:800">${c.name}</span>
            <span class="country-group-tag" style="margin-left:auto">Grupo ${c.group}</span>
          </button>`;
        }).join('')}
      </div>
    `;
    body.querySelectorAll('.multi-choice').forEach(b => {
      b.addEventListener('click', () => openCountryModal(b.dataset.code));
    });
    $('#countryModal').hidden = false;
  }
  function renderCountryModalContent() {
    if (!currentOpenCountry) return;
    if (currentOpenCountry === '__intro__') { openIntroModal(); return; }
    const code = currentOpenCountry;
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
  }

  // ---------- PLACAR / CLASSIFICAÇÃO / MATA-MATA ----------
  function getScore(matchId) {
    return state.scores[matchId];
  }
  function setScore(matchId, home, away) {
    if (home === null || home === '' || away === null || away === '') {
      delete state.scores[matchId];
    } else {
      state.scores[matchId] = { home: parseInt(home, 10), away: parseInt(away, 10) };
    }
    saveData();
  }

  // Calcula a tabela de cada grupo
  function computeGroupStandings() {
    const standings = {};
    const groupCodes = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    groupCodes.forEach(g => {
      standings[g] = {};
      window.COUNTRIES.filter(c => c.group === g).forEach(c => {
        standings[g][c.code] = { code: c.code, name: c.name, flag: c.flag, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
      });
    });
    window.SCHEDULE.forEach(match => {
      if (match.phase !== 'Grupos') return;
      const score = getScore(match.id);
      if (!score) return;
      const s = standings[match.group];
      if (!s) return;
      const home = s[match.homeCode];
      const away = s[match.awayCode];
      if (!home || !away) return;
      home.P++; away.P++;
      home.GF += score.home; home.GA += score.away;
      away.GF += score.away; away.GA += score.home;
      if (score.home > score.away) { home.W++; home.Pts += 3; away.L++; }
      else if (score.home < score.away) { away.W++; away.Pts += 3; home.L++; }
      else { home.D++; home.Pts++; away.D++; away.Pts++; }
      home.GD = home.GF - home.GA;
      away.GD = away.GF - away.GA;
    });
    // Ordena cada grupo
    const sorted = {};
    Object.keys(standings).forEach(g => {
      sorted[g] = Object.values(standings[g]).sort((a, b) => {
        if (b.Pts !== a.Pts) return b.Pts - a.Pts;
        if (b.GD !== a.GD) return b.GD - a.GD;
        if (b.GF !== a.GF) return b.GF - a.GF;
        return a.name.localeCompare(b.name);
      });
    });
    return sorted;
  }

  // Calcula a posição (1º, 2º, 3º) de cada país. Retorna {ARG: '1A', ESP: '2A', ...}
  function getQualifiedTeams() {
    const standings = computeGroupStandings();
    const placings = { first: {}, second: {}, third: [] };
    Object.keys(standings).forEach(g => {
      const ranked = standings[g];
      if (ranked[0] && ranked[0].P >= 3) placings.first[g] = ranked[0];
      if (ranked[1] && ranked[1].P >= 3) placings.second[g] = ranked[1];
      if (ranked[2] && ranked[2].P >= 3) placings.third.push({ ...ranked[2], group: g });
    });
    // 8 melhores terceiros
    placings.third.sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.name.localeCompare(b.name);
    });
    placings.bestThirds = placings.third.slice(0, 8);
    return { placings, standings };
  }

  // Mapa de qual jogo de 16-avos recebe qual time
  // Baseado no que a FIFA divulgou (round-of-32 pairings)
  const R32_PAIRINGS = {
    73: { home: { type: '2nd', group: 'A' }, away: { type: '2nd', group: 'B' } },
    74: { home: { type: '1st', group: 'E' }, away: { type: 'best3rd', from: ['A','B','C','D','F'] } },
    75: { home: { type: '1st', group: 'F' }, away: { type: '2nd', group: 'C' } },
    76: { home: { type: '1st', group: 'C' }, away: { type: '2nd', group: 'F' } },
    77: { home: { type: '1st', group: 'I' }, away: { type: 'best3rd', from: ['C','D','F','G','H'] } },
    78: { home: { type: '2nd', group: 'E' }, away: { type: '2nd', group: 'I' } },
    79: { home: { type: '1st', group: 'A' }, away: { type: 'best3rd', from: ['C','E','F','H','I'] } },
    80: { home: { type: '1st', group: 'L' }, away: { type: 'best3rd', from: ['E','H','I','J','K'] } },
    81: { home: { type: '1st', group: 'D' }, away: { type: 'best3rd', from: ['B','E','F','I','J'] } },
    82: { home: { type: '1st', group: 'G' }, away: { type: 'best3rd', from: ['A','E','H','I','J'] } },
    83: { home: { type: '2nd', group: 'K' }, away: { type: '2nd', group: 'L' } },
    84: { home: { type: '1st', group: 'H' }, away: { type: '2nd', group: 'J' } },
    85: { home: { type: '1st', group: 'B' }, away: { type: 'best3rd', from: ['E','F','G','I','J'] } },
    86: { home: { type: '1st', group: 'J' }, away: { type: '2nd', group: 'H' } },
    87: { home: { type: '1st', group: 'K' }, away: { type: 'best3rd', from: ['D','E','I','J','L'] } },
    88: { home: { type: '2nd', group: 'D' }, away: { type: '2nd', group: 'G' } }
  };

  // Confrontos do mata-mata seguinte (oitavas, quartas, semis, etc.)
  const KO_PAIRINGS = {
    89: { home: 74, away: 77 },
    90: { home: 73, away: 75 },
    91: { home: 76, away: 78 },
    92: { home: 79, away: 80 },
    93: { home: 83, away: 84 },
    94: { home: 81, away: 82 },
    95: { home: 86, away: 88 },
    96: { home: 85, away: 87 },
    97: { home: 89, away: 90 },
    98: { home: 93, away: 94 },
    99: { home: 91, away: 92 },
    100: { home: 95, away: 96 },
    101: { home: 97, away: 98 },
    102: { home: 99, away: 100 },
    103: { home: 101, away: 102, loserFinal: true }, // perdedor das semis
    104: { home: 101, away: 102 } // vencedor das semis
  };

  function resolveTeam(spec, placings) {
    if (spec.type === '1st') return placings.first[spec.group] || null;
    if (spec.type === '2nd') return placings.second[spec.group] || null;
    if (spec.type === 'best3rd') {
      // Pega o melhor 3º cujo grupo está em "from"
      const candidate = placings.bestThirds.find(t => spec.from.includes(t.group));
      return candidate || null;
    }
    return null;
  }

  function winnerOf(matchId) {
    const match = window.SCHEDULE.find(m => m.id === matchId);
    if (!match) return null;
    const score = getScore(matchId);
    if (!score) return null;
    if (score.home > score.away) return match.resolvedHome || null;
    if (score.away > score.home) return match.resolvedAway || null;
    // Empate: precisa de pênaltis. Vou aceitar um campo score.penaltyWinner ('home'|'away')
    if (score.penaltyWinner === 'home') return match.resolvedHome || null;
    if (score.penaltyWinner === 'away') return match.resolvedAway || null;
    return null;
  }
  function loserOf(matchId) {
    const match = window.SCHEDULE.find(m => m.id === matchId);
    if (!match) return null;
    const score = getScore(matchId);
    if (!score) return null;
    if (score.home > score.away) return match.resolvedAway || null;
    if (score.away > score.home) return match.resolvedHome || null;
    if (score.penaltyWinner === 'home') return match.resolvedAway || null;
    if (score.penaltyWinner === 'away') return match.resolvedHome || null;
    return null;
  }

  // Atualiza .resolvedHome e .resolvedAway em todos os jogos baseado nos placares
  function resolveBracket() {
    const { placings } = getQualifiedTeams();
    // Primeiro, fase de grupos: home/away já estão fixos (homeCode/awayCode)
    window.SCHEDULE.forEach(m => {
      if (m.homeCode) m.resolvedHome = { code: m.homeCode, flag: countryByCode[m.homeCode].flag, name: countryByCode[m.homeCode].name };
      if (m.awayCode) m.resolvedAway = { code: m.awayCode, flag: countryByCode[m.awayCode].flag, name: countryByCode[m.awayCode].name };
    });
    // 16-avos
    Object.keys(R32_PAIRINGS).forEach(jogo => {
      const id = parseInt(jogo, 10);
      const match = window.SCHEDULE.find(m => m.id === id);
      if (!match) return;
      const pair = R32_PAIRINGS[id];
      match.resolvedHome = resolveTeam(pair.home, placings);
      match.resolvedAway = resolveTeam(pair.away, placings);
    });
    // Mata-mata seguinte (ordem importa - resolve do menor pro maior)
    Object.keys(KO_PAIRINGS).map(Number).sort((a,b)=>a-b).forEach(id => {
      const match = window.SCHEDULE.find(m => m.id === id);
      if (!match) return;
      const pair = KO_PAIRINGS[id];
      if (id === 103) {
        match.resolvedHome = loserOf(pair.home);
        match.resolvedAway = loserOf(pair.away);
      } else {
        match.resolvedHome = winnerOf(pair.home);
        match.resolvedAway = winnerOf(pair.away);
      }
    });
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

  // Bandeira do país onde fica cada estádio
  const VENUE_COUNTRY = {
    AZT: '🇲🇽', GDL: '🇲🇽', MTY: '🇲🇽',
    TOR: '🇨🇦', VAN: '🇨🇦',
    NYC: '🇺🇸', LAX: '🇺🇸', DAL: '🇺🇸', ATL: '🇺🇸', SEA: '🇺🇸',
    MIA: '🇺🇸', PHI: '🇺🇸', HOU: '🇺🇸', SFO: '🇺🇸', KAN: '🇺🇸', BOS: '🇺🇸'
  };
  function venueWithFlag(m) {
    if (!m.venue) return '';
    const flag = VENUE_COUNTRY[m.venueCode] || '';
    return flag ? `${flag} ${m.venue}` : m.venue;
  }

  function teamHTML(resolvedTeam, fallbackLabel) {
    if (resolvedTeam && resolvedTeam.code) {
      return `<span class="match-team"><span class="flag-mini">${resolvedTeam.flag}</span>${resolvedTeam.name}</span>`;
    }
    return `<span class="match-team" style="color:var(--c-muted)"><span class="flag-mini">❓</span>${fallbackLabel || '?'}</span>`;
  }

  function renderSchedule() {
    resolveBracket();
    const list = $('#matchesList');
    list.innerHTML = '';
    const filtered = window.SCHEDULE.filter(m => {
      if (currentPhase !== 'all' && m.phase !== currentPhase) return false;
      if (currentCountryFilter) {
        const hc = m.resolvedHome ? m.resolvedHome.code : null;
        const ac = m.resolvedAway ? m.resolvedAway.code : null;
        if (hc !== currentCountryFilter && ac !== currentCountryFilter) return false;
      }
      return true;
    });

    const now = new Date();
    const nextBox = $('#nextMatch');
    if (currentPhase === 'all' && !currentCountryFilter) {
      // Próximo jogo = não jogado E no futuro próximo (ou em andamento)
      const upcoming = window.SCHEDULE
        .filter(m => !getScore(m.id))
        .find(m => getMatchDateObj(m) >= new Date(now.getTime() - 2 * 60 * 60 * 1000));
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
    attachScheduleListeners(list);
  }

  function attachScheduleListeners(list) {
    list.querySelectorAll('.score-input').forEach(inp => {
      inp.addEventListener('input', onScoreInput);
      inp.addEventListener('blur', onScoreBlur);
    });
    list.querySelectorAll('.pen-toggle').forEach(btn => {
      btn.addEventListener('click', onPenaltyToggle);
    });
  }

  // Salva no localStorage a cada digitada, mas SEM re-renderizar a tela (preserva foco)
  function onScoreInput(e) {
    const card = e.target.closest('.match-card');
    if (!card) return;
    const id = parseInt(card.dataset.matchId, 10);
    const home = card.querySelector('.score-home').value;
    const away = card.querySelector('.score-away').value;
    if (home !== '' && away !== '') {
      const h = parseInt(home, 10);
      const a = parseInt(away, 10);
      if (isNaN(h) || isNaN(a)) return;
      const prev = state.scores[id] || {};
      state.scores[id] = { home: h, away: a };
      if (h === a && prev.penaltyWinner) state.scores[id].penaltyWinner = prev.penaltyWinner;
      saveData();
      card.classList.add('played');
      updateCardAfterScore(card, id);
    } else if (home === '' && away === '') {
      if (state.scores[id]) {
        delete state.scores[id];
        saveData();
        card.classList.remove('played');
        updateCardAfterScore(card, id);
      }
    }
  }

  function onScoreBlur(e) {
    // Quando o usuário sai do campo, garantimos que o card mostra status correto
    const card = e.target.closest('.match-card');
    if (!card) return;
    const id = parseInt(card.dataset.matchId, 10);
    updateCardAfterScore(card, id);
  }

  function updateCardAfterScore(card, id) {
    const m = window.SCHEDULE.find(x => x.id === id);
    if (!m) return;
    const score = getScore(id);
    const isKO = m.phase !== 'Grupos';
    // Mostra/esconde linha de pênaltis
    let penRow = card.querySelector('.pen-row');
    if (isKO && score && score.home === score.away && m.resolvedHome && m.resolvedAway) {
      if (!penRow) {
        penRow = document.createElement('div');
        penRow.className = 'pen-row';
        card.querySelector('.match-body').appendChild(penRow);
      }
      penRow.innerHTML = `
        Empate → quem ganhou nos pênaltis?
        <button class="pen-toggle ${score.penaltyWinner === 'home' ? 'active' : ''}" data-side="home">${m.resolvedHome.flag} ${m.resolvedHome.code}</button>
        <button class="pen-toggle ${score.penaltyWinner === 'away' ? 'active' : ''}" data-side="away">${m.resolvedAway.flag} ${m.resolvedAway.code}</button>
      `;
      penRow.querySelectorAll('.pen-toggle').forEach(btn => btn.addEventListener('click', onPenaltyToggle));
    } else if (penRow) {
      penRow.remove();
    }
  }

  function onPenaltyToggle(e) {
    const card = e.target.closest('.match-card');
    if (!card) return;
    const id = parseInt(card.dataset.matchId, 10);
    const side = e.target.dataset.side;
    if (!state.scores[id]) return;
    if (state.scores[id].penaltyWinner === side) {
      delete state.scores[id].penaltyWinner;
    } else {
      state.scores[id].penaltyWinner = side;
    }
    saveData();
    // Atualiza só os botões de pênalti, sem re-renderizar tudo
    card.querySelectorAll('.pen-toggle').forEach(b => {
      b.classList.toggle('active', b.dataset.side === state.scores[id].penaltyWinner);
    });
  }

  function matchCardHTML(m) {
    const d = getMatchDateObj(m);
    const day = d.getDate();
    const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const month = months[d.getMonth()];
    const score = getScore(m.id);
    const played = !!score;
    const homeName = m.resolvedHome ? m.resolvedHome.name : (m.homeLabel || '?');
    const awayName = m.resolvedAway ? m.resolvedAway.name : (m.awayLabel || '?');
    const homeFlag = m.resolvedHome ? m.resolvedHome.flag : '❓';
    const awayFlag = m.resolvedAway ? m.resolvedAway.flag : '❓';
    const hasTeams = m.resolvedHome && m.resolvedAway;
    const isDraw = played && score.home === score.away;
    const isKO = m.phase !== 'Grupos';
    return `
      <div class="match-card ${played ? 'played' : ''}" data-match-id="${m.id}">
        <div class="match-date">
          <div class="match-day">${day}</div>
          <div class="match-month">${month}</div>
          <div class="match-time">${m.time}</div>
        </div>
        <div class="match-body">
          <div class="match-row">
            <span class="match-team-side"><span class="flag-mini">${homeFlag}</span>${homeName}</span>
            <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input score-home" value="${played ? score.home : ''}" placeholder="-" ${hasTeams ? '' : 'disabled'} aria-label="Placar mandante">
          </div>
          <div class="match-row">
            <span class="match-team-side"><span class="flag-mini">${awayFlag}</span>${awayName}</span>
            <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input score-away" value="${played ? score.away : ''}" placeholder="-" ${hasTeams ? '' : 'disabled'} aria-label="Placar visitante">
          </div>
          ${isKO && isDraw && hasTeams ? `
            <div class="pen-row">
              Empate → quem ganhou nos pênaltis?
              <button class="pen-toggle ${score.penaltyWinner === 'home' ? 'active' : ''}" data-side="home">${homeFlag} ${m.resolvedHome.code}</button>
              <button class="pen-toggle ${score.penaltyWinner === 'away' ? 'active' : ''}" data-side="away">${awayFlag} ${m.resolvedAway.code}</button>
            </div>
          ` : ''}
        </div>
        <div class="match-meta">
          <div class="match-phase">${m.round || m.phase}</div>
          ${m.group ? `<div class="match-group">Grupo ${m.group}</div>` : ''}
          <div class="match-venue">${venueWithFlag(m)}</div>
        </div>
      </div>
    `;
  }

  // ---------- CHAVE (BRACKET) E CLASSIFICAÇÃO ----------
  function renderBracket() {
    resolveBracket();
    const { placings, standings } = getQualifiedTeams();
    const container = $('#bracketContent');
    const groupCodes = ['A','B','C','D','E','F','G','H','I','J','K','L'];

    // Tabelas dos grupos
    const groupsHtml = groupCodes.map(g => {
      const teams = standings[g];
      return `
        <div class="group-standings">
          <h3>Grupo ${g}</h3>
          <table>
            <thead>
              <tr><th></th><th>Time</th><th>P</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr>
            </thead>
            <tbody>
              ${teams.map((t, i) => `
                <tr class="${i === 0 ? 'pos-1' : i === 1 ? 'pos-2' : i === 2 ? 'pos-3' : 'pos-4'}">
                  <td class="pos">${i + 1}º</td>
                  <td class="team"><span>${t.flag}</span> ${t.name}</td>
                  <td>${t.P}</td>
                  <td>${t.W}</td>
                  <td>${t.D}</td>
                  <td>${t.L}</td>
                  <td>${t.GD >= 0 ? '+' : ''}${t.GD}</td>
                  <td class="pts">${t.Pts}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    // Melhores terceiros
    const thirdsHtml = placings.bestThirds.length ? `
      <div class="bracket-section">
        <h3>🥉 Melhores 3º colocados (8 avançam)</h3>
        <div class="thirds-list">
          ${placings.bestThirds.map((t, i) => `
            <div class="third-row">
              <span class="third-pos">${i + 1}</span>
              <span class="third-flag">${t.flag}</span>
              <span class="third-name">${t.name}</span>
              <span class="third-group">Gr ${t.group}</span>
              <span class="third-pts">${t.Pts} pts</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Chave do mata-mata
    function teamSlot(team, fallback) {
      if (team) return `<span class="bk-team"><span class="bk-flag">${team.flag}</span><span class="bk-name">${team.name}</span></span>`;
      return `<span class="bk-team bk-empty"><span class="bk-flag">❓</span><span class="bk-name">${fallback || '?'}</span></span>`;
    }
    function bracketMatch(matchId) {
      const m = window.SCHEDULE.find(x => x.id === matchId);
      if (!m) return '';
      const score = getScore(matchId);
      const hWon = score && (score.home > score.away || score.penaltyWinner === 'home');
      const aWon = score && (score.away > score.home || score.penaltyWinner === 'away');
      const d = getMatchDateObj(m);
      const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
      const dateStr = `${d.getDate()}/${months[d.getMonth()]} ${m.time}`;
      return `
        <div class="bk-match">
          <div class="bk-id">Jogo ${matchId}</div>
          <div class="bk-side ${hWon ? 'win' : ''}">${teamSlot(m.resolvedHome, m.homeLabel)}<span class="bk-score">${score ? score.home : '–'}</span></div>
          <div class="bk-side ${aWon ? 'win' : ''}">${teamSlot(m.resolvedAway, m.awayLabel)}<span class="bk-score">${score ? score.away : '–'}</span></div>
          <div class="bk-date">${dateStr}</div>
        </div>
      `;
    }

    const r32Html = `<div class="bk-round"><h4>16-avos</h4>${[73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88].map(bracketMatch).join('')}</div>`;
    const r16Html = `<div class="bk-round"><h4>Oitavas</h4>${[89,90,91,92,93,94,95,96].map(bracketMatch).join('')}</div>`;
    const qfHtml = `<div class="bk-round"><h4>Quartas</h4>${[97,98,99,100].map(bracketMatch).join('')}</div>`;
    const sfHtml = `<div class="bk-round"><h4>Semis</h4>${[101,102].map(bracketMatch).join('')}</div>`;
    const finalHtml = `<div class="bk-round"><h4>3º Lugar</h4>${bracketMatch(103)}</div><div class="bk-round bk-final"><h4>🏆 FINAL</h4>${bracketMatch(104)}</div>`;

    container.innerHTML = `
      <div class="bracket-section">
        <h3>📋 Classificação dos Grupos</h3>
        <div class="groups-grid">${groupsHtml}</div>
      </div>
      ${thirdsHtml}
      <div class="bracket-section">
        <h3>🔥 Mata-Mata</h3>
        <div class="bracket-tree">
          ${r32Html}
          ${r16Html}
          ${qfHtml}
          ${sfHtml}
          ${finalHtml}
        </div>
      </div>
    `;
  }

  // ---------- DASHBOARD ----------
  function buildFamilyRow(p) {
    const counts = p.counts || {};
    let owned = 0;
    Object.keys(counts).forEach(k => { if (counts[k] > 0) owned++; });
    const total = 980;
    const pct = (owned / total * 100).toFixed(0);
    const dup = Object.keys(counts).reduce((acc, k) => acc + Math.max(0, counts[k] - 1), 0);
    const isMe = p.name === profileName;
    const medal = p.medal || '';
    const positionLabel = p.position ? `${p.position}º` : '';
    return `
      <div class="family-card ${isMe ? 'me' : ''} ${medal ? 'has-medal' : ''}" data-name="${p.name}">
        ${medal ? `<div class="family-medal medal-${p.position}">${medal}</div>` : ''}
        ${!isMe ? `<button class="family-remove" data-name="${p.name}" title="Remover da lista">✗</button>` : ''}
        <div class="family-card-top">
          <div class="family-avatar">${p.name.charAt(0).toUpperCase()}</div>
          <div class="family-name-block">
            <div class="family-name">
              ${positionLabel ? `<span class="family-pos">${positionLabel}</span>` : ''}
              ${p.name}${isMe ? ' 👤' : ''}
            </div>
            <div class="family-pct">${pct}%</div>
          </div>
        </div>
        <div class="family-progress-bar"><div style="width:${pct}%"></div></div>
        <div class="family-meta">
          <span>${owned}/${total}</span>
          ${dup > 0 ? `<span>🔁 ${dup}</span>` : ''}
        </div>
      </div>
    `;
  }

  function buildCompactRow(p) {
    const counts = p.counts || {};
    let owned = 0;
    Object.keys(counts).forEach(k => { if (counts[k] > 0) owned++; });
    const total = 980;
    const pct = (owned / total * 100).toFixed(0);
    const isMe = p.name === profileName;
    return `
      <div class="family-compact-row ${isMe ? 'me' : ''}" data-name="${p.name}">
        <span class="fcr-pos">${p.position}º</span>
        <span class="fcr-avatar">${p.name.charAt(0).toUpperCase()}</span>
        <span class="fcr-name">${p.name}${isMe ? ' 👤' : ''}</span>
        <span class="fcr-count">${owned}/${total}</span>
        <span class="fcr-pct">${pct}%</span>
      </div>
    `;
  }

  function rankProfilesByProgress(profiles) {
    // Ordena por quantidade de figurinhas únicas coladas (desc)
    const ranked = [...profiles].sort((a, b) => {
      const aOwned = Object.values(a.counts || {}).filter(v => v > 0).length;
      const bOwned = Object.values(b.counts || {}).filter(v => v > 0).length;
      if (bOwned !== aOwned) return bOwned - aOwned;
      // Empate: quem tem mais repetidas vence
      const aDup = Object.values(a.counts || {}).reduce((acc, v) => acc + Math.max(0, v - 1), 0);
      const bDup = Object.values(b.counts || {}).reduce((acc, v) => acc + Math.max(0, v - 1), 0);
      if (bDup !== aDup) return bDup - aDup;
      return a.name.localeCompare(b.name);
    });
    const medals = ['🥇', '🥈', '🥉'];
    ranked.forEach((p, i) => {
      p.position = i + 1;
      if (i < medals.length && ranked.length >= 2) p.medal = medals[i];
    });
    return ranked;
  }

  function buildCountdownHtml() {
    const cupStart = new Date('2026-06-11T17:00:00-03:00');
    const cupEnd = new Date('2026-07-19T18:00:00-03:00');
    const now = new Date();
    if (now < cupStart) {
      // Conta dia-a-dia (ignora horas pra não dar +1 falso)
      const startDay = new Date(2026, 5, 11); // mes 5 = junho (0-indexado)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const days = Math.round((startDay - today) / (1000 * 60 * 60 * 24));
      return `
        <div class="countdown-card">
          <div class="countdown-label">⏳ FALTAM</div>
          <div class="countdown-days">${days}</div>
          <div class="countdown-sub">dia${days !== 1 ? 's' : ''} pra Copa começar!</div>
          <div class="countdown-date">🇲🇽 México x África do Sul · 11/jun · 17h Brasília</div>
        </div>
      `;
    } else if (now < cupEnd) {
      return `
        <div class="countdown-card live">
          <div class="countdown-label">🔴 ACONTECENDO AGORA</div>
          <div class="countdown-days">⚽</div>
          <div class="countdown-sub">A Copa do Mundo 2026 está rolando!</div>
        </div>
      `;
    } else {
      return `
        <div class="countdown-card ended">
          <div class="countdown-label">🏆 COPA ENCERRADA</div>
          <div class="countdown-days">FIM</div>
        </div>
      `;
    }
  }

  function buildTodayGamesHtml() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    // 1) Jogos de hoje ainda não terminados (não jogados ainda OU em andamento)
    const todayUnplayed = window.SCHEDULE.filter(m => {
      if (m.date !== todayStr) return false;
      if (state.scores[m.id]) return false; // já tem placar
      return true;
    });

    let games, title;
    if (todayUnplayed.length > 0) {
      games = todayUnplayed;
      title = `⚽ Jogos de hoje (${games.length})`;
    } else {
      // Não tem jogos hoje pendentes - busca próximo dia com jogos
      const upcoming = window.SCHEDULE.filter(m => {
        const d = new Date(`${m.date}T${m.time}:00-03:00`);
        return d > now && !state.scores[m.id];
      });
      if (upcoming.length === 0) return '';
      upcoming.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      const firstDate = upcoming[0].date;
      games = upcoming.filter(m => m.date === firstDate);
      const nextD = new Date(`${firstDate}T00:00:00-03:00`);
      title = `⏭ Próximos jogos · ${nextD.getDate()}/${months[nextD.getMonth()]}`;
    }
    games.sort((a, b) => a.time.localeCompare(b.time));
    const rows = games.map(m => {
      const score = state.scores[m.id];
      const home = m.resolvedHome || (m.homeCode ? { code: m.homeCode, flag: countryByCode[m.homeCode].flag, name: countryByCode[m.homeCode].name } : null);
      const away = m.resolvedAway || (m.awayCode ? { code: m.awayCode, flag: countryByCode[m.awayCode].flag, name: countryByCode[m.awayCode].name } : null);
      const homeName = home ? `${home.flag} ${home.name}` : '❓ ' + (m.homeLabel || '?');
      const awayName = away ? `${away.flag} ${away.name}` : '❓ ' + (m.awayLabel || '?');
      const matchDate = new Date(`${m.date}T${m.time}:00-03:00`);
      const isPast = matchDate < now;
      const isLive = !isPast && (matchDate - now) < 2 * 60 * 60 * 1000; // dentro de 2h
      let scoreText = '<span style="color:var(--c-muted)">×</span>';
      if (score) {
        const hWon = score.home > score.away || score.penaltyWinner === 'home';
        const aWon = score.away > score.home || score.penaltyWinner === 'away';
        scoreText = `<span class="today-score">${score.home} × ${score.away}</span>`;
      }
      const hasBrazil = m.homeCode === 'BRA' || m.awayCode === 'BRA';
      return `
        <div class="today-row ${isPast ? 'past' : ''} ${isLive ? 'live' : ''} ${hasBrazil ? 'brazil' : ''}" data-match-id="${m.id}">
          <div class="today-time">${m.time}${isLive ? ' 🔴' : ''}</div>
          <div class="today-match">
            <div class="today-teams">${homeName} ${scoreText} ${awayName}</div>
            <div class="today-meta">${m.round || m.phase}${m.group ? ' · Grupo '+m.group : ''}${hasBrazil ? ' · 🇧🇷' : ''}</div>
          </div>
          <div class="today-action">📝</div>
        </div>
      `;
    }).join('');
    return `
      <div class="today-block">
        <h3>${title}</h3>
        <div class="today-list">${rows}</div>
      </div>
    `;
  }

  function buildBrazilGamesHtml() {
    const brazilGames = window.SCHEDULE.filter(m =>
      m.homeCode === 'BRA' || m.awayCode === 'BRA'
    ).slice(0, 6); // até 6 jogos (3 grupos + até 3 mata-mata)
    if (brazilGames.length === 0) return '';
    const now = new Date();
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const rows = brazilGames.map(m => {
      const d = new Date(`${m.date}T${m.time}:00-03:00`);
      const isPast = d < now;
      const score = state.scores[m.id];
      const opponent = m.homeCode === 'BRA'
        ? (m.resolvedAway || (m.awayCode ? { code: m.awayCode, flag: countryByCode[m.awayCode].flag, name: countryByCode[m.awayCode].name } : null))
        : (m.resolvedHome || (m.homeCode ? { code: m.homeCode, flag: countryByCode[m.homeCode].flag, name: countryByCode[m.homeCode].name } : null));
      if (!opponent) return '';
      const isHome = m.homeCode === 'BRA';
      let scoreHtml = '';
      if (score) {
        const braScore = isHome ? score.home : score.away;
        const oppScore = isHome ? score.away : score.home;
        const winColor = braScore > oppScore ? 'var(--c-success)' : braScore < oppScore ? 'var(--c-red)' : 'var(--c-gold-dark)';
        scoreHtml = `<span class="brazil-score" style="color:${winColor}">${braScore} × ${oppScore}</span>`;
      }
      return `
        <div class="brazil-row ${isPast ? 'past' : ''}" data-match-id="${m.id}">
          <div class="brazil-date">
            <div class="brazil-day">${d.getDate()}</div>
            <div class="brazil-month">${months[d.getMonth()]}</div>
          </div>
          <div class="brazil-match">
            <div class="brazil-teams">🇧🇷 Brasil ${score ? scoreHtml : '<span style="color:var(--c-muted)">×</span>'} ${opponent.flag} ${opponent.name}</div>
            <div class="brazil-venue">${m.time} · ${venueWithFlag(m)}</div>
          </div>
          <div class="brazil-action">📝</div>
        </div>
      `;
    }).join('');
    return `
      <div class="brazil-block">
        <h3>🇧🇷 Jogos do Brasil</h3>
        <div class="brazil-list">${rows}</div>
      </div>
    `;
  }

  function renderDashboard() {
    const owned = totalOwned();
    const total = window.STICKERS_TOTAL;
    const dup = totalDuplicates();
    const missing = total - owned;
    const pct = (owned / total * 100).toFixed(1);
    const countdownHtml = buildCountdownHtml();
    const todayHtml = buildTodayGamesHtml();
    const brazilHtml = buildBrazilGamesHtml();

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
      ${countdownHtml}
      ${todayHtml}
      ${brazilHtml}
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
    // Bloco fixo de grupos SEMPRE no TOPO (carrega async)
    const familyBlock = `
      <div class="dashboard-section" id="familySection">
        <div class="groups-bar">
          <div class="groups-tabs" id="groupsTabs">
            <div style="font-size:12px;color:var(--c-muted);padding:8px">Carregando grupos...</div>
          </div>
          <button id="manageGroups" class="btn-primary" style="font-size:11px;padding:6px 12px;white-space:nowrap">+ Grupo</button>
        </div>
        <div id="groupInfo"></div>
        <div class="family-list" id="familyList"></div>
      </div>
    `;
    // Limpa tudo antes pra evitar qualquer resíduo de render anterior
    const dashEl = $('#dashboardContent');
    dashEl.innerHTML = '';
    dashEl.innerHTML = familyBlock + html;
    $$('#dashboardContent .country-missing-row').forEach(r => {
      r.addEventListener('click', () => openCountryModal(r.dataset.code));
    });
    $('#manageGroups').addEventListener('click', openGroupsModal);
    loadAndRenderGroups();

    // Liga cliques nos jogos do dashboard pra abrir o modal de placar rápido
    $$('#dashboardContent .today-row, #dashboardContent .brazil-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.dataset.matchId, 10);
        if (id) openQuickScoreModal(id);
      });
    });
  }

  function openQuickScoreModal(matchId) {
    resolveBracket();
    const m = window.SCHEDULE.find(x => x.id === matchId);
    if (!m) return;
    const score = getScore(matchId);
    const home = m.resolvedHome || (m.homeCode ? { code: m.homeCode, flag: countryByCode[m.homeCode].flag, name: countryByCode[m.homeCode].name } : null);
    const away = m.resolvedAway || (m.awayCode ? { code: m.awayCode, flag: countryByCode[m.awayCode].flag, name: countryByCode[m.awayCode].name } : null);
    if (!home || !away) {
      showToast('Esse jogo ainda não tem times definidos.', 'info');
      return;
    }
    const d = getMatchDateObj(m);
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const isKO = m.phase !== 'Grupos';
    $('#quickScoreBody').innerHTML = `
      <div class="qs-info">
        <div class="qs-phase">${m.round || m.phase}${m.group ? ' · Grupo ' + m.group : ''}</div>
        <div class="qs-date">${d.getDate()}/${months[d.getMonth()]} · ${m.time} Brasília</div>
        <div class="qs-venue">${venueWithFlag(m)}</div>
      </div>
      <div class="qs-score-row">
        <div class="qs-team">
          <div class="qs-flag">${home.flag}</div>
          <div class="qs-name">${home.name}</div>
        </div>
        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="qs-input qs-home" value="${score ? score.home : ''}" placeholder="-">
        <div class="qs-vs">×</div>
        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="qs-input qs-away" value="${score ? score.away : ''}" placeholder="-">
        <div class="qs-team">
          <div class="qs-flag">${away.flag}</div>
          <div class="qs-name">${away.name}</div>
        </div>
      </div>
      <div class="qs-pen-row" id="qsPenRow" style="display:none">
        <p style="font-size:12px;font-weight:700;text-align:center;margin-bottom:8px">⚽ Empate! Quem ganhou nos pênaltis?</p>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn-secondary qs-pen" data-side="home">${home.flag} ${home.code}</button>
          <button class="btn-secondary qs-pen" data-side="away">${away.flag} ${away.code}</button>
        </div>
      </div>
      <div class="qs-buttons">
        <button class="btn-secondary qs-clear">🗑 Apagar placar</button>
        <button class="btn-primary qs-save">💾 Salvar</button>
      </div>
    `;
    const updatePenRow = () => {
      const h = $('#quickScoreBody .qs-home').value;
      const a = $('#quickScoreBody .qs-away').value;
      const show = isKO && h !== '' && a !== '' && parseInt(h) === parseInt(a);
      $('#qsPenRow').style.display = show ? 'block' : 'none';
      const curScore = state.scores[matchId];
      $$('#qsPenRow .qs-pen').forEach(b => {
        b.classList.toggle('active', curScore && curScore.penaltyWinner === b.dataset.side);
      });
    };
    updatePenRow();
    $$('#quickScoreBody .qs-input').forEach(inp => {
      inp.addEventListener('input', updatePenRow);
    });
    $$('#quickScoreBody .qs-pen').forEach(b => {
      b.addEventListener('click', () => {
        const side = b.dataset.side;
        const cur = state.scores[matchId] || {};
        if (cur.penaltyWinner === side) delete cur.penaltyWinner;
        else cur.penaltyWinner = side;
        state.scores[matchId] = cur;
        $$('#qsPenRow .qs-pen').forEach(bb => {
          bb.classList.toggle('active', cur.penaltyWinner === bb.dataset.side);
        });
      });
    });
    $('#quickScoreBody .qs-clear').addEventListener('click', () => {
      delete state.scores[matchId];
      saveData();
      showToast('🗑 Placar apagado', 'info', 1800);
      $('#quickScoreModal').hidden = true;
      renderDashboard();
    });
    $('#quickScoreBody .qs-save').addEventListener('click', () => {
      const h = $('#quickScoreBody .qs-home').value;
      const a = $('#quickScoreBody .qs-away').value;
      if (h === '' || a === '') {
        showToast('Preencha os dois placares.', 'error');
        return;
      }
      const hN = parseInt(h, 10), aN = parseInt(a, 10);
      if (isNaN(hN) || isNaN(aN)) return;
      const prev = state.scores[matchId] || {};
      state.scores[matchId] = { home: hN, away: aN };
      if (hN === aN && prev.penaltyWinner) state.scores[matchId].penaltyWinner = prev.penaltyWinner;
      saveData();
      showToast('✅ Placar salvo!', 'success', 1800);
      $('#quickScoreModal').hidden = true;
      renderDashboard();
    });
    $('#quickScoreModal').hidden = false;
  }

  async function loadAndRenderGroups() {
    const tabsEl = $('#groupsTabs');
    const listEl = $('#familyList');
    const infoEl = $('#groupInfo');
    if (!tabsEl || !listEl) return;
    if (!supabaseClient) {
      tabsEl.innerHTML = '<div style="font-size:12px;color:var(--c-muted);padding:6px">📴 Sem nuvem</div>';
      listEl.innerHTML = '';
      return;
    }
    const groups = await loadMyGroups();
    if (groups.length === 0) {
      tabsEl.innerHTML = '<div style="font-size:12px;color:var(--c-muted);padding:8px">Nenhum grupo. Crie um ou entre num com código.</div>';
      infoEl.innerHTML = '';
      listEl.innerHTML = '';
      return;
    }
    // Seleciona um grupo (se não tiver, primeiro)
    if (!selectedGroupCode || !groups.find(g => g.code === selectedGroupCode)) {
      setSelectedGroup(groups[0].code);
    }
    tabsEl.innerHTML = groups.map(g => `
      <button class="group-tab ${g.code === selectedGroupCode ? 'active' : ''}" data-code="${g.code}">
        ${g.name}
      </button>
    `).join('');
    tabsEl.querySelectorAll('.group-tab').forEach(b => {
      b.addEventListener('click', () => {
        setSelectedGroup(b.dataset.code);
        loadAndRenderGroups();
      });
    });
    const current = groups.find(g => g.code === selectedGroupCode);
    const isAdmin = current.created_by === profileName;
    infoEl.innerHTML = `
      <div class="group-info-bar">
        <span class="group-info-name">${current.name}</span>
        ${isAdmin ? '<span class="group-admin-badge">👑 admin</span>' : ''}
        <button class="btn-secondary group-info-leave" data-code="${current.code}" style="font-size:11px;padding:3px 8px;margin-left:auto">🚪 Sair</button>
      </div>
      <div id="pendingRequests"></div>
    `;
    infoEl.querySelector('.group-info-leave').addEventListener('click', async (e) => {
      const code = e.currentTarget.dataset.code;
      if (!confirm(`Sair do grupo "${current.name}"?`)) return;
      await leaveGroup(code);
      setSelectedGroup('');
      loadAndRenderGroups();
    });

    // Se admin, carrega pedidos pendentes
    if (isAdmin) {
      const pending = await loadPendingRequests(selectedGroupCode);
      if (pending.length > 0) {
        const pendingEl = $('#pendingRequests');
        pendingEl.innerHTML = `
          <div class="pending-requests-box">
            <div class="pending-title">📨 ${pending.length} pedido${pending.length>1?'s':''} pendente${pending.length>1?'s':''}</div>
            ${pending.map(r => `
              <div class="pending-row">
                <span class="pending-name">👤 ${r.profile_name}</span>
                <button class="btn-primary" data-approve="${r.profile_name}" style="font-size:11px;padding:3px 8px">✓ Aceitar</button>
                <button class="btn-secondary" data-deny="${r.profile_name}" style="font-size:11px;padding:3px 8px">✗ Recusar</button>
              </div>
            `).join('')}
          </div>
        `;
        pendingEl.querySelectorAll('[data-approve]').forEach(btn => {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            await approveRequest(selectedGroupCode, btn.dataset.approve);
            loadAndRenderGroups();
          });
        });
        pendingEl.querySelectorAll('[data-deny]').forEach(btn => {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            await denyRequest(selectedGroupCode, btn.dataset.deny);
            loadAndRenderGroups();
          });
        });
      }
    }

    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--c-muted);font-size:13px;grid-column:1/-1">Carregando membros...</div>';
    const members = await loadGroupMembers(selectedGroupCode);
    if (members.length === 0) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--c-muted);font-size:13px;grid-column:1/-1">Sem membros ainda.</div>';
      return;
    }
    const ranked = rankProfilesByProgress(members);
    const champion = ranked[0];
    const champOwned = Object.values(champion.counts || {}).filter(v => v > 0).length;
    const podiumBanner = ranked.length >= 2 ? `
      <div class="podium-banner">
        🏆 <strong>${champion.name}</strong> está liderando com ${champOwned}/980 figurinhas!
      </div>
    ` : '';
    // Top 3 (ou top 2 se forem só 2): cards grandes com medalha
    // Resto: lista compacta colapsável
    const podium = ranked.slice(0, 3);
    const rest = ranked.slice(3);
    const meInRest = rest.find(p => p.name === profileName);
    const meCard = meInRest && !podium.find(p => p.name === profileName)
      ? `<div class="my-pos-card" data-name="${profileName}">${buildCompactRow(meInRest)}</div>`
      : '';
    const podiumHtml = `<div class="podium-row">${podium.map(buildFamilyRow).join('')}</div>`;
    const restHtml = rest.length > 0 ? `
      <details class="family-rest" ${rest.length <= 3 ? 'open' : ''}>
        <summary>Ver os outros ${rest.length} ${rest.length === 1 ? 'membro' : 'membros'} ▾</summary>
        <div class="family-rest-list">
          ${rest.map(buildCompactRow).join('')}
        </div>
      </details>
    ` : '';
    listEl.innerHTML = podiumBanner + podiumHtml + meCard + restHtml;
    listEl.querySelectorAll('.family-card, .family-compact-row, .my-pos-card').forEach(r => {
      if (r.classList.contains('me')) return;
      r.addEventListener('click', async () => {
        const familyName = r.dataset.name;
        if (!familyName) return;
        const code = await generateFamilyViewCode(familyName);
        if (code) window.location.href = `app.html?view=${code}`;
      });
    });
  }

  async function openGroupsModal() {
    if (!supabaseClient) { alert('Sem conexão com a nuvem.'); return; }
    $('#groupsModal').hidden = false;
    await refreshGroupsModal();
  }
  async function refreshGroupsModal() {
    const listEl = $('#allGroupsList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="font-size:12px;color:var(--c-muted);padding:8px">Carregando...</div>';
    const [allGroups, myGroups, myRequests] = await Promise.all([
      loadAllGroups(),
      loadMyGroups(),
      loadGroupRequestsByMe()
    ]);
    const myCodes = new Set(myGroups.map(g => g.code));
    const myReqs = new Set(myRequests);
    if (allGroups.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--c-muted);padding:16px;text-align:center">Nenhum grupo criado ainda. Cria o primeiro acima!</div>';
      return;
    }
    // Conta membros de cada
    const counts = await Promise.all(allGroups.map(g => loadMemberCount(g.code)));
    listEl.innerHTML = allGroups.map((g, i) => {
      const memberCount = counts[i];
      const isMember = myCodes.has(g.code);
      const isPending = myReqs.has(g.code);
      const isAdmin = g.created_by === profileName;
      let action;
      if (isMember) {
        action = `<span class="group-badge member">✓ Você está no grupo${isAdmin ? ' (admin)' : ''}</span>`;
      } else if (isPending) {
        action = `<button class="btn-secondary" data-cancel="${g.code}" style="font-size:11px;padding:5px 10px">⏳ Cancelar pedido</button>`;
      } else {
        action = `<button class="btn-primary" data-request="${g.code}" style="font-size:11px;padding:5px 10px">📨 Pedir entrada</button>`;
      }
      return `
        <div class="group-list-item">
          <div style="flex:1;min-width:0">
            <div style="font-weight:900;font-size:14px">${g.name}</div>
            <div style="font-size:11px;color:var(--c-muted);font-weight:700">${memberCount} membro${memberCount !== 1 ? 's' : ''} · admin: ${g.created_by || '?'}</div>
          </div>
          ${action}
        </div>
      `;
    }).join('');
    listEl.querySelectorAll('[data-request]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = '...';
        const res = await requestJoinGroup(btn.dataset.request);
        if (!res.ok) { showToast('Erro: ' + res.error, 'error'); return; }
        showToast('📨 Pedido enviado! Aguarde aprovação do admin.', 'success', 3500);
        await refreshGroupsModal();
        loadAndRenderGroups();
      });
    });
    listEl.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = '...';
        await cancelJoinRequest(btn.dataset.cancel);
        await refreshGroupsModal();
      });
    });
  }
  // Liga botões do modal
  if ($('#createGroupBtn')) {
    $('#createGroupBtn').addEventListener('click', async () => {
      const name = $('#newGroupName').value.trim();
      if (!name) { alert('Digite um nome'); return; }
      const g = await createGroup(name);
      if (g) {
        $('#newGroupName').value = '';
        setSelectedGroup(g.code);
        showToast(`✅ Grupo "${g.name}" criado! Você é o admin.`, 'success', 3500);
        await refreshGroupsModal();
        loadAndRenderGroups();
      } else { showToast('Erro ao criar grupo', 'error'); }
    });
  }
  if ($('#closeGroupsModal')) {
    $('#closeGroupsModal').addEventListener('click', () => $('#groupsModal').hidden = true);
  }

  async function generateFamilyViewCode(familyName) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('name, counts, scores')
      .eq('name', familyName)
      .maybeSingle();
    if (error || !data) return null;
    const counts = [];
    for (let i = 1; i <= 980; i++) {
      counts.push(Math.min(9, (data.counts || {})[i] || 0).toString(16));
    }
    const scoresArr = [];
    Object.keys(data.scores || {}).forEach(id => {
      const sc = data.scores[id];
      let s = `${id},${sc.home},${sc.away}`;
      if (sc.penaltyWinner) s += ',' + (sc.penaltyWinner === 'home' ? 'h' : 'a');
      scoresArr.push(s);
    });
    const payload = { n: data.name, c: counts.join(''), s: scoresArr.join('|') };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
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
      if (tab === 'bracket') renderBracket();
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
    const grid = $('#countriesGrid');
    const mapWrap = $('#worldMapWrap');
    const legend = $('#worldMapLegend');
    // Força display direto (não depende de CSS [hidden])
    if (view === 'grid') {
      grid.style.display = 'grid';
      grid.hidden = false;
      mapWrap.style.display = 'none';
      mapWrap.hidden = true;
      legend.style.display = 'none';
      legend.hidden = true;
    } else {
      grid.style.display = 'none';
      grid.hidden = true;
      mapWrap.style.display = '';
      mapWrap.hidden = false;
      legend.style.display = '';
      legend.hidden = false;
      renderWorldMap();
    }
  });

  // Mapa tela cheia
  $('#openFullscreenMap').addEventListener('click', () => {
    $('#mapFullscreenModal').hidden = false;
    setTimeout(() => renderWorldMap($('#worldMapFullscreen')), 30);
  });

  // Toggle bandeiras no mapa
  $('#toggleMapFlags').addEventListener('click', (e) => {
    showMapFlags = !showMapFlags;
    e.currentTarget.textContent = showMapFlags ? '🚩 Esconder bandeiras' : '🚩 Mostrar bandeiras';
    document.querySelectorAll('.world-map svg .wm-flag').forEach(f => {
      f.style.display = showMapFlags ? '' : 'none';
    });
  });

  // Zoom buttons (delegação - funciona pros 2 containers)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-zoom]');
    if (!btn) return;
    const wrapper = btn.closest('.map-container');
    if (!wrapper) return;
    const svg = wrapper.querySelector('svg');
    if (!svg) return;
    const action = btn.dataset.zoom;
    if (action === 'reset') {
      svg.setAttribute('viewBox', svg.dataset.originalViewBox);
    } else {
      zoomSvg(svg, action === 'in' ? 0.7 : 1.4, 0.5, 0.5);
    }
  });

  function zoomSvg(svg, scale, focalX, focalY) {
    const vb = (svg.getAttribute('viewBox') || svg.dataset.originalViewBox).split(/\s+/).map(Number);
    let [x, y, w, h] = vb;
    const origVb = svg.dataset.originalViewBox.split(/\s+/).map(Number);
    const newW = Math.max(origVb[2] * 0.08, Math.min(origVb[2], w * scale));
    const newH = Math.max(origVb[3] * 0.08, Math.min(origVb[3], h * scale));
    const cx = x + w * focalX;
    const cy = y + h * focalY;
    const newX = Math.max(origVb[0] - origVb[2] * 0.2, Math.min(origVb[0] + origVb[2] - newW * 0.8, cx - newW * focalX));
    const newY = Math.max(origVb[1] - origVb[3] * 0.2, Math.min(origVb[1] + origVb[3] - newH * 0.8, cy - newH * focalY));
    svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
  }

  function attachMapPanZoom(svg, container) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let startVb = null;
    const getVb = () => (svg.getAttribute('viewBox') || svg.dataset.originalViewBox).split(/\s+/).map(Number);

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      zoomSvg(svg, e.deltaY > 0 ? 1.15 : 0.87, fx, fy);
    }, { passive: false });

    // Mouse drag pan
    svg.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('wm-country')) return; // click no país
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startVb = getVb();
      svg.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - startX) / rect.width * startVb[2];
      const dy = (e.clientY - startY) / rect.height * startVb[3];
      svg.setAttribute('viewBox', `${startVb[0] - dx} ${startVb[1] - dy} ${startVb[2]} ${startVb[3]}`);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      svg.style.cursor = '';
    });

    // Touch: 1 dedo pan, 2 dedos pinch zoom
    let pinchStartDist = 0;
    let pinchStartVb = null;
    svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        startX = t.clientX; startY = t.clientY;
        startVb = getVb();
        isDragging = true;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.hypot(dx, dy);
        pinchStartVb = getVb();
        isDragging = false;
      }
    }, { passive: true });
    svg.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        const t = e.touches[0];
        const rect = svg.getBoundingClientRect();
        const dx = (t.clientX - startX) / rect.width * startVb[2];
        const dy = (t.clientY - startY) / rect.height * startVb[3];
        svg.setAttribute('viewBox', `${startVb[0] - dx} ${startVb[1] - dy} ${startVb[2]} ${startVb[3]}`);
        e.preventDefault();
      } else if (e.touches.length === 2 && pinchStartVb) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = pinchStartDist / dist;
        const newW = pinchStartVb[2] * scale;
        const newH = pinchStartVb[3] * scale;
        const cx = pinchStartVb[0] + pinchStartVb[2] / 2;
        const cy = pinchStartVb[1] + pinchStartVb[3] / 2;
        svg.setAttribute('viewBox', `${cx - newW/2} ${cy - newH/2} ${newW} ${newH}`);
        e.preventDefault();
      }
    }, { passive: false });
    svg.addEventListener('touchend', () => {
      isDragging = false;
      pinchStartVb = null;
    });
  }

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
  if ($('#faqBtn')) {
    $('#faqBtn').addEventListener('click', () => {
      $('#faqModal').hidden = false;
    });
  }
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

  // Compartilhar álbum (gera link)
  if ($('#shareBtn')) {
    $('#shareBtn').addEventListener('click', () => {
      const code = encodeAlbumState();
      const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'app.html');
      const url = `${base}?view=${code}`;
      const result = $('#shareResult');
      result.hidden = false;
      result.innerHTML = `
        <p style="font-size:12px;font-weight:700;margin-bottom:6px">Link copiado! Cole no WhatsApp ou no navegador da família 👇</p>
        <textarea readonly style="width:100%;height:60px;padding:6px;font-size:11px;font-family:monospace;border:1px solid var(--c-border);border-radius:6px">${url}</textarea>
        <button class="btn-secondary" id="copyShareLink" style="margin-top:6px;width:100%">📋 Copiar link</button>
      `;
      const ta = result.querySelector('textarea');
      ta.select();
      try {
        navigator.clipboard.writeText(url);
      } catch (e) {}
      $('#copyShareLink').addEventListener('click', () => {
        ta.select();
        try {
          navigator.clipboard.writeText(url);
          $('#copyShareLink').textContent = '✓ Copiado!';
          setTimeout(() => { $('#copyShareLink').textContent = '📋 Copiar link'; }, 2000);
        } catch (e) {
          document.execCommand('copy');
        }
      });
    });
  }

  // Reset (zera figurinhas E placares)
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que quer ZERAR tudo de ' + profileName + '?\n\nIsso apaga:\n• Todas as figurinhas coladas\n• Todos os placares dos jogos\n\nA conta continua. Não dá pra desfazer!')) {
      state.counts = {};
      state.scores = {};
      saveData();
      renderCollection();
      if (!$('#countryModal').hidden) renderCountryModalContent();
      $('#settingsModal').hidden = true;
      showToast('🔄 Tudo zerado. Boa nova jornada!', 'info', 3000);
    }
  });

  // ---------- INIT ----------
  fillCountryFilter();
  renderDashboard();

  // Atualiza o painel a cada 60s pra contagem regressiva e jogos do dia ficarem frescos
  setInterval(() => {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab === 'dashboard') renderDashboard();
  }, 60000);

  // Carrega do Supabase na inicialização (se disponível) e re-renderiza
  if (supabaseClient && !viewMode) {
    loadFromCloud().then(loaded => {
      if (loaded) {
        renderCollection();
        updateGlobalProgress();
      }
    });
    // Sub real-time
    supabaseClient
      .channel('family_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        // Se a alteração for do MEU perfil, atualizar
        if (payload.new && payload.new.name === profileName) {
          state.counts = payload.new.counts || {};
          state.scores = payload.new.scores || {};
          localStorage.setItem(storageKey, JSON.stringify(state));
          // Re-render se aba ativa
          const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
          if (activeTab === 'collection') renderCollection();
          if (activeTab === 'dashboard') renderDashboard();
          if (activeTab === 'bracket') renderBracket();
          if (activeTab === 'schedule') renderSchedule();
        }
      })
      .subscribe();
  }
})();
