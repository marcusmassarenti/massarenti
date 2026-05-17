// 48 países da Copa do Mundo FIFA 2026 (EUA, Canadá, México)
// Grupos OFICIAIS sorteados pela FIFA
window.COUNTRIES = [
  // ===== GRUPO A =====
  { code: 'MEX', name: 'México', flag: '🇲🇽', confederation: 'CONCACAF', group: 'A' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', confederation: 'AFC', group: 'A' },
  { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', confederation: 'CAF', group: 'A' },
  { code: 'CZE', name: 'República Tcheca', flag: '🇨🇿', confederation: 'UEFA', group: 'A' },

  // ===== GRUPO B =====
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦', confederation: 'CONCACAF', group: 'B' },
  { code: 'SUI', name: 'Suíça', flag: '🇨🇭', confederation: 'UEFA', group: 'B' },
  { code: 'QAT', name: 'Catar', flag: '🇶🇦', confederation: 'AFC', group: 'B' },
  { code: 'BIH', name: 'Bósnia e Herzegovina', flag: '🇧🇦', confederation: 'UEFA', group: 'B' },

  // ===== GRUPO C =====
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷', confederation: 'CONMEBOL', group: 'C' },
  { code: 'MAR', name: 'Marrocos', flag: '🇲🇦', confederation: 'CAF', group: 'C' },
  { code: 'SCO', name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', group: 'C' },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹', confederation: 'CONCACAF', group: 'C' },

  // ===== GRUPO D =====
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', confederation: 'CONCACAF', group: 'D' },
  { code: 'TUR', name: 'Turquia', flag: '🇹🇷', confederation: 'UEFA', group: 'D' },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺', confederation: 'AFC', group: 'D' },
  { code: 'PAR', name: 'Paraguai', flag: '🇵🇾', confederation: 'CONMEBOL', group: 'D' },

  // ===== GRUPO E =====
  { code: 'GER', name: 'Alemanha', flag: '🇩🇪', confederation: 'UEFA', group: 'E' },
  { code: 'ECU', name: 'Equador', flag: '🇪🇨', confederation: 'CONMEBOL', group: 'E' },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮', confederation: 'CAF', group: 'E' },
  { code: 'CUW', name: 'Curaçao', flag: '🇨🇼', confederation: 'CONCACAF', group: 'E' },

  // ===== GRUPO F =====
  { code: 'NED', name: 'Holanda', flag: '🇳🇱', confederation: 'UEFA', group: 'F' },
  { code: 'JPN', name: 'Japão', flag: '🇯🇵', confederation: 'AFC', group: 'F' },
  { code: 'SWE', name: 'Suécia', flag: '🇸🇪', confederation: 'UEFA', group: 'F' },
  { code: 'TUN', name: 'Tunísia', flag: '🇹🇳', confederation: 'CAF', group: 'F' },

  // ===== GRUPO G =====
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', confederation: 'UEFA', group: 'G' },
  { code: 'IRN', name: 'Irã', flag: '🇮🇷', confederation: 'AFC', group: 'G' },
  { code: 'EGY', name: 'Egito', flag: '🇪🇬', confederation: 'CAF', group: 'G' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿', confederation: 'OFC', group: 'G' },

  // ===== GRUPO H =====
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸', confederation: 'UEFA', group: 'H' },
  { code: 'URU', name: 'Uruguai', flag: '🇺🇾', confederation: 'CONMEBOL', group: 'H' },
  { code: 'KSA', name: 'Arábia Saudita', flag: '🇸🇦', confederation: 'AFC', group: 'H' },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻', confederation: 'CAF', group: 'H' },

  // ===== GRUPO I =====
  { code: 'FRA', name: 'França', flag: '🇫🇷', confederation: 'UEFA', group: 'I' },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴', confederation: 'UEFA', group: 'I' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF', group: 'I' },
  { code: 'IRQ', name: 'Iraque', flag: '🇮🇶', confederation: 'AFC', group: 'I' },

  // ===== GRUPO J =====
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', group: 'J' },
  { code: 'AUT', name: 'Áustria', flag: '🇦🇹', confederation: 'UEFA', group: 'J' },
  { code: 'ALG', name: 'Argélia', flag: '🇩🇿', confederation: 'CAF', group: 'J' },
  { code: 'JOR', name: 'Jordânia', flag: '🇯🇴', confederation: 'AFC', group: 'J' },

  // ===== GRUPO K =====
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', group: 'K' },
  { code: 'COL', name: 'Colômbia', flag: '🇨🇴', confederation: 'CONMEBOL', group: 'K' },
  { code: 'UZB', name: 'Uzbequistão', flag: '🇺🇿', confederation: 'AFC', group: 'K' },
  { code: 'COD', name: 'RD Congo', flag: '🇨🇩', confederation: 'CAF', group: 'K' },

  // ===== GRUPO L =====
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', group: 'L' },
  { code: 'CRO', name: 'Croácia', flag: '🇭🇷', confederation: 'UEFA', group: 'L' },
  { code: 'GHA', name: 'Gana', flag: '🇬🇭', confederation: 'CAF', group: 'L' },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦', confederation: 'CONCACAF', group: 'L' }
];
