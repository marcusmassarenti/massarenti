// 980 figurinhas - Álbum Panini Copa do Mundo 2026
// Numeração POR SELEÇÃO: cada país tem 20 figurinhas (1 a 20)
// Total: 20 (intro/FWC) + 48 seleções × 20 = 980
(function () {
  const stickers = [];
  const pad = (n) => String(n).padStart(2, '0');

  // ============ SEÇÃO INTRODUÇÃO (FWC 00–19) ============
  const introDescriptions = [
    'Troféu da Copa', 'Logo Oficial', 'Bola Oficial Adidas', 'Pôster Oficial',
    'Mascote Maple', 'Mascote Zayu', 'Mascote Clutch',
    'MetLife Stadium (NY)', 'SoFi Stadium (LA)', 'AT&T Stadium (Dallas)',
    'Mercedes-Benz (Atlanta)', 'Estádio Azteca (CDMX)', 'BMO Field (Toronto)',
    'BC Place (Vancouver)', 'Lumen Field (Seattle)', 'Hard Rock (Miami)',
    'Lincoln Financial (Filadélfia)', 'NRG (Houston)', 'Levi\'s (S.F.)', 'Arrowhead (Kansas City)'
  ];
  for (let i = 0; i < 20; i++) {
    stickers.push({
      number: i + 1,
      localNumber: i, // FWC-00 até FWC-19 (como no álbum oficial)
      section: 'intro',
      sectionName: 'Introdução',
      country: null,
      code: 'FWC',
      name: `FWC-${pad(i)}`,
      description: introDescriptions[i],
      type: i < 4 ? 'capa' : (i < 7 ? 'mascote' : 'estádio'),
      shiny: i < 7
    });
  }

  // ============ SELEÇÕES (21–980) - 48 × 20 figurinhas ============
  // Por seleção: 1 escudo + 1 foto equipe + 17 jogadores + 1 técnico = 20
  let num = 21;
  window.COUNTRIES.forEach((country) => {
    for (let i = 1; i <= 20; i++) {
      let type, description;
      if (i === 1) { type = 'escudo'; description = 'Escudo da seleção'; }
      else if (i === 2) { type = 'equipe'; description = 'Foto da equipe'; }
      else if (i === 20) { type = 'técnico'; description = 'Técnico'; }
      else { type = 'jogador'; description = `Jogador #${i - 2}`; }

      stickers.push({
        number: num++,
        localNumber: i,
        section: country.code,
        sectionName: country.name,
        country: country.code,
        code: country.code,
        name: `${country.code}-${pad(i)}`,
        description,
        type,
        shiny: i === 1
      });
    }
  });

  // ============ COCA-COLA (CC-01 a CC-14) - 14 figurinhas bônus ============
  const ccDescriptions = [
    'Coca-Cola Oficial', 'Garrafa Histórica', 'Lata Edição Copa',
    'Polar Bears', 'Onda Coca', 'Coca Zero', 'Sprite Brasil',
    'Fanta Laranja Copa', 'Coca-Cola Vintage', 'Logo 100 anos',
    'Mascote Coca', 'Coca + Troféu', 'Caminhão Coca', 'Patrocínio Oficial'
  ];
  for (let i = 1; i <= 14; i++) {
    stickers.push({
      number: num++,
      localNumber: i,
      section: 'cocacola',
      sectionName: 'Coca-Cola',
      country: null,
      code: 'CC',
      name: `CC-${pad(i)}`,
      description: ccDescriptions[i - 1] || `Coca-Cola #${i}`,
      type: 'cocacola',
      shiny: true
    });
  }

  window.STICKERS = stickers;
  window.STICKERS_TOTAL = stickers.length;
})();
