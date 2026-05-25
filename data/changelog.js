// Changelog - mostra na tela inicial quando usuário entrar e ver atualizações novas
// Ordem: mais nova primeiro. version cresce a cada release.
window.APP_VERSION = 75;
window.CHANGELOG = [
  {
    version: 75,
    date: '25/mai',
    title: '🔐 Anti força-bruta no login',
    items: [
      '🛡️ Depois de 5 PINs errados, o nome fica bloqueado por 5 minutos',
      '⏱️ Robô tentando adivinhar PIN agora levaria meses (antes: 5min)'
    ]
  },
  {
    version: 74,
    date: '25/mai',
    title: '🔒 Segurança reforçada',
    items: [
      '🛡️ PIN nunca mais sai do servidor (login agora valida no Supabase)',
      '🔐 Todas as escritas (figurinhas, grupos, trocas, chat) exigem PIN',
      '👮 Painel admin só funciona se o PIN do Cauã bater'
    ]
  },
  {
    version: 73,
    date: '25/mai',
    title: '🌍 Chat Geral',
    items: [
      '🌍 Aba "Geral" no chat: fale com QUALQUER pessoa do app, mesmo fora dos seus grupos',
      '👥 A aba do seu grupo continua disponível pra papos privados',
      '🔔 Contador vermelho mostra mensagens não lidas em cada aba'
    ]
  },
  {
    version: 72,
    date: '25/mai',
    title: '✨ Trocas melhoradas',
    items: [
      '🥇 Figurinhas brilhantes (01) ficam douradas no painel de trocas',
      '💬 Selecione as figurinhas do amigo e avise direto no chat',
      '🔒 Seleções e cards abertos não somem mais ao atualizar'
    ]
  },
  {
    version: 71,
    date: '20/mai',
    title: '@ Marcar amigo no chat',
    items: [
      '⌨️ Digite @ no chat e aparece a lista de membros do grupo pra escolher',
      '✨ Mensagens com seu nome marcado ficam com moldura dourada',
      '📣 Notificação especial quando alguém te chama com @',
      '📱 Tela do chat usa 100% da altura (não corta com o teclado aberto)'
    ]
  },
  {
    version: 70,
    date: '20/mai',
    title: '💬 Chat ao vivo do grupo',
    items: [
      '🟢 Conversa em tempo real entre todos os membros do mesmo grupo',
      '🔘 Botão flutuante 💬 no canto inferior direito',
      '🔔 Aparece um contador vermelho com quantas mensagens não lidas',
      '⚡ Mensagens novas aparecem na hora (via Supabase Realtime), sem precisar recarregar'
    ]
  },
  {
    version: 69,
    date: '20/mai',
    title: '✨ Figurinhas especiais destacadas',
    items: [
      '✨ Figurinha #01 de cada país agora aparece como BRILHANTE (escudo holográfico) com ícone de estrelinhas piscando',
      '👥 Figurinha #13 é a FOTO DA SELEÇÃO inteira — moldura preta especial com ícone',
      '🌈 Quando você colar a brilhante, ganha animação de holograma passando'
    ]
  },
  {
    version: 68,
    date: '17/mai',
    title: '📢 Botão de divulgação (admin)',
    silent: true,
    items: [
      '🔒 No painel admin do Cauã, novo botão "Divulgar o app"',
      '✍️ Mensagens prontas pra família, amigos, grupo de pais e versão curta',
      '💬 Compartilha direto no WhatsApp ou copia pra outro lugar'
    ]
  },
  {
    version: 67,
    date: '17/mai',
    title: '👆 Selecionar figurinhas pra trocar',
    items: [
      '⭕ Por padrão NENHUMA figurinha vem marcada',
      '👉 Toca em cada uma pra escolher quais você quer pedir/oferecer',
      '🔢 O botão fica desabilitado até você marcar pelo menos uma'
    ]
  },
  {
    version: 66,
    date: '17/mai',
    title: '📜 Histórico de atualizações',
    items: [
      '❓ No botão FAQ tem agora uma seção "Histórico de atualizações"',
      '📖 Lista todas as melhorias do app pra você consultar quando quiser'
    ]
  },
  {
    version: 65,
    date: '17/mai',
    title: '🎯 Escolher figurinhas pra trocar',
    items: [
      '👆 Toca em cada figurinha pra ligar/desligar antes de mandar o pedido',
      '🔢 O botão mostra quantas você selecionou: "📨 Pedir pelo app (3)"',
      '✨ Vem tudo já marcado — é só desmarcar as que NÃO quer pedir'
    ]
  },
  {
    version: 64,
    date: '17/mai',
    title: '📨 Pedir troca pelo próprio app',
    items: [
      '🟡 Novo botão "Pedir pelo app" em cada amigo: manda um aviso direto, sem precisar do WhatsApp',
      '📬 Quando o amigo abrir o app, vai aparecer um pop-up com seu pedido (com bandeiras, países e números)',
      '✅ Ele pode marcar como "Combinei a troca" ou "Dispensar"',
      '💬 Os botões do WhatsApp continuam disponíveis ao lado'
    ]
  },
  {
    version: 63,
    date: '17/mai',
    title: '💬 Pedir troca pelo WhatsApp',
    items: [
      '📲 Em cada amigo da seção "Trocas possíveis" tem um botão pra mandar mensagem fofa no WhatsApp pedindo as figurinhas',
      '🎁 Outro botão pra avisar o amigo que você tem as repetidas que ele precisa',
      '✨ Mensagens já vêm prontas com bandeira, número e link do app'
    ]
  },
  {
    version: 62,
    date: '17/mai',
    title: '✨ Melhorias rápidas',
    items: [
      '📋 PDF agora lista cada figurinha que falta uma por uma (com ajuste automático de fonte)',
      '💬 Mensagem do WhatsApp mais curta: bandeira + país + números na mesma linha',
      '💰 Lembrete de PIX só ao abrir o app, e a cada 5min se ficar aberto'
    ]
  },
  {
    version: 59,
    date: '17/mai',
    title: '🏆 Comemoração de conquista',
    items: [
      '🎉 Quando completar o álbum 100%, comemoração épica com confete, troféu e mensagem de parabéns',
      '📢 Botão pra compartilhar a conquista no WhatsApp'
    ]
  },
  {
    version: 58,
    date: '17/mai',
    title: '📤 Compartilhar lista',
    items: [
      '📄 Botão pra exportar PDF com tudo que falta (uma página só)',
      '💬 Botão pra mandar a lista no WhatsApp (formatado por seleção)'
    ]
  },
  {
    version: 56,
    date: '17/mai',
    title: '🎉 Tudo isso de novidade!',
    items: [
      '🔄 Trocas inteligentes: cruza minhas repetidas com o que falta pros amigos do grupo',
      '🥤 14 figurinhas Coca-Cola (CC-01 a CC-14) — bônus em vermelho',
      '💰 Lembrete de PIX com mensagem fofa de agradecimento',
      '🔒 Painel admin: marcar quem pagou PIX e ver todos os cadastros',
      '📅 Header agora mostra dia, data e clima ao vivo',
      '🌍 No álbum do amigo, países ordenados do mais cheio pro mais vazio'
    ]
  }
];
