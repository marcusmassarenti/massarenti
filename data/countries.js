// 48 países da Copa do Mundo FIFA 2026 (EUA, Canadá, México)
// Grupos sorteados em dezembro de 2025
// Sede: 16 cidades em 3 países
window.COUNTRIES = [
  // Anfitriões
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦', confederation: 'CONCACAF', group: 'B' },
  { code: 'MEX', name: 'México', flag: '🇲🇽', confederation: 'CONCACAF', group: 'A' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', confederation: 'CONCACAF', group: 'D' },

  // CONMEBOL (América do Sul)
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', group: 'C' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷', confederation: 'CONMEBOL', group: 'E' },
  { code: 'URU', name: 'Uruguai', flag: '🇺🇾', confederation: 'CONMEBOL', group: 'F' },
  { code: 'COL', name: 'Colômbia', flag: '🇨🇴', confederation: 'CONMEBOL', group: 'G' },
  { code: 'ECU', name: 'Equador', flag: '🇪🇨', confederation: 'CONMEBOL', group: 'H' },
  { code: 'PAR', name: 'Paraguai', flag: '🇵🇾', confederation: 'CONMEBOL', group: 'I' },
  { code: 'VEN', name: 'Venezuela', flag: '🇻🇪', confederation: 'CONMEBOL', group: 'J' },

  // UEFA (Europa) - 16 vagas
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸', confederation: 'UEFA', group: 'A' },
  { code: 'FRA', name: 'França', flag: '🇫🇷', confederation: 'UEFA', group: 'B' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', group: 'C' },
  { code: 'GER', name: 'Alemanha', flag: '🇩🇪', confederation: 'UEFA', group: 'D' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', group: 'E' },
  { code: 'NED', name: 'Holanda', flag: '🇳🇱', confederation: 'UEFA', group: 'F' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', confederation: 'UEFA', group: 'G' },
  { code: 'ITA', name: 'Itália', flag: '🇮🇹', confederation: 'UEFA', group: 'H' },
  { code: 'CRO', name: 'Croácia', flag: '🇭🇷', confederation: 'UEFA', group: 'I' },
  { code: 'SUI', name: 'Suíça', flag: '🇨🇭', confederation: 'UEFA', group: 'J' },
  { code: 'DEN', name: 'Dinamarca', flag: '🇩🇰', confederation: 'UEFA', group: 'K' },
  { code: 'AUT', name: 'Áustria', flag: '🇦🇹', confederation: 'UEFA', group: 'L' },
  { code: 'POL', name: 'Polônia', flag: '🇵🇱', confederation: 'UEFA', group: 'A' },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴', confederation: 'UEFA', group: 'B' },
  { code: 'TUR', name: 'Turquia', flag: '🇹🇷', confederation: 'UEFA', group: 'C' },
  { code: 'SCO', name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', group: 'D' },

  // CAF (África) - 9 vagas
  { code: 'MAR', name: 'Marrocos', flag: '🇲🇦', confederation: 'CAF', group: 'E' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF', group: 'F' },
  { code: 'EGY', name: 'Egito', flag: '🇪🇬', confederation: 'CAF', group: 'G' },
  { code: 'NGA', name: 'Nigéria', flag: '🇳🇬', confederation: 'CAF', group: 'H' },
  { code: 'ALG', name: 'Argélia', flag: '🇩🇿', confederation: 'CAF', group: 'I' },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮', confederation: 'CAF', group: 'J' },
  { code: 'TUN', name: 'Tunísia', flag: '🇹🇳', confederation: 'CAF', group: 'K' },
  { code: 'CMR', name: 'Camarões', flag: '🇨🇲', confederation: 'CAF', group: 'L' },
  { code: 'GHA', name: 'Gana', flag: '🇬🇭', confederation: 'CAF', group: 'A' },

  // AFC (Ásia) - 8 vagas
  { code: 'JPN', name: 'Japão', flag: '🇯🇵', confederation: 'AFC', group: 'B' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', confederation: 'AFC', group: 'C' },
  { code: 'IRN', name: 'Irã', flag: '🇮🇷', confederation: 'AFC', group: 'D' },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺', confederation: 'AFC', group: 'E' },
  { code: 'KSA', name: 'Arábia Saudita', flag: '🇸🇦', confederation: 'AFC', group: 'F' },
  { code: 'QAT', name: 'Catar', flag: '🇶🇦', confederation: 'AFC', group: 'G' },
  { code: 'UZB', name: 'Uzbequistão', flag: '🇺🇿', confederation: 'AFC', group: 'H' },
  { code: 'JOR', name: 'Jordânia', flag: '🇯🇴', confederation: 'AFC', group: 'I' },
  { code: 'IRQ', name: 'Iraque', flag: '🇮🇶', confederation: 'AFC', group: 'J' },

  // CONCACAF extras
  { code: 'CRC', name: 'Costa Rica', flag: '🇨🇷', confederation: 'CONCACAF', group: 'K' },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦', confederation: 'CONCACAF', group: 'L' },
  { code: 'JAM', name: 'Jamaica', flag: '🇯🇲', confederation: 'CONCACAF', group: 'K' },

  // OFC (Oceania) - 1 vaga
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿', confederation: 'OFC', group: 'L' }
];
