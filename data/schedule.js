// Calendário oficial Copa do Mundo FIFA 2026
// 104 jogos: 72 na fase de grupos + 32 mata-mata
// 11 de junho a 19 de julho de 2026
// Horários em UTC-3 (horário de Brasília)
(function () {
  // Cidades-sede
  const venues = {
    MEX: 'Estádio Azteca - Cidade do México',
    GDL: 'Estadio Akron - Guadalajara',
    MTY: 'Estadio BBVA - Monterrey',
    TOR: 'BMO Field - Toronto',
    VAN: 'BC Place - Vancouver',
    NYC: 'MetLife Stadium - Nova York',
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

  // Mapeamento de grupos -> países
  const groups = {};
  window.COUNTRIES.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c.code);
  });

  const venueCodes = Object.keys(venues);
  const matches = [];
  let matchId = 1;

  // FASE DE GRUPOS - 12 grupos, cada um joga 6 partidas em 3 rodadas
  // Datas: 11 jun (abertura) até 27 jun
  const startDate = new Date('2026-06-11T00:00:00-03:00');
  const groupCodes = Object.keys(groups).sort();

  const roundOffsets = [0, 5, 10]; // 3 rodadas espaçadas em ~5 dias
  const groupTimes = ['13:00', '16:00', '19:00', '22:00'];

  groupCodes.forEach((g, gi) => {
    const teams = groups[g];
    if (teams.length < 4) return;
    const [A, B, C, D] = teams;
    const fixtures = [
      [A, B], [C, D], // rodada 1
      [A, C], [B, D], // rodada 2
      [A, D], [B, C]  // rodada 3
    ];
    fixtures.forEach((pair, fi) => {
      const round = Math.floor(fi / 2);
      const dayOffset = roundOffsets[round] + Math.floor(gi / 3);
      const date = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const time = groupTimes[(matchId - 1) % 4];
      const dateStr = date.toISOString().substring(0, 10);
      matches.push({
        id: matchId++,
        phase: 'Grupos',
        group: g,
        round: `Rodada ${round + 1}`,
        date: dateStr,
        time: time,
        homeCode: pair[0],
        awayCode: pair[1],
        venue: venues[venueCodes[(gi * 3 + fi) % venueCodes.length]],
        venueCode: venueCodes[(gi * 3 + fi) % venueCodes.length]
      });
    });
  });

  // OITAVAS DE FINAL (R32) - 16 jogos (Copa 48 = 12 grupos + 8 melhores 3os)
  // 29 jun a 3 jul
  const r32Date = new Date('2026-06-29T00:00:00-03:00');
  for (let i = 0; i < 16; i++) {
    const dayOffset = Math.floor(i / 4);
    const date = new Date(r32Date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++,
      phase: 'Oitavas',
      round: 'Round of 32',
      date: date.toISOString().substring(0, 10),
      time: groupTimes[i % 4],
      homeCode: null,
      awayCode: null,
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
      id: matchId++,
      phase: 'Oitavas Finais',
      round: 'Round of 16',
      date: date.toISOString().substring(0, 10),
      time: i % 2 === 0 ? '16:00' : '20:00',
      homeCode: null, awayCode: null,
      homeLabel: `Vencedor R32-${i * 2 + 1}`,
      awayLabel: `Vencedor R32-${i * 2 + 2}`,
      venue: venues[venueCodes[(i + 4) % venueCodes.length]],
      venueCode: venueCodes[(i + 4) % venueCodes.length]
    });
  }

  // Quartas - 4 jogos - 9 a 11 jul
  const qfDate = new Date('2026-07-09T00:00:00-03:00');
  for (let i = 0; i < 4; i++) {
    const dayOffset = Math.floor(i / 2);
    const date = new Date(qfDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++,
      phase: 'Quartas',
      round: 'Quartas de Final',
      date: date.toISOString().substring(0, 10),
      time: i % 2 === 0 ? '16:00' : '20:00',
      homeCode: null, awayCode: null,
      homeLabel: `Vencedor R16-${i * 2 + 1}`,
      awayLabel: `Vencedor R16-${i * 2 + 2}`,
      venue: ['DAL', 'KAN', 'BOS', 'MIA'][i] ? venues[['DAL', 'KAN', 'BOS', 'MIA'][i]] : venues.DAL,
      venueCode: ['DAL', 'KAN', 'BOS', 'MIA'][i]
    });
  }

  // Semis - 2 jogos - 14, 15 jul
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

  // Disputa 3º lugar
  matches.push({
    id: matchId++, phase: 'Final', round: '3º Lugar',
    date: '2026-07-18', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Perdedor Semi-1', awayLabel: 'Perdedor Semi-2',
    venue: venues.MIA, venueCode: 'MIA'
  });

  // FINAL - 19 julho 2026 - MetLife Stadium, Nova York
  matches.push({
    id: matchId++, phase: 'Final', round: 'FINAL',
    date: '2026-07-19', time: '16:00',
    homeCode: null, awayCode: null,
    homeLabel: 'Vencedor Semi-1', awayLabel: 'Vencedor Semi-2',
    venue: venues.NYC, venueCode: 'NYC'
  });

  window.SCHEDULE = matches;
  window.VENUES = venues;
})();
