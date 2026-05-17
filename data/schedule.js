// Calendário Copa do Mundo FIFA 2026
// 104 jogos: 72 fase de grupos + 32 mata-mata
// 11 jun a 19 jul 2026 · Horários em UTC-3 (Brasília)
// Jogos do Brasil e estreia (México) confirmados pela FIFA
(function () {
  const venues = {
    MEX: 'Estádio Azteca - Cidade do México',
    GDL: 'Estadio Akron - Guadalajara',
    MTY: 'Estadio BBVA - Monterrey',
    TOR: 'BMO Field - Toronto',
    VAN: 'BC Place - Vancouver',
    NYC: 'MetLife Stadium - Nova York/NJ',
    LAX: 'SoFi Stadium - Los Angeles',
    DAL: 'AT&T Stadium - Dallas',
    ATL: 'Mercedes-Benz Stadium - Atlanta',
    SEA: 'Lumen Field - Seattle',
    MIA: 'Hard Rock Stadium - Miami',
    PHI: 'Lincoln Financial Field - Filadélfia',
    HOU: 'NRG Stadium - Houston',
    SFO: 'Levi\'s Stadium - São Francisco',
    KAN: 'Arrowhead Stadium - Kansas City',
    BOS: 'Gillette Stadium - Boston'
  };

  // Mapeamento grupo -> países (lido do COUNTRIES)
  const groups = {};
  window.COUNTRIES.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c.code);
  });

  const matches = [];
  let matchId = 1;

  // ============ JOGOS CONFIRMADOS (FIFA oficial) ============
  // Abertura: 11 jun - México joga no Estádio Azteca (oponente confirmado pela FIFA)
  matches.push({
    id: matchId++, phase: 'Grupos', group: 'A', round: 'Rodada 1',
    date: '2026-06-11', time: '17:00',
    homeCode: 'MEX', awayCode: 'KOR',
    venue: venues.MEX, venueCode: 'MEX', confirmed: true
  });

  // Brasil - 3 jogos confirmados FIFA
  matches.push({
    id: matchId++, phase: 'Grupos', group: 'C', round: 'Rodada 1',
    date: '2026-06-13', time: '19:00',
    homeCode: 'BRA', awayCode: 'MAR',
    venue: venues.NYC, venueCode: 'NYC', confirmed: true
  });
  matches.push({
    id: matchId++, phase: 'Grupos', group: 'C', round: 'Rodada 2',
    date: '2026-06-19', time: '21:30',
    homeCode: 'BRA', awayCode: 'HAI',
    venue: venues.PHI, venueCode: 'PHI', confirmed: true
  });
  matches.push({
    id: matchId++, phase: 'Grupos', group: 'C', round: 'Rodada 3',
    date: '2026-06-24', time: '19:00',
    homeCode: 'BRA', awayCode: 'SCO',
    venue: venues.MIA, venueCode: 'MIA', confirmed: true
  });

  // ============ DEMAIS JOGOS DA FASE DE GRUPOS (calendário aproximado) ============
  const startDate = new Date('2026-06-11T00:00:00-03:00');
  const groupCodes = Object.keys(groups).sort();
  const groupTimes = ['13:00', '16:00', '19:00', '22:00'];
  const venueCodes = Object.keys(venues);
  const roundOffsets = [0, 5, 10];

  // Conjunto de jogos já adicionados (cada par de times só joga 1x na fase de grupos)
  const addedKey = (a, b) => [a, b].sort().join('-');
  const added = new Set();
  matches.forEach(m => {
    if (m.homeCode && m.awayCode) {
      added.add(addedKey(m.homeCode, m.awayCode));
    }
  });

  groupCodes.forEach((g, gi) => {
    const teams = groups[g];
    if (teams.length < 4) return;
    const [A, B, C, D] = teams;
    const fixtures = [
      [A, B, 'Rodada 1'], [C, D, 'Rodada 1'],
      [A, C, 'Rodada 2'], [B, D, 'Rodada 2'],
      [A, D, 'Rodada 3'], [B, C, 'Rodada 3']
    ];
    fixtures.forEach((fx, fi) => {
      const [t1, t2, round] = fx;
      const key = addedKey(t1, t2);
      if (added.has(key)) return;
      added.add(key);
      const roundIdx = Math.floor(fi / 2);
      const dayOffset = roundOffsets[roundIdx] + Math.floor(gi / 3);
      const date = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const time = groupTimes[(matchId - 1) % 4];
      matches.push({
        id: matchId++, phase: 'Grupos', group: g, round,
        date: date.toISOString().substring(0, 10),
        time,
        homeCode: t1, awayCode: t2,
        venue: venues[venueCodes[(gi * 3 + fi) % venueCodes.length]],
        venueCode: venueCodes[(gi * 3 + fi) % venueCodes.length]
      });
    });
  });

  // ============ MATA-MATA ============
  // R32 - 16 jogos - 29 jun a 3 jul (1º vs 2º entre grupos)
  const r32Date = new Date('2026-06-29T00:00:00-03:00');
  for (let i = 0; i < 16; i++) {
    const dayOffset = Math.floor(i / 4);
    const date = new Date(r32Date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++, phase: 'Oitavas', round: 'Round of 32',
      date: date.toISOString().substring(0, 10),
      time: groupTimes[i % 4],
      homeCode: null, awayCode: null,
      homeLabel: `1º Grupo ${groupCodes[i % 12]}`,
      awayLabel: `2º Grupo ${groupCodes[(i + 6) % 12]}`,
      venue: venues[venueCodes[i % venueCodes.length]],
      venueCode: venueCodes[i % venueCodes.length]
    });
  }

  // R16 - 8 jogos - 4 a 7 jul
  const r16Date = new Date('2026-07-04T00:00:00-03:00');
  for (let i = 0; i < 8; i++) {
    const dayOffset = Math.floor(i / 2);
    const date = new Date(r16Date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++, phase: 'Oitavas Finais', round: 'Round of 16',
      date: date.toISOString().substring(0, 10),
      time: i % 2 === 0 ? '16:00' : '20:00',
      homeCode: null, awayCode: null,
      homeLabel: `Vencedor R32-${i * 2 + 1}`,
      awayLabel: `Vencedor R32-${i * 2 + 2}`,
      venue: venues[venueCodes[(i + 4) % venueCodes.length]],
      venueCode: venueCodes[(i + 4) % venueCodes.length]
    });
  }

  // Quartas - 4 jogos
  const qfDate = new Date('2026-07-09T00:00:00-03:00');
  const qfVenues = ['DAL', 'KAN', 'BOS', 'MIA'];
  for (let i = 0; i < 4; i++) {
    const dayOffset = Math.floor(i / 2);
    const date = new Date(qfDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++, phase: 'Quartas', round: 'Quartas de Final',
      date: date.toISOString().substring(0, 10),
      time: i % 2 === 0 ? '16:00' : '20:00',
      homeCode: null, awayCode: null,
      homeLabel: `Vencedor R16-${i * 2 + 1}`,
      awayLabel: `Vencedor R16-${i * 2 + 2}`,
      venue: venues[qfVenues[i]], venueCode: qfVenues[i]
    });
  }

  // Semis
  matches.push({
    id: matchId++, phase: 'Semis', round: 'Semifinal',
    date: '2026-07-14', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Vencedor Quartas-1', awayLabel: 'Vencedor Quartas-2',
    venue: venues.ATL, venueCode: 'ATL'
  });
  matches.push({
    id: matchId++, phase: 'Semis', round: 'Semifinal',
    date: '2026-07-15', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Vencedor Quartas-3', awayLabel: 'Vencedor Quartas-4',
    venue: venues.DAL, venueCode: 'DAL'
  });

  // 3º lugar
  matches.push({
    id: matchId++, phase: 'Final', round: '3º Lugar',
    date: '2026-07-18', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Perdedor Semi-1', awayLabel: 'Perdedor Semi-2',
    venue: venues.MIA, venueCode: 'MIA'
  });

  // FINAL - 19 jul - MetLife Stadium
  matches.push({
    id: matchId++, phase: 'Final', round: 'FINAL',
    date: '2026-07-19', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Vencedor Semi-1', awayLabel: 'Vencedor Semi-2',
    venue: venues.NYC, venueCode: 'NYC'
  });

  // Ordena cronologicamente
  matches.sort((a, b) => {
    const da = a.date + ' ' + a.time;
    const db = b.date + ' ' + b.time;
    return da.localeCompare(db);
  });

  window.SCHEDULE = matches;
  window.VENUES = venues;
})();
