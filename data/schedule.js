// Calendário OFICIAL Copa do Mundo FIFA 2026 (fonte: FIFA, divulgado em 30/mar/2026)
// 104 jogos · 11/jun a 19/jul · Horários em Brasília (UTC-3)
(function () {
  const V = {
    AZT: 'Estádio Azteca - Cidade do México',
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
    SFO: 'Levi\'s Stadium - Santa Clara (Baía de São Francisco)',
    KAN: 'Arrowhead Stadium - Kansas City',
    BOS: 'Gillette Stadium - Boston'
  };

  let id = 1;
  const m = (date, time, phase, group, round, homeCode, awayCode, venue, homeLabel, awayLabel) => ({
    id: id++, date, time, phase, group, round,
    homeCode: homeCode || null,
    awayCode: awayCode || null,
    homeLabel: homeLabel || null,
    awayLabel: awayLabel || null,
    venue: V[venue], venueCode: venue,
    confirmed: true
  });

  const matches = [
    // ======= 1ª RODADA =======
    // Quinta 11/jun
    m('2026-06-11','16:00','Grupos','A','Rodada 1','MEX','RSA','AZT'),
    m('2026-06-11','23:00','Grupos','A','Rodada 1','KOR','CZE','GDL'),
    // Sexta 12/jun
    m('2026-06-12','16:00','Grupos','B','Rodada 1','CAN','BIH','TOR'),
    m('2026-06-12','22:00','Grupos','D','Rodada 1','USA','PAR','LAX'),
    // Sábado 13/jun
    m('2026-06-13','16:00','Grupos','B','Rodada 1','QAT','SUI','SFO'),
    m('2026-06-13','19:00','Grupos','C','Rodada 1','BRA','MAR','NYC'),
    m('2026-06-13','22:00','Grupos','C','Rodada 1','HAI','SCO','BOS'),
    m('2026-06-14','01:00','Grupos','D','Rodada 1','AUS','TUR','VAN'),
    // Domingo 14/jun
    m('2026-06-14','14:00','Grupos','E','Rodada 1','GER','CUW','HOU'),
    m('2026-06-14','17:00','Grupos','F','Rodada 1','NED','JPN','DAL'),
    m('2026-06-14','20:00','Grupos','E','Rodada 1','CIV','ECU','PHI'),
    m('2026-06-14','23:00','Grupos','F','Rodada 1','SWE','TUN','MTY'),
    // Segunda 15/jun
    m('2026-06-15','13:00','Grupos','H','Rodada 1','ESP','CPV','ATL'),
    m('2026-06-15','16:00','Grupos','G','Rodada 1','BEL','EGY','SEA'),
    m('2026-06-15','19:00','Grupos','H','Rodada 1','KSA','URU','MIA'),
    m('2026-06-15','22:00','Grupos','G','Rodada 1','IRN','NZL','LAX'),
    // Terça 16/jun
    m('2026-06-16','16:00','Grupos','I','Rodada 1','FRA','SEN','NYC'),
    m('2026-06-16','19:00','Grupos','I','Rodada 1','IRQ','NOR','BOS'),
    m('2026-06-16','22:00','Grupos','J','Rodada 1','ARG','ALG','KAN'),
    m('2026-06-17','01:00','Grupos','J','Rodada 1','AUT','JOR','SFO'),
    // Quarta 17/jun
    m('2026-06-17','14:00','Grupos','K','Rodada 1','POR','COD','HOU'),
    m('2026-06-17','17:00','Grupos','L','Rodada 1','ENG','CRO','DAL'),
    m('2026-06-17','20:00','Grupos','L','Rodada 1','GHA','PAN','TOR'),
    m('2026-06-17','21:00','Grupos','K','Rodada 1','UZB','COL','AZT'),

    // ======= 2ª RODADA =======
    // Quinta 18/jun
    m('2026-06-18','13:00','Grupos','A','Rodada 2','CZE','RSA','ATL'),
    m('2026-06-18','16:00','Grupos','B','Rodada 2','SUI','BIH','LAX'),
    m('2026-06-18','19:00','Grupos','B','Rodada 2','CAN','QAT','VAN'),
    m('2026-06-18','22:00','Grupos','A','Rodada 2','MEX','KOR','GDL'),
    // Sexta 19/jun
    m('2026-06-19','16:00','Grupos','D','Rodada 2','USA','AUS','SEA'),
    m('2026-06-19','19:00','Grupos','C','Rodada 2','SCO','MAR','BOS'),
    m('2026-06-19','21:30','Grupos','C','Rodada 2','BRA','HAI','PHI'),
    m('2026-06-20','00:00','Grupos','D','Rodada 2','TUR','PAR','SFO'),
    // Sábado 20/jun
    m('2026-06-20','14:00','Grupos','F','Rodada 2','NED','SWE','HOU'),
    m('2026-06-20','17:00','Grupos','E','Rodada 2','GER','CIV','TOR'),
    m('2026-06-20','21:00','Grupos','E','Rodada 2','ECU','CUW','KAN'),
    m('2026-06-20','23:00','Grupos','F','Rodada 2','TUN','JPN','MTY'),
    // Domingo 21/jun
    m('2026-06-21','13:00','Grupos','H','Rodada 2','ESP','KSA','ATL'),
    m('2026-06-21','16:00','Grupos','G','Rodada 2','BEL','IRN','LAX'),
    m('2026-06-21','19:00','Grupos','H','Rodada 2','URU','CPV','MIA'),
    m('2026-06-21','22:00','Grupos','G','Rodada 2','NZL','EGY','VAN'),
    // Segunda 22/jun
    m('2026-06-22','14:00','Grupos','J','Rodada 2','ARG','AUT','DAL'),
    m('2026-06-22','18:00','Grupos','I','Rodada 2','FRA','IRQ','PHI'),
    m('2026-06-22','21:00','Grupos','I','Rodada 2','NOR','SEN','NYC'),
    m('2026-06-23','00:00','Grupos','J','Rodada 2','JOR','ALG','SFO'),
    // Terça 23/jun
    m('2026-06-23','14:00','Grupos','K','Rodada 2','POR','UZB','HOU'),
    m('2026-06-23','17:00','Grupos','L','Rodada 2','ENG','GHA','BOS'),
    m('2026-06-23','20:00','Grupos','L','Rodada 2','PAN','CRO','TOR'),
    m('2026-06-23','23:00','Grupos','K','Rodada 2','COL','COD','GDL'),

    // ======= 3ª RODADA (jogos simultâneos por grupo) =======
    // Quarta 24/jun - Grupos B, C, A
    m('2026-06-24','16:00','Grupos','B','Rodada 3','SUI','CAN','VAN'),
    m('2026-06-24','16:00','Grupos','B','Rodada 3','BIH','QAT','SEA'),
    m('2026-06-24','19:00','Grupos','C','Rodada 3','SCO','BRA','MIA'),
    m('2026-06-24','19:00','Grupos','C','Rodada 3','MAR','HAI','ATL'),
    m('2026-06-24','22:00','Grupos','A','Rodada 3','CZE','MEX','AZT'),
    m('2026-06-24','22:00','Grupos','A','Rodada 3','RSA','KOR','MTY'),
    // Quinta 25/jun - Grupos E, F, D
    m('2026-06-25','17:00','Grupos','E','Rodada 3','ECU','GER','NYC'),
    m('2026-06-25','17:00','Grupos','E','Rodada 3','CUW','CIV','PHI'),
    m('2026-06-25','20:00','Grupos','F','Rodada 3','JPN','SWE','DAL'),
    m('2026-06-25','20:00','Grupos','F','Rodada 3','TUN','NED','KAN'),
    m('2026-06-25','23:00','Grupos','D','Rodada 3','TUR','USA','LAX'),
    m('2026-06-25','23:00','Grupos','D','Rodada 3','PAR','AUS','SFO'),
    // Sexta 26/jun - Grupos I, H, G
    m('2026-06-26','16:00','Grupos','I','Rodada 3','NOR','FRA','BOS'),
    m('2026-06-26','16:00','Grupos','I','Rodada 3','SEN','IRQ','TOR'),
    m('2026-06-26','21:00','Grupos','H','Rodada 3','CPV','KSA','HOU'),
    m('2026-06-26','21:00','Grupos','H','Rodada 3','URU','ESP','GDL'),
    m('2026-06-27','00:00','Grupos','G','Rodada 3','EGY','IRN','SEA'),
    m('2026-06-27','00:00','Grupos','G','Rodada 3','NZL','BEL','VAN'),
    // Sábado 27/jun - Grupos L, K, J
    m('2026-06-27','18:00','Grupos','L','Rodada 3','PAN','ENG','NYC'),
    m('2026-06-27','18:00','Grupos','L','Rodada 3','CRO','GHA','PHI'),
    m('2026-06-27','20:30','Grupos','K','Rodada 3','COL','POR','MIA'),
    m('2026-06-27','20:30','Grupos','K','Rodada 3','COD','UZB','ATL'),
    m('2026-06-27','23:00','Grupos','J','Rodada 3','ALG','AUT','KAN'),
    m('2026-06-27','23:00','Grupos','J','Rodada 3','JOR','ARG','DAL'),

    // ======= 32-AVOS (Round of 32) =======
    // Domingo 28/jun
    m('2026-06-28','17:00','16-avos',null,'Jogo 73',null,null,'LAX',null,null),
    // Segunda 29/jun
    m('2026-06-29','13:00','16-avos',null,'Jogo 74',null,null,'BOS',null,null),
    m('2026-06-29','17:00','16-avos',null,'Jogo 75',null,null,'MTY',null,null),
    m('2026-06-29','21:00','16-avos',null,'Jogo 76',null,null,'HOU',null,null),
    // Terça 30/jun
    m('2026-06-30','13:00','16-avos',null,'Jogo 77',null,null,'NYC',null,null),
    m('2026-06-30','17:00','16-avos',null,'Jogo 78',null,null,'DAL',null,null),
    m('2026-06-30','21:00','16-avos',null,'Jogo 79',null,null,'AZT',null,null),
    // Quarta 1/jul
    m('2026-07-01','13:00','16-avos',null,'Jogo 80',null,null,'ATL',null,null),
    m('2026-07-01','17:00','16-avos',null,'Jogo 81',null,null,'SFO',null,null),
    m('2026-07-01','21:00','16-avos',null,'Jogo 82',null,null,'SEA',null,null),
    // Quinta 2/jul
    m('2026-07-02','13:00','16-avos',null,'Jogo 83',null,null,'TOR',null,null),
    m('2026-07-02','17:00','16-avos',null,'Jogo 84',null,null,'LAX',null,null),
    m('2026-07-02','21:00','16-avos',null,'Jogo 85',null,null,'VAN',null,null),
    // Sexta 3/jul
    m('2026-07-03','13:00','16-avos',null,'Jogo 86',null,null,'MIA',null,null),
    m('2026-07-03','17:00','16-avos',null,'Jogo 87',null,null,'KAN',null,null),
    m('2026-07-03','21:00','16-avos',null,'Jogo 88',null,null,'DAL',null,null),

    // ======= OITAVAS DE FINAL (Round of 16) =======
    m('2026-07-04','16:00','Oitavas',null,'Jogo 89',null,null,'PHI',null,null),
    m('2026-07-04','20:00','Oitavas',null,'Jogo 90',null,null,'HOU',null,null),
    m('2026-07-05','16:00','Oitavas',null,'Jogo 91',null,null,'NYC',null,null),
    m('2026-07-05','20:00','Oitavas',null,'Jogo 92',null,null,'AZT',null,null),
    m('2026-07-06','16:00','Oitavas',null,'Jogo 93',null,null,'DAL',null,null),
    m('2026-07-06','20:00','Oitavas',null,'Jogo 94',null,null,'SEA',null,null),
    m('2026-07-07','16:00','Oitavas',null,'Jogo 95',null,null,'ATL',null,null),
    m('2026-07-07','20:00','Oitavas',null,'Jogo 96',null,null,'VAN',null,null),

    // ======= QUARTAS DE FINAL =======
    m('2026-07-09','16:00','Quartas',null,'Jogo 97',null,null,'BOS',null,null),
    m('2026-07-10','16:00','Quartas',null,'Jogo 98',null,null,'LAX',null,null),
    m('2026-07-12','13:00','Quartas',null,'Jogo 99',null,null,'MIA',null,null),
    m('2026-07-12','17:00','Quartas',null,'Jogo 100',null,null,'KAN',null,null),

    // ======= SEMIFINAIS =======
    m('2026-07-14','16:00','Semis',null,'Semifinal 1',null,null,'DAL',null,null),
    m('2026-07-15','16:00','Semis',null,'Semifinal 2',null,null,'ATL',null,null),

    // ======= 3º LUGAR =======
    m('2026-07-18','16:00','Final',null,'3º Lugar',null,null,'MIA',null,null),

    // ======= FINAL =======
    m('2026-07-19','16:00','Final',null,'FINAL',null,null,'NYC',null,null)
  ];

  // Define labels do mata-mata (apenas para exibição)
  const knockoutLabels = {
    73: { home: '2º Grupo A', away: '2º Grupo B' },
    74: { home: '1º Grupo E', away: '3º A/B/C/D/F' },
    75: { home: '1º Grupo F', away: '2º Grupo C' },
    76: { home: '1º Grupo C', away: '2º Grupo F' },
    77: { home: '1º Grupo I', away: '3º C/D/F/G/H' },
    78: { home: '2º Grupo E', away: '2º Grupo I' },
    79: { home: '1º Grupo A', away: '3º C/E/F/H/I' },
    80: { home: '1º Grupo L', away: '3º E/H/I/J/K' },
    81: { home: '1º Grupo D', away: '3º B/E/F/I/J' },
    82: { home: '1º Grupo G', away: '3º A/E/H/I/J' },
    83: { home: '2º Grupo K', away: '2º Grupo L' },
    84: { home: '1º Grupo H', away: '2º Grupo J' },
    85: { home: '1º Grupo B', away: '3º E/F/G/I/J' },
    86: { home: '1º Grupo J', away: '2º Grupo H' },
    87: { home: '1º Grupo K', away: '3º D/E/I/J/L' },
    88: { home: '2º Grupo D', away: '2º Grupo G' },
    89: { home: 'Vencedor 74', away: 'Vencedor 77' },
    90: { home: 'Vencedor 73', away: 'Vencedor 75' },
    91: { home: 'Vencedor 76', away: 'Vencedor 78' },
    92: { home: 'Vencedor 79', away: 'Vencedor 80' },
    93: { home: 'Vencedor 83', away: 'Vencedor 84' },
    94: { home: 'Vencedor 81', away: 'Vencedor 82' },
    95: { home: 'Vencedor 86', away: 'Vencedor 88' },
    96: { home: 'Vencedor 85', away: 'Vencedor 87' },
    97: { home: 'Vencedor 89', away: 'Vencedor 90' },
    98: { home: 'Vencedor 93', away: 'Vencedor 94' },
    99: { home: 'Vencedor 91', away: 'Vencedor 92' },
    100: { home: 'Vencedor 95', away: 'Vencedor 96' },
    101: { home: 'Vencedor 97', away: 'Vencedor 98' },
    102: { home: 'Vencedor 99', away: 'Vencedor 100' },
    103: { home: 'Perdedor 101', away: 'Perdedor 102' },
    104: { home: 'Vencedor 101', away: 'Vencedor 102' }
  };

  matches.forEach(match => {
    const labels = knockoutLabels[match.id];
    if (labels && !match.homeCode) {
      match.homeLabel = labels.home;
      match.awayLabel = labels.away;
    }
  });

  window.SCHEDULE = matches;
  window.VENUES = V;
})();
