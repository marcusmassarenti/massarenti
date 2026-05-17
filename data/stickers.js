// 980 figurinhas - Álbum oficial Panini Copa do Mundo 2026
// Estrutura: 20 intro + 48 seleções × 18 figurinhas (864) + 96 especiais = 980
(function () {
  const stickers = [];

  // ============ SEÇÃO INTRODUÇÃO/CAPA (1–20) ============
  const intro = [
    'Troféu da Copa do Mundo',
    'Mascote Oficial - Maple',
    'Mascote Oficial - Zayu',
    'Mascote Oficial - Clutch',
    'Logo Oficial da Copa 2026',
    'Bola Oficial Adidas',
    'MetLife Stadium - Nova York',
    'SoFi Stadium - Los Angeles',
    'AT&T Stadium - Dallas',
    'Mercedes-Benz Stadium - Atlanta',
    'Estádio Azteca - Cidade do México',
    'BMO Field - Toronto',
    'BC Place - Vancouver',
    'Lumen Field - Seattle',
    'Hard Rock Stadium - Miami',
    'Lincoln Financial Field - Filadélfia',
    'NRG Stadium - Houston',
    'Levi\'s Stadium - São Francisco',
    'Arrowhead Stadium - Kansas City',
    'Gillette Stadium - Boston'
  ];
  intro.forEach((name, i) => {
    stickers.push({
      number: i + 1,
      section: 'intro',
      sectionName: 'Introdução',
      country: null,
      name,
      type: i < 4 ? 'mascote' : (i >= 6 ? 'estádio' : 'capa'),
      shiny: i < 6
    });
  });

  // ============ SEÇÕES POR SELEÇÃO (21–884) ============
  // Cada seleção: 1 escudo + 1 foto da equipe + 16 jogadores = 18 figurinhas
  const playerRoles = [
    'Capitão', 'Goleiro', 'Zagueiro', 'Zagueiro',
    'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meio-campo',
    'Meio-campo', 'Meio-campo Ofensivo', 'Ponta Direita', 'Ponta Esquerda',
    'Atacante', 'Atacante', 'Reserva', 'Técnico'
  ];

  // Nomes reais dos principais jogadores por seleção (alguns)
  const realPlayers = {
    BRA: ['Vinícius Jr.', 'Alisson', 'Marquinhos', 'Gabriel Magalhães', 'Danilo', 'Wendell', 'Casemiro', 'Bruno Guimarães', 'Lucas Paquetá', 'Rodrygo', 'Raphinha', 'Neymar Jr.', 'Endrick', 'Richarlison', 'Pedro', 'Dorival Júnior'],
    ARG: ['Lionel Messi', 'Emiliano Martínez', 'Cristian Romero', 'Lisandro Martínez', 'Nahuel Molina', 'Nicolás Tagliafico', 'Rodrigo De Paul', 'Enzo Fernández', 'Alexis Mac Allister', 'Ángel Di María', 'Lautaro Martínez', 'Julián Álvarez', 'Paulo Dybala', 'Nicolás González', 'Thiago Almada', 'Lionel Scaloni'],
    FRA: ['Kylian Mbappé', 'Mike Maignan', 'William Saliba', 'Dayot Upamecano', 'Jules Koundé', 'Theo Hernández', 'Aurélien Tchouaméni', 'Eduardo Camavinga', 'Antoine Griezmann', 'Ousmane Dembélé', 'Marcus Thuram', 'Randal Kolo Muani', 'Bradley Barcola', 'Warren Zaïre-Emery', 'Ibrahima Konaté', 'Didier Deschamps'],
    ENG: ['Harry Kane', 'Jordan Pickford', 'John Stones', 'Marc Guéhi', 'Kyle Walker', 'Luke Shaw', 'Declan Rice', 'Jude Bellingham', 'Phil Foden', 'Bukayo Saka', 'Cole Palmer', 'Anthony Gordon', 'Ollie Watkins', 'Trent Alexander-Arnold', 'Kobbie Mainoo', 'Thomas Tuchel'],
    POR: ['Cristiano Ronaldo', 'Diogo Costa', 'Rúben Dias', 'Pepe', 'João Cancelo', 'Nuno Mendes', 'Bruno Fernandes', 'Bernardo Silva', 'Vitinha', 'João Félix', 'Rafael Leão', 'Diogo Jota', 'Gonçalo Ramos', 'Pedro Neto', 'Rúben Neves', 'Roberto Martínez'],
    ESP: ['Lamine Yamal', 'Unai Simón', 'Aymeric Laporte', 'Robin Le Normand', 'Dani Carvajal', 'Marc Cucurella', 'Rodri', 'Pedri', 'Fabián Ruiz', 'Mikel Merino', 'Nico Williams', 'Dani Olmo', 'Álvaro Morata', 'Ferran Torres', 'Mikel Oyarzabal', 'Luis de la Fuente'],
    GER: ['Florian Wirtz', 'Manuel Neuer', 'Antonio Rüdiger', 'Jonathan Tah', 'Joshua Kimmich', 'David Raum', 'Toni Kroos', 'İlkay Gündoğan', 'Jamal Musiala', 'Leroy Sané', 'Kai Havertz', 'Niclas Füllkrug', 'Thomas Müller', 'Pascal Groß', 'Maximilian Mittelstädt', 'Julian Nagelsmann'],
    NED: ['Virgil van Dijk', 'Bart Verbruggen', 'Stefan de Vrij', 'Nathan Aké', 'Denzel Dumfries', 'Daley Blind', 'Frenkie de Jong', 'Tijjani Reijnders', 'Cody Gakpo', 'Memphis Depay', 'Xavi Simons', 'Donyell Malen', 'Wout Weghorst', 'Joey Veerman', 'Jerdy Schouten', 'Ronald Koeman'],
    ITA: ['Gianluigi Donnarumma', 'Alessandro Bastoni', 'Riccardo Calafiori', 'Giovanni Di Lorenzo', 'Federico Dimarco', 'Jorginho', 'Nicolò Barella', 'Davide Frattesi', 'Federico Chiesa', 'Lorenzo Pellegrini', 'Mateo Retegui', 'Giacomo Raspadori', 'Gianluca Scamacca', 'Sandro Tonali', 'Bryan Cristante', 'Luciano Spalletti'],
    CRO: ['Luka Modrić', 'Dominik Livaković', 'Joško Gvardiol', 'Josip Šutalo', 'Josip Stanišić', 'Borna Sosa', 'Mateo Kovačić', 'Marcelo Brozović', 'Mario Pašalić', 'Andrej Kramarić', 'Ivan Perišić', 'Bruno Petković', 'Luka Sučić', 'Lovro Majer', 'Petar Sucic', 'Zlatko Dalić'],
    MEX: ['Hirving Lozano', 'Guillermo Ochoa', 'Edson Álvarez', 'César Montes', 'Jorge Sánchez', 'Jesús Gallardo', 'Luis Romo', 'Orbelín Pineda', 'Diego Lainez', 'Raúl Jiménez', 'Henry Martín', 'Santiago Giménez', 'Julián Quiñones', 'Uriel Antuna', 'Luis Chávez', 'Javier Aguirre'],
    USA: ['Christian Pulisic', 'Matt Turner', 'Chris Richards', 'Tim Ream', 'Sergiño Dest', 'Antonee Robinson', 'Tyler Adams', 'Weston McKennie', 'Yunus Musah', 'Gio Reyna', 'Timothy Weah', 'Folarin Balogun', 'Ricardo Pepi', 'Brenden Aaronson', 'Malik Tillman', 'Mauricio Pochettino'],
    CAN: ['Alphonso Davies', 'Milan Borjan', 'Steven Vitória', 'Alistair Johnston', 'Sam Adekugbe', 'Richie Laryea', 'Stephen Eustáquio', 'Jonathan Osorio', 'Tajon Buchanan', 'Cyle Larin', 'Jonathan David', 'Lucas Cavallini', 'Junior Hoilett', 'Atiba Hutchinson', 'Ismaël Koné', 'Jesse Marsch'],
    URU: ['Federico Valverde', 'Sergio Rochet', 'José María Giménez', 'Ronald Araújo', 'Mathías Olivera', 'Nahitan Nández', 'Manuel Ugarte', 'Rodrigo Bentancur', 'Giorgian de Arrascaeta', 'Maximiliano Araújo', 'Darwin Núñez', 'Luis Suárez', 'Edinson Cavani', 'Facundo Pellistri', 'Maxi Gómez', 'Marcelo Bielsa'],
    COL: ['James Rodríguez', 'Camilo Vargas', 'Davinson Sánchez', 'Yerson Mosquera', 'Daniel Muñoz', 'Johan Mojica', 'Jefferson Lerma', 'Richard Ríos', 'Juan Fernando Quintero', 'Luis Díaz', 'Jhon Arias', 'Rafael Santos Borré', 'Jhon Córdoba', 'John Janer Lucumí', 'Mateus Uribe', 'Néstor Lorenzo'],
    JPN: ['Takefusa Kubo', 'Zion Suzuki', 'Ko Itakura', 'Shogo Taniguchi', 'Hiroki Itō', 'Yukinari Sugawara', 'Wataru Endō', 'Hidemasa Morita', 'Daichi Kamada', 'Ritsu Doan', 'Kaoru Mitoma', 'Junya Itō', 'Daizen Maeda', 'Ayase Ueda', 'Takumi Minamino', 'Hajime Moriyasu'],
    KOR: ['Son Heung-min', 'Kim Seung-gyu', 'Kim Min-jae', 'Kim Young-gwon', 'Kim Moon-hwan', 'Lee Ki-je', 'Hwang In-beom', 'Lee Jae-sung', 'Lee Kang-in', 'Hwang Hee-chan', 'Cho Gue-sung', 'Oh Hyeon-gyu', 'Hwang Ui-jo', 'Paik Seung-ho', 'Seol Young-woo', 'Hong Myung-bo'],
    MAR: ['Achraf Hakimi', 'Yassine Bounou', 'Romain Saïss', 'Nayef Aguerd', 'Noussair Mazraoui', 'Adam Masina', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Hakim Ziyech', 'Youssef En-Nesyri', 'Brahim Díaz', 'Bilal El Khannouss', 'Ayoub El Kaabi', 'Eliesse Ben Seghir', 'Selim Amallah', 'Walid Regragui'],
    BEL: ['Kevin De Bruyne', 'Thibaut Courtois', 'Wout Faes', 'Jan Vertonghen', 'Timothy Castagne', 'Arthur Theate', 'Amadou Onana', 'Youri Tielemans', 'Jérémy Doku', 'Romelu Lukaku', 'Leandro Trossard', 'Charles De Ketelaere', 'Dodi Lukebakio', 'Maxim De Cuyper', 'Loïs Openda', 'Domenico Tedesco']
  };

  // Países adicionais - escolhemos um destaque conhecido por seleção
  const starPlayer = {
    SUI: 'Granit Xhaka', DEN: 'Christian Eriksen', AUT: 'David Alaba', POL: 'Robert Lewandowski',
    NOR: 'Erling Haaland', TUR: 'Hakan Çalhanoğlu', SCO: 'Andy Robertson',
    SEN: 'Sadio Mané', EGY: 'Mohamed Salah', NGA: 'Victor Osimhen', ALG: 'Riyad Mahrez',
    CIV: 'Sébastien Haller', TUN: 'Hannibal Mejbri', CMR: 'André Onana', GHA: 'Mohammed Kudus',
    IRN: 'Mehdi Taremi', AUS: 'Mathew Ryan', KSA: 'Salem Al-Dawsari', QAT: 'Akram Afif',
    UZB: 'Eldor Shomurodov', JOR: 'Mousa Al-Tamari', CRC: 'Keylor Navas', PAN: 'José Fajardo',
    JAM: 'Leon Bailey', NZL: 'Chris Wood', ECU: 'Enner Valencia', PAR: 'Miguel Almirón',
    VEN: 'Salomón Rondón', IRQ: 'Aymen Hussein'
  };

  let num = 21;
  window.COUNTRIES.forEach((country) => {
    // Figurinha 1: escudo
    stickers.push({
      number: num++, section: country.code, sectionName: country.name,
      country: country.code, name: `Escudo da Seleção - ${country.name}`,
      type: 'escudo', shiny: true
    });
    // Figurinha 2: foto da equipe
    stickers.push({
      number: num++, section: country.code, sectionName: country.name,
      country: country.code, name: `Equipe ${country.name}`,
      type: 'equipe', shiny: false
    });
    // 16 jogadores
    const players = realPlayers[country.code];
    for (let i = 0; i < 16; i++) {
      let playerName;
      if (players && players[i]) {
        playerName = players[i];
      } else if (i === 0 && starPlayer[country.code]) {
        playerName = starPlayer[country.code];
      } else {
        playerName = `${country.name} - ${playerRoles[i]}`;
      }
      stickers.push({
        number: num++, section: country.code, sectionName: country.name,
        country: country.code, name: playerName,
        type: i === 15 ? 'técnico' : (i === 0 ? 'capitão' : 'jogador'),
        shiny: false
      });
    }
  });

  // ============ FIGURINHAS ESPECIAIS / LENDAS (885–980) ============
  // 96 figurinhas especiais: 48 lendas + 24 brilhantes (uma estrela por grupo) + 24 momentos históricos
  const legends = [
    { name: 'Pelé - Brasil', country: 'BRA' },
    { name: 'Diego Maradona - Argentina', country: 'ARG' },
    { name: 'Zinedine Zidane - França', country: 'FRA' },
    { name: 'Bobby Charlton - Inglaterra', country: 'ENG' },
    { name: 'Eusébio - Portugal', country: 'POR' },
    { name: 'Andrés Iniesta - Espanha', country: 'ESP' },
    { name: 'Franz Beckenbauer - Alemanha', country: 'GER' },
    { name: 'Johan Cruyff - Holanda', country: 'NED' },
    { name: 'Paolo Maldini - Itália', country: 'ITA' },
    { name: 'Davor Šuker - Croácia', country: 'CRO' },
    { name: 'Hugo Sánchez - México', country: 'MEX' },
    { name: 'Landon Donovan - EUA', country: 'USA' },
    { name: 'Dwayne De Rosario - Canadá', country: 'CAN' },
    { name: 'Enzo Francescoli - Uruguai', country: 'URU' },
    { name: 'Carlos Valderrama - Colômbia', country: 'COL' },
    { name: 'Hidetoshi Nakata - Japão', country: 'JPN' },
    { name: 'Cha Bum-kun - Coreia do Sul', country: 'KOR' },
    { name: 'Mustapha Hadji - Marrocos', country: 'MAR' },
    { name: 'Eden Hazard - Bélgica', country: 'BEL' },
    { name: 'Stéphane Chapuisat - Suíça', country: 'SUI' },
    { name: 'Michael Laudrup - Dinamarca', country: 'DEN' },
    { name: 'Hans Krankl - Áustria', country: 'AUT' },
    { name: 'Zbigniew Boniek - Polônia', country: 'POL' },
    { name: 'Rune Bratseth - Noruega', country: 'NOR' },
    { name: 'Hakan Şükür - Turquia', country: 'TUR' },
    { name: 'Kenny Dalglish - Escócia', country: 'SCO' },
    { name: 'El Hadji Diouf - Senegal', country: 'SEN' },
    { name: 'Mohamed Aboutrika - Egito', country: 'EGY' },
    { name: 'Jay-Jay Okocha - Nigéria', country: 'NGA' },
    { name: 'Rabah Madjer - Argélia', country: 'ALG' },
    { name: 'Didier Drogba - Costa do Marfim', country: 'CIV' },
    { name: 'Wahbi Khazri - Tunísia', country: 'TUN' },
    { name: 'Samuel Eto\'o - Camarões', country: 'CMR' },
    { name: 'Abedi Pelé - Gana', country: 'GHA' },
    { name: 'Ali Daei - Irã', country: 'IRN' },
    { name: 'Tim Cahill - Austrália', country: 'AUS' },
    { name: 'Sami Al-Jaber - Arábia Saudita', country: 'KSA' },
    { name: 'Mohammed Munir - Catar', country: 'QAT' },
    { name: 'Server Djeparov - Uzbequistão', country: 'UZB' },
    { name: 'Hassan Abdel-Fattah - Jordânia', country: 'JOR' },
    { name: 'Paulo Wanchope - Costa Rica', country: 'CRC' },
    { name: 'Luis Tejada - Panamá', country: 'PAN' },
    { name: 'Walter Boyd - Jamaica', country: 'JAM' },
    { name: 'Wynton Rufer - Nova Zelândia', country: 'NZL' },
    { name: 'Antonio Valencia - Equador', country: 'ECU' },
    { name: 'Roque Santa Cruz - Paraguai', country: 'PAR' },
    { name: 'Juan Arango - Venezuela', country: 'VEN' },
    { name: 'Asamoah Gyan - Gana', country: 'GHA' }
  ];

  legends.forEach((l) => {
    stickers.push({
      number: num++, section: 'lendas', sectionName: 'Lendas',
      country: l.country, name: l.name, type: 'lenda', shiny: true
    });
  });

  // 24 figurinhas brilhantes (estrelas de cada grupo + extras)
  const shinies = [
    'Estrela do Grupo A', 'Estrela do Grupo B', 'Estrela do Grupo C', 'Estrela do Grupo D',
    'Estrela do Grupo E', 'Estrela do Grupo F', 'Estrela do Grupo G', 'Estrela do Grupo H',
    'Estrela do Grupo I', 'Estrela do Grupo J', 'Estrela do Grupo K', 'Estrela do Grupo L',
    'Artilheiro da Copa', 'Melhor Jogador', 'Melhor Goleiro', 'Melhor Jovem',
    'Bola de Ouro', 'Bola de Prata', 'Bola de Bronze', 'Chuteira de Ouro',
    'Luva de Ouro', 'Prêmio Fair Play', 'Gol Mais Bonito', 'Defesa do Torneio'
  ];
  shinies.forEach((s) => {
    stickers.push({
      number: num++, section: 'brilhantes', sectionName: 'Brilhantes',
      country: null, name: s, type: 'brilhante', shiny: true
    });
  });

  // 24 momentos históricos
  const moments = [
    'Final 1930 - Uruguai x Argentina', 'Final 1950 - Maracanazo',
    'Final 1958 - Pelé estreia', 'Final 1962 - Bicampeão Brasil',
    'Final 1966 - Inglaterra Campeã', 'Final 1970 - Brasil Tricampeão',
    'Final 1974 - Alemanha Ocidental', 'Final 1978 - Argentina em casa',
    'Final 1982 - Itália Campeã', 'Final 1986 - Maradona Mágico',
    'Final 1990 - Alemanha Ocidental', 'Final 1994 - Brasil Tetra',
    'Final 1998 - França em casa', 'Final 2002 - Brasil Penta',
    'Final 2006 - Itália Campeã', 'Final 2010 - Espanha Campeã',
    'Final 2014 - Alemanha Tetra', 'Final 2018 - França Bicampeã',
    'Final 2022 - Argentina Tricampeã', 'Abertura 2026 - Cidade do México',
    'Final 2026 - MetLife Stadium', 'Cerimônia de Abertura',
    'Bola Oficial - Detalhe', 'Pôster Oficial da Copa'
  ];
  moments.forEach((m) => {
    stickers.push({
      number: num++, section: 'momentos', sectionName: 'Momentos Históricos',
      country: null, name: m, type: 'momento', shiny: false
    });
  });

  window.STICKERS = stickers;
  window.STICKERS_TOTAL = stickers.length;
})();
