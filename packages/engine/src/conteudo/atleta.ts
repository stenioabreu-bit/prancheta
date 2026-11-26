import {
  montarLeilao,
  montarLivre,
  montarProposta,
  montarRenovacao,
  podeSerConvocado,
} from "../atleta/mercado";
/**
 * Eventos do modo jogador. Cada evento tem gatilho (`requer`), texto com {marcadores} e opções;
 * as opções mexem na vida na hora e agendam consequências (`agendar`) que viram outros eventos depois.
 * Tom adulto e narrativo, sem conteúdo explícito.
 */
import type { DefEvento } from "../atleta/motor";
import { janelaAberta } from "../mercado/valores";

export const EVENTOS_ATLETA: DefEvento[] = [
  // ───────────── Treino ─────────────
  {
    id: "treino-x-familia",
    categoria: "treino",
    titulo: "Aniversário da sua mãe",
    texto:
      "A família inteira vai se reunir no interior para os 60 anos da sua mãe. O problema: é dia de treino tático, e {tecnico} não gosta de ausências.",
    peso: 3,
    intervalo: 40,
    opcoes: [
      {
        texto: "Faltar o treino e ir à festa",
        dica: "Família e moral sobem; o técnico não vai gostar",
        efeito: {
          vida: { familia: 12, moral: 6, tecnico: -9 },
          marcar: { "faltou-treino": 8 },
          agendar: [{ evento: "tecnico-desconfiado", em: [1, 4], chance: 0.7 }],
        },
        resultado: "Sua mãe chorou quando você chegou. No CT, a cadeira vazia foi notada.",
      },
      {
        texto: "Treinar e mandar um vídeo",
        efeito: { vida: { familia: -8, tecnico: 3, forma: 1 } },
        resultado: "O vídeo foi exibido no telão da festa. Ficou um gosto amargo.",
        auto: true,
      },
      {
        texto: "Pedir liberação ao técnico",
        efeito: { vida: { familia: 10, tecnico: -2 } },
        resultado: "{tecnico} liberou, mas avisou que é a última vez.",
        sorte: {
          p: (c) => c.a.vida.tecnico / 100,
          senao: {
            efeito: { vida: { familia: -6, moral: -4 } },
            resultado: "Pedido negado. Você treinou de cara fechada.",
          },
        },
      },
    ],
  },
  {
    id: "tecnico-desconfiado",
    categoria: "treino",
    titulo: "O técnico está de olho",
    texto:
      '{tecnico} chamou você no canto do campo: "Quem não está comprometido não joga". Os titulares do coletivo de hoje não incluem o seu nome.',
    agendado: true,
    requer: { marcas: ["faltou-treino"] },
    opcoes: [
      {
        texto: "Pedir desculpas e treinar dobrado",
        efeito: { vida: { tecnico: 10, moral: -3, forma: 2 }, treino: 2 },
        resultado: "O recado foi entendido. Você voltou ao time do coletivo na sexta.",
        auto: true,
      },
      {
        texto: "Bater de frente",
        efeito: {
          vida: { tecnico: -14, moral: 2, elenco: -3 },
          marcar: { barrado: 4 },
          agendar: [{ evento: "vazou-briga-tecnico", em: [1, 2], chance: 0.5 }],
        },
        resultado: "A conversa subiu de tom. Você vai para o banco nas próximas semanas.",
      },
      {
        texto: "Aceitar calado",
        efeito: { vida: { tecnico: 2, moral: -5 }, marcar: { barrado: 1 } },
        resultado: "Uma semana de banco e a página virou.",
      },
    ],
  },
  {
    id: "vazou-briga-tecnico",
    categoria: "imprensa",
    titulo: "Vazou a discussão com o técnico",
    texto:
      "Um programa de rádio contou detalhes da sua discussão com {tecnico}. Os repórteres esperam na saída do CT.",
    agendado: true,
    opcoes: [
      {
        texto: 'Minimizar: "Coisa de vestiário"',
        efeito: { vida: { imprensa: 3, tecnico: 4 } },
        resultado: "A história esfriou em dois dias.",
        auto: true,
      },
      {
        texto: "Confirmar e criticar o técnico",
        efeito: {
          vida: { torcida: 3, tecnico: -15, imprensa: 6, reputacao: -6 },
          marcar: { barrado: 6 },
          noticia: { texto: "Crise no vestiário: atacante critica o técnico publicamente.", tipo: "ruim" },
        },
        resultado: "A manchete foi sua. O técnico respondeu deixando você fora.",
      },
    ],
  },
  {
    id: "treino-extra",
    categoria: "treino",
    titulo: "Convite do preparador físico",
    texto:
      "O preparador propõe um programa de treino extra às 6h da manhã, três vezes por semana, por um mês.",
    peso: 3,
    intervalo: 20,
    opcoes: [
      {
        texto: "Topar o programa",
        dica: "Evolução e forma; menos tempo em casa",
        efeito: {
          vida: { forma: 5, tecnico: 4, familia: -4 },
          treino: 4,
          agendar: [{ evento: "corpo-cobra", em: [3, 6], chance: 0.15 }],
        },
        resultado: "Um mês acordando no escuro. O corpo respondeu.",
        auto: true,
      },
      {
        texto: "Agradecer e recusar",
        efeito: { vida: { familia: 2 } },
        resultado: "Você preferiu o descanso.",
      },
    ],
  },
  {
    id: "corpo-cobra",
    categoria: "saude",
    titulo: "O corpo cobrou",
    texto: "Uma fisgada na posterior da coxa no fim do treino. O departamento médico pede exames.",
    agendado: true,
    opcoes: [
      {
        texto: "Parar e tratar",
        efeito: { lesao: 2, vida: { forma: -3 } },
        resultado: "Estiramento leve: duas semanas fora.",
        auto: true,
      },
      {
        texto: "Esconder e seguir treinando",
        efeito: { vida: { tecnico: 2 } },
        resultado: "A dor sumiu sozinha. Dessa vez.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { lesao: 6, vida: { tecnico: -6, moral: -6 } },
            resultado: "A lesão piorou: seis semanas fora.",
          },
        },
      },
    ],
  },
  {
    id: "nutricionista",
    categoria: "treino",
    titulo: "Dieta nova",
    texto:
      "A nutricionista do clube monta um plano rígido: sem açúcar, sem álcool, horários fixos. Custa caro manter um cozinheiro em casa.",
    peso: 2,
    intervalo: 50,
    opcoes: [
      {
        texto: "Contratar um cozinheiro e seguir o plano",
        efeito: {
          vida: { forma: 7, vicios: -6, moral: -2 },
          gastoFixo: { motivo: "Cozinheiro particular", fracao: 0.04 },
          marcar: { "atleta-regrado": 30 },
        },
        resultado: "Três quilos a menos e mais pique no segundo tempo.",
        auto: true,
      },
      {
        texto: "Ignorar",
        efeito: { vida: { forma: -2 } },
        resultado: "Churrasco de domingo continua garantido.",
      },
    ],
  },
  {
    id: "briga-treino",
    categoria: "vestiario",
    titulo: "Entrada dura no treino",
    texto: "Um companheiro deu uma entrada forte em você no rachão. O elenco parou para ver a sua reação.",
    peso: 2,
    intervalo: 25,
    opcoes: [
      {
        texto: "Levantar e seguir",
        efeito: { vida: { elenco: 3, reputacao: 2 } },
        resultado: "Ninguém comentou mais.",
        auto: true,
      },
      {
        texto: "Partir para cima",
        efeito: {
          vida: { elenco: -10, tecnico: -6, moral: 3 },
          marcar: { "briga-elenco": 20 },
          agendar: [{ evento: "vestiario-dividido", em: [2, 5], chance: 0.6 }],
        },
        resultado: "Os seguranças separaram. O vídeo circula no grupo do elenco.",
      },
      {
        texto: "Cobrar na conversa depois",
        efeito: { vida: { elenco: 5, reputacao: 3 } },
        resultado: "Ele pediu desculpas. Saíram para jantar no fim de semana.",
      },
    ],
  },
  {
    id: "vestiario-dividido",
    categoria: "vestiario",
    titulo: "Vestiário dividido",
    texto:
      "Depois da briga, parte do elenco não passa a bola pra você nem no aquecimento. O capitão quer uma conversa.",
    agendado: true,
    requer: { marcas: ["briga-elenco"] },
    opcoes: [
      {
        texto: "Pedir desculpas na frente de todos",
        efeito: { vida: { elenco: 14, moral: -3 }, desmarcar: ["briga-elenco"] },
        resultado: "Aplausos tímidos. O clima melhorou.",
        auto: true,
      },
      {
        texto: "Montar a sua turma",
        efeito: { vida: { elenco: -8, tecnico: -6, moral: 4 } },
        resultado: "Você tem aliados, mas o grupo rachou de vez.",
      },
    ],
  },

  // ───────────── Festas ─────────────
  {
    id: "balada",
    categoria: "festa",
    titulo: "Convite para a balada",
    texto:
      "Um cantor famoso abre o camarote na véspera do jogo. Metade do elenco foi convidada; a outra metade não vai saber.",
    peso: 4,
    intervalo: 8,
    opcoes: [
      {
        texto: "Ir e aproveitar a noite",
        efeito: {
          vida: { moral: 6, forma: -10, fama: 3, vicios: 4 },
          marcar: { baladeiro: 12 },
          agendar: [{ evento: "foto-balada", em: [1, 2], chance: 0.45 }],
        },
        resultado: "Você chegou em casa com o sol nascendo.",
      },
      {
        texto: "Passar uma hora e ir embora",
        efeito: {
          vida: { moral: 3, forma: -3, fama: 1 },
          agendar: [{ evento: "foto-balada", em: [1, 2], chance: 0.15 }],
        },
        resultado: "Uma foto, um abraço no cantor e cama antes da uma.",
      },
      {
        texto: "Ficar em casa",
        efeito: { vida: { forma: 2, tecnico: 1 } },
        resultado: "Série, pipoca e oito horas de sono.",
        auto: true,
      },
    ],
  },
  {
    id: "foto-balada",
    categoria: "imprensa",
    titulo: "Fotos da noitada",
    texto:
      "Um site publicou fotos suas no camarote, de copo na mão, horas antes do jogo. A torcida não gostou.",
    agendado: true,
    opcoes: [
      {
        texto: "Assumir e pedir desculpas",
        efeito: { vida: { imprensa: 4, torcida: -3, tecnico: -4, reputacao: 2 } },
        resultado: '"Errei, não vai se repetir." A nota pegou bem.',
        auto: true,
      },
      {
        texto: "Dizer que a foto é antiga",
        efeito: { vida: { imprensa: -6 } },
        resultado: "Por enquanto, colou.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: {
              vida: { imprensa: -12, torcida: -10, reputacao: -8, tecnico: -6 },
              noticia: { texto: "Vídeo desmente jogador e mostra noitada na véspera do jogo.", tipo: "ruim" },
            },
            resultado: "Apareceu um vídeo com data e hora. A mentira virou o assunto.",
          },
        },
      },
      {
        texto: "Não falar nada",
        efeito: { vida: { torcida: -6, imprensa: -2 } },
        resultado: "O silêncio foi lido como deboche.",
      },
    ],
  },
  {
    id: "festa-contrato",
    categoria: "festa",
    titulo: "Festa pelo contrato novo",
    texto:
      "Os amigos organizaram uma festa para comemorar o contrato novo. No fim da noite, uma mulher que você conheceu ali puxa conversa e a química é evidente.",
    peso: 6,
    intervalo: 30,
    requer: { marcas: ["contrato-grande"] },
    opcoes: [
      {
        texto: "Passar a noite com ela",
        dica: "Sem pensar no amanhã",
        efeito: {
          vida: { moral: 8, vicios: 3 },
          marcar: { caso: 40 },
          agendar: [
            { evento: "gravidez", em: [8, 16], chance: 0.35 },
            { evento: "traicao-descoberta", em: [2, 6], chance: 0.5 },
          ],
        },
        resultado: "Ela foi embora de manhã cedo, deixando o número num guardanapo.",
      },
      {
        texto: "Despedir-se e ir para casa",
        efeito: { vida: { reputacao: 2, familia: 2 } },
        resultado: "Você chamou um carro sozinho.",
        auto: true,
      },
      {
        texto: "Nem ir à festa",
        efeito: { vida: { moral: -2, elenco: -2, forma: 2 } },
        resultado: "Os amigos acharam que o dinheiro subiu à cabeça.",
      },
    ],
  },
  {
    id: "gravidez",
    categoria: "relacionamento",
    titulo: "Uma mensagem inesperada",
    texto:
      "A mulher da festa manda mensagem: está grávida e diz que o filho é seu. Ela quer conversar antes que a imprensa descubra.",
    agendado: true,
    requer: { marcas: ["caso"] },
    capital: true,
    opcoes: [
      {
        texto: "Assumir a criança",
        efeito: {
          vida: { reputacao: 5, moral: -4, familia: 4 },
          filho: true,
          gastoFixo: { motivo: "Pensão alimentícia", fracao: 0.12 },
          noticia: {
            texto: "Jogador anuncia que vai ser pai e diz que vai assumir a criança.",
            tipo: "info",
          },
        },
        resultado: "Uma conversa difícil, mas digna. Em alguns meses nasce o bebê.",
      },
      {
        texto: "Pedir exame de DNA",
        efeito: {
          vida: { imprensa: -4 },
          agendar: [{ evento: "dna", em: [3, 5], chance: 1 }],
        },
        resultado: "Ela concordou, magoada. O exame sai em algumas semanas.",
      },
      {
        texto: "Negar e cortar contato",
        efeito: {
          vida: { reputacao: -12, imprensa: -10, moral: -3 },
          agendar: [{ evento: "processo-pensao", em: [6, 12], chance: 0.9 }],
        },
        resultado: "Você bloqueou o número. O problema não foi embora.",
      },
    ],
  },
  {
    id: "dna",
    categoria: "relacionamento",
    titulo: "Resultado do DNA",
    texto: "O exame confirmou: o filho é seu.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Assumir e participar da criação",
        efeito: {
          vida: { familia: 6, reputacao: 3 },
          filho: true,
          gastoFixo: { motivo: "Pensão alimentícia", fracao: 0.12 },
        },
        resultado: "Você foi conhecer o bebê no hospital.",
        auto: true,
      },
      {
        texto: "Só pagar a pensão",
        efeito: {
          vida: { familia: -4, reputacao: -3 },
          filho: true,
          gastoFixo: { motivo: "Pensão alimentícia", fracao: 0.12 },
        },
        resultado: "O depósito cai todo mês. As visitas, não.",
      },
    ],
  },
  {
    id: "processo-pensao",
    categoria: "dinheiro",
    titulo: "Processo de paternidade",
    texto: "A Justiça determinou o exame e a pensão retroativa. A história está em todos os portais.",
    agendado: true,
    opcoes: [
      {
        texto: "Cumprir a decisão em silêncio",
        efeito: {
          meses: -4,
          filho: true,
          gastoFixo: { motivo: "Pensão alimentícia", fracao: 0.15 },
          vida: { imprensa: -6, torcida: -5, reputacao: -5, moral: -6 },
          noticia: {
            texto: "Justiça obriga jogador a pagar pensão retroativa após negar paternidade.",
            tipo: "ruim",
          },
        },
        resultado: "Quatro meses de salário de retroativo e uma pensão maior do que teria sido.",
        auto: true,
      },
    ],
  },
  {
    id: "traicao-descoberta",
    categoria: "relacionamento",
    titulo: "Descobriram a traição",
    texto: "Mensagens da noite da festa chegaram ao celular de quem está com você.",
    agendado: true,
    requer: { relacionamento: ["namorando", "casado"], marcas: ["caso"] },
    capital: true,
    opcoes: [
      {
        texto: "Pedir perdão",
        efeito: { vida: { familia: -10, moral: -8 }, acao: "reconciliar" },
        resultado: "",
        auto: true,
      },
      {
        texto: "Terminar",
        efeito: { vida: { moral: -12, familia: -6 }, relacionamento: "solteiro" },
        resultado: "Você saiu de casa com duas malas.",
      },
    ],
  },

  // ───────────── Relacionamentos ─────────────
  {
    id: "conhecer-alguem",
    categoria: "relacionamento",
    titulo: "Alguém especial",
    texto:
      "Num jantar de amigos você conheceu alguém que não sabe nada de futebol e ri das suas piadas ruins.",
    peso: 3,
    intervalo: 30,
    requer: { relacionamento: ["solteiro"] },
    opcoes: [
      {
        texto: "Chamar para sair",
        efeito: {
          relacionamento: "namorando",
          vida: { moral: 7, familia: 5, vicios: -3 },
          marcar: { namoro: null },
        },
        resultado: "Primeiro encontro numa pizzaria sem ninguém pedindo foto. Começou um namoro.",
        auto: true,
      },
      {
        texto: "Curtir a vida de solteiro",
        efeito: { vida: { fama: 2, moral: 2 } },
        resultado: "Fica o contato, e só.",
      },
    ],
  },
  {
    id: "casamento",
    categoria: "relacionamento",
    titulo: "Hora de casar?",
    texto: "O namoro ficou sério. A família pergunta quando sai o casamento.",
    peso: 3,
    intervalo: 30,
    requer: { relacionamento: ["namorando"], marcas: ["namoro"] },
    capital: true,
    opcoes: [
      {
        texto: "Casar com festa grande",
        efeito: { relacionamento: "casado", meses: -5, vida: { moral: 8, familia: 12, fama: 4 } },
        resultado: "Festa de três dias e foto na capa da revista.",
      },
      {
        texto: "Casar no cartório",
        efeito: { relacionamento: "casado", meses: -0.5, vida: { moral: 6, familia: 10 } },
        resultado: "Vinte convidados e um churrasco no quintal.",
        auto: true,
      },
      {
        texto: "Ainda não",
        efeito: {
          vida: { familia: -6, moral: -3 },
          agendar: [{ evento: "ultimato", em: [8, 14], chance: 0.6 }],
        },
        resultado: "Você pediu tempo. A conversa terminou em silêncio.",
      },
    ],
  },
  {
    id: "ultimato",
    categoria: "relacionamento",
    titulo: "Ultimato",
    texto: '"Ou a gente decide o futuro, ou cada um segue a sua vida."',
    agendado: true,
    requer: { relacionamento: ["namorando"] },
    capital: true,
    opcoes: [
      {
        texto: "Pedir em casamento",
        efeito: { relacionamento: "casado", meses: -1, vida: { moral: 8, familia: 12 } },
        resultado: "Aliança comprada às pressas, mas o sim foi sincero.",
        auto: true,
      },
      {
        texto: "Terminar",
        efeito: { relacionamento: "solteiro", vida: { moral: -10, familia: -5 }, desmarcar: ["namoro"] },
        resultado: "Acabou. A casa ficou grande demais.",
      },
    ],
  },
  {
    id: "crise-casal",
    categoria: "relacionamento",
    titulo: "Crise em casa",
    texto:
      "Viagens, concentração e jogos no meio da semana: em casa, a reclamação é de que você nunca está presente.",
    peso: 4,
    intervalo: 20,
    requer: { relacionamento: ["namorando", "casado"], max: { familia: 45 } },
    opcoes: [
      {
        texto: "Tirar um fim de semana só para vocês",
        efeito: { vida: { familia: 12, moral: 4, tecnico: -2, forma: -2 } },
        resultado: "Celular desligado e uma praia vazia. Respiraram.",
        auto: true,
      },
      {
        texto: "Terapia de casal",
        efeito: { meses: -0.3, vida: { familia: 8, moral: 2 } },
        resultado: "Primeira sessão constrangedora, a segunda melhor.",
      },
      {
        texto: '"É a minha profissão"',
        efeito: { vida: { familia: -8 }, agendar: [{ evento: "separacao", em: [4, 10], chance: 0.45 }] },
        resultado: "A porta do quarto bateu.",
      },
    ],
  },
  {
    id: "separacao",
    categoria: "relacionamento",
    titulo: "Pedido de separação",
    texto: "O pedido de separação chegou pelo advogado.",
    agendado: true,
    requer: { relacionamento: ["namorando", "casado"] },
    capital: true,
    opcoes: [
      {
        texto: "Aceitar e dividir os bens",
        efeito: {
          relacionamento: "solteiro",
          patrimonio: -0.35,
          vida: { moral: -14, familia: -8, imprensa: -3 },
        },
        resultado: "Um terço do patrimônio a menos e muito silêncio.",
        auto: true,
      },
      {
        texto: "Lutar na Justiça",
        efeito: {
          relacionamento: "solteiro",
          patrimonio: -0.2,
          meses: -2,
          vida: { moral: -18, imprensa: -8, reputacao: -4 },
        },
        resultado: "Ganhou na divisão, perdeu meses de sono e virou pauta de fofoca.",
      },
    ],
  },

  // ───────────── Família ─────────────
  {
    id: "pai-doente",
    categoria: "familia",
    titulo: "Seu pai foi internado",
    texto: "Seu pai foi internado na cidade natal, a mil quilômetros. Tem jogo no fim de semana.",
    peso: 2,
    intervalo: 150,
    opcoes: [
      {
        texto: "Viajar e perder o jogo",
        efeito: { vida: { familia: 15, moral: 4, tecnico: -3, torcida: 2 }, marcar: { "ausente-jogo": 1 } },
        resultado: "Você chegou a tempo de segurar a mão dele. Ele se recupera.",
      },
      {
        texto: "Pagar o melhor hospital e jogar",
        efeito: { meses: -1, vida: { familia: 4, moral: -4 } },
        resultado: "Transferência de helicóptero e boletim médico a cada hora.",
        auto: true,
      },
      {
        texto: "Jogar e ligar depois",
        efeito: { vida: { familia: -12, moral: -6 } },
        resultado: "Sua irmã não atendeu as suas ligações.",
      },
    ],
  },
  {
    id: "irmao-dinheiro",
    categoria: "familia",
    titulo: "Seu irmão pede dinheiro",
    texto: "Seu irmão quer abrir uma oficina e pede {mesada} emprestados.",
    peso: 3,
    intervalo: 40,
    opcoes: [
      {
        texto: "Emprestar",
        efeito: {
          meses: -2,
          vida: { familia: 8 },
          agendar: [
            { evento: "irmao-devolve", em: [20, 40], chance: 0.4 },
            { evento: "irmao-de-novo", em: [10, 20], chance: 0.4 },
          ],
        },
        resultado: "Ele te abraçou como na infância.",
        auto: true,
      },
      {
        texto: "Negar",
        efeito: { vida: { familia: -8 } },
        resultado: "No almoço de domingo, ninguém falou com você.",
      },
      {
        texto: "Dar emprego na sua equipe",
        efeito: { vida: { familia: 6 }, gastoFixo: { motivo: "Salário do irmão", fracao: 0.03 } },
        resultado: "Agora ele cuida da sua agenda. Mais ou menos.",
      },
    ],
  },
  {
    id: "irmao-devolve",
    categoria: "familia",
    titulo: "A oficina deu certo",
    texto: "A oficina do seu irmão prosperou e ele apareceu com o dinheiro do empréstimo.",
    agendado: true,
    opcoes: [
      {
        texto: "Aceitar o dinheiro",
        efeito: { meses: 2.2, vida: { familia: 5 } },
        resultado: "Com juros e um churrasco.",
        auto: true,
      },
      {
        texto: "Dizer que é presente",
        efeito: { vida: { familia: 10, moral: 3 } },
        resultado: "Ele batizou o elevador da oficina com o seu nome.",
      },
    ],
  },
  {
    id: "irmao-de-novo",
    categoria: "familia",
    titulo: "Seu irmão pede de novo",
    texto: "A oficina não decolou e seu irmão precisa de mais dinheiro para não fechar.",
    agendado: true,
    opcoes: [
      {
        texto: "Ajudar de novo",
        efeito: { meses: -2, vida: { familia: 4 } },
        resultado: '"Agora vai."',
        auto: true,
      },
      {
        texto: "Dizer que acabou",
        efeito: { vida: { familia: -10, moral: -3 } },
        resultado: "A oficina fechou. Ele culpa você.",
      },
    ],
  },
  {
    id: "casa-para-mae",
    categoria: "familia",
    titulo: "Uma casa para a sua mãe",
    texto: "Sempre foi o seu sonho: tirar a sua mãe do aluguel.",
    peso: 3,
    unico: true,
    requer: { mesesMin: 14 },
    opcoes: [
      {
        texto: "Comprar a casa",
        efeito: { meses: -12, vida: { familia: 18, moral: 10, torcida: 2 } },
        resultado: "Ela chorou ao receber a chave.",
        auto: true,
      },
      { texto: "Ainda não", efeito: { vida: { familia: -2 } }, resultado: "Fica para quando sobrar mais." },
    ],
  },
  {
    id: "escola-filho",
    categoria: "familia",
    titulo: "Apresentação na escola",
    texto: "Seu filho vai se apresentar na escola na mesma hora do treino de bola parada.",
    peso: 3,
    intervalo: 30,
    requer: { filhos: true },
    opcoes: [
      {
        texto: "Ir à apresentação",
        efeito: { vida: { familia: 10, moral: 5, tecnico: -4 } },
        resultado: "Ele procurou você na plateia e acenou.",
      },
      {
        texto: "Ir ao treino",
        efeito: { vida: { familia: -6, tecnico: 2 } },
        resultado: "Você viu o vídeo no intervalo.",
        auto: true,
      },
    ],
  },

  // ───────────── Dinheiro ─────────────
  {
    id: "investimento-amigo",
    categoria: "dinheiro",
    titulo: "Um negócio imperdível",
    texto:
      "Um amigo de infância quer sociedade numa rede de hamburguerias. Precisa de seis meses do seu salário.",
    peso: 3,
    intervalo: 40,
    requer: { mesesMin: 6 },
    opcoes: [
      {
        texto: "Entrar no negócio",
        efeito: {
          meses: -6,
          agendar: [
            { evento: "investimento-retorno", em: [20, 40], chance: 0.45 },
            { evento: "investimento-golpe", em: [12, 24], chance: 0.45 },
          ],
        },
        resultado: "Contrato assinado no balcão da primeira loja.",
      },
      {
        texto: "Recusar",
        efeito: { vida: { familia: -2 } },
        resultado: "Ele disse que entende. Não parecia.",
        auto: true,
      },
      {
        texto: "Pedir para o empresário analisar",
        efeito: { vida: { empresario: 3 } },
        resultado: "O empresário achou os números frágeis e você saiu fora.",
      },
    ],
  },
  {
    id: "investimento-retorno",
    categoria: "dinheiro",
    titulo: "As hamburguerias bombaram",
    texto: "A rede abriu a quinta loja e o seu sócio manda o primeiro grande dividendo.",
    agendado: true,
    opcoes: [
      {
        texto: "Reinvestir",
        efeito: { meses: 4, vida: { moral: 4 } },
        resultado: "O dinheiro voltou e ainda sobrou.",
        auto: true,
      },
      {
        texto: "Vender a sua parte",
        efeito: { meses: 11, vida: { moral: 5 } },
        resultado: "Saiu com quase o dobro do que pôs.",
      },
    ],
  },
  {
    id: "investimento-golpe",
    categoria: "dinheiro",
    titulo: "O sócio sumiu",
    texto: "As lojas fecharam, o sócio não atende e há fornecedores cobrando no seu nome.",
    agendado: true,
    opcoes: [
      {
        texto: "Pagar as dívidas e encerrar",
        efeito: { meses: -3, vida: { moral: -8, reputacao: 2 } },
        resultado: "Prejuízo total, mas o nome ficou limpo.",
        auto: true,
      },
      {
        texto: "Processar o amigo",
        efeito: { meses: -1, vida: { moral: -6, imprensa: -4, familia: -3 } },
        resultado: "O caso foi parar nos jornais da sua cidade.",
      },
    ],
  },
  {
    id: "carro-luxo",
    categoria: "dinheiro",
    titulo: "O carro dos sonhos",
    texto: "A concessionária oferece o esportivo importado que você colava em pôster quando criança.",
    peso: 2,
    intervalo: 52,
    requer: { mesesMin: 8 },
    opcoes: [
      {
        texto: "Comprar",
        efeito: { meses: -6, vida: { moral: 6, fama: 3, torcida: -2 } },
        resultado: "O ronco do motor no estacionamento do CT virou assunto.",
      },
      {
        texto: "Deixar para depois",
        efeito: { vida: { reputacao: 1 } },
        resultado: "O pôster continua na parede.",
        auto: true,
      },
    ],
  },
  {
    id: "patrocinio",
    categoria: "dinheiro",
    titulo: "Proposta de patrocínio",
    texto:
      "Duas marcas querem o seu rosto: uma casa de apostas, que paga muito, e uma marca de chuteiras, que paga menos.",
    peso: 3,
    intervalo: 40,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Casa de apostas",
        efeito: {
          meses: 6,
          vida: { reputacao: -6, fama: 3 },
          agendar: [{ evento: "polemica-apostas", em: [6, 20], chance: 0.35 }],
        },
        resultado: "Comercial gravado em um dia, cachê de seis meses de salário.",
      },
      {
        texto: "Marca de chuteiras",
        efeito: { meses: 2, vida: { reputacao: 3, fama: 4 } },
        resultado: "Chuteira com o seu nome bordado.",
        auto: true,
      },
      { texto: "Nenhuma", efeito: {}, resultado: "Foco no campo." },
    ],
  },
  {
    id: "polemica-apostas",
    categoria: "imprensa",
    titulo: "Investigação de apostas",
    texto:
      "Uma investigação sobre manipulação de jogos cita a casa de apostas que você patrocina. Jornalistas querem saber o seu envolvimento.",
    agendado: true,
    opcoes: [
      {
        texto: "Romper o contrato publicamente",
        efeito: { meses: -2, vida: { reputacao: 6, imprensa: 4 } },
        resultado: "Multa rescisória paga, imagem preservada.",
        auto: true,
      },
      {
        texto: 'Manter: "Não tenho nada com isso"',
        efeito: { vida: { reputacao: -10, imprensa: -8, torcida: -6 } },
        resultado: "O seu nome ficou associado ao escândalo por meses.",
      },
    ],
  },

  // ───────────── Imprensa ─────────────
  {
    id: "entrevista-derrota",
    categoria: "imprensa",
    titulo: "Microfone na saída do vestiário",
    texto: "Depois de mais um tropeço, o repórter pergunta se a culpa é do esquema de {tecnico}.",
    peso: 3,
    intervalo: 10,
    requer: { teste: (c) => c.a.ultimosJogos.some((g) => g.placar && g.placar[0] < g.placar[1]) },
    opcoes: [
      {
        texto: "Assumir a culpa do grupo",
        efeito: { vida: { reputacao: 4, torcida: 3, tecnico: 3 } },
        resultado: '"A culpa é nossa, dos jogadores."',
        auto: true,
      },
      {
        texto: "Criticar o esquema",
        efeito: { vida: { torcida: 4, tecnico: -14, imprensa: 5 }, marcar: { barrado: 3 } },
        resultado: "Manchete garantida. Banco também.",
      },
      {
        texto: "Culpar a arbitragem",
        efeito: { vida: { torcida: 2, imprensa: -2, reputacao: -2 } },
        resultado: "Os torcedores compartilharam. Os árbitros anotaram.",
      },
    ],
  },
  {
    id: "provocacao-rede",
    categoria: "imprensa",
    titulo: "Provocação nas redes",
    texto: "Um jogador rival postou uma montagem zombando de você. Os seguidores pedem resposta.",
    peso: 3,
    intervalo: 15,
    opcoes: [
      {
        texto: "Responder à altura",
        efeito: { vida: { fama: 5, imprensa: -3, torcida: 4 }, marcar: { "rixa-rival": 10 } },
        resultado: "A resposta viralizou. O próximo encontro vai ser quente.",
      },
      { texto: "Ignorar", efeito: { vida: { reputacao: 2 } }, resultado: '"Respondo em campo."', auto: true },
    ],
  },
  {
    id: "exclusiva",
    categoria: "imprensa",
    titulo: "Entrevista exclusiva",
    texto: "Um programa de domingo quer uma entrevista na sua casa, falando da infância e da família.",
    peso: 2,
    intervalo: 40,
    opcoes: [
      {
        texto: "Topar e abrir a casa",
        efeito: { vida: { fama: 7, imprensa: 6, familia: -4 } },
        resultado: "Sua avó virou estrela da internet.",
      },
      {
        texto: "Só falar de futebol",
        efeito: { vida: { imprensa: 2, fama: 2 } },
        resultado: "Entrevista curta, sem polêmica.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: { vida: { imprensa: -4 } },
        resultado: '"Jogador marrento", disse o apresentador.',
      },
    ],
  },
  {
    id: "torcida-cobra",
    categoria: "imprensa",
    titulo: "Torcedores no CT",
    texto: 'Um grupo de torcedores organizados espera na porta do CT para "conversar" com o elenco.',
    peso: 4,
    intervalo: 15,
    requer: { max: { torcida: 38 } },
    opcoes: [
      {
        texto: "Descer e conversar",
        efeito: { vida: { torcida: 9, reputacao: 3 } },
        resultado: "Conversa tensa, mas terminou em aperto de mão.",
        sorte: {
          p: 0.75,
          senao: {
            efeito: { vida: { moral: -10, torcida: -4 } },
            resultado: "Houve empurra-empurra. Você saiu escoltado.",
          },
        },
      },
      {
        texto: "Sair pelos fundos",
        efeito: { vida: { torcida: -5, moral: -2 } },
        resultado: "Eles perceberam.",
        auto: true,
      },
    ],
  },

  // ───────────── Empresário ─────────────
  {
    id: "empresario-top",
    categoria: "empresario",
    titulo: "Um superagente liga",
    texto:
      "Um agente famoso, que cuida de estrelas da Europa, quer representar você. Mas exige exclusividade e 10% de tudo.",
    peso: 2,
    unico: true,
    requer: { min: { fama: 50 } },
    opcoes: [
      {
        texto: "Trocar de empresário",
        efeito: {
          vida: { empresario: 25, fama: 4, familia: -3 },
          gastoFixo: { motivo: "Comissão do agente", fracao: 0.1 },
          marcar: { "agente-top": null },
        },
        resultado: "Contrato assinado em Londres. O telefone dele não para.",
      },
      {
        texto: "Ficar com quem esteve desde o início",
        efeito: { vida: { empresario: 10, reputacao: 2 } },
        resultado: "Lealdade tem valor.",
        auto: true,
      },
    ],
  },
  {
    id: "empresario-forca-saida",
    categoria: "empresario",
    titulo: "Forçar a saída?",
    texto:
      "Seu empresário garante ter um clube maior interessado e sugere faltar ao treino até o {clube} liberar.",
    peso: 2,
    intervalo: 40,
    requer: { min: { empresario: 55 }, teste: (c) => janelaAberta(c.estado.temporada.rodada) },
    opcoes: [
      {
        texto: "Forçar a saída",
        efeito: {
          vida: { tecnico: -15, torcida: -18, reputacao: -8 },
          marcar: { barrado: 4 },
          agendar: [{ evento: "proposta", em: [0, 1], chance: 0.8 }],
          noticia: { texto: "Jogador falta ao treino e força transferência.", tipo: "ruim" },
        },
        resultado: "A torcida picha o muro do CT com o seu nome.",
      },
      {
        texto: "Ficar e jogar",
        efeito: { vida: { torcida: 4, empresario: -6 } },
        resultado: "O empresário ficou irritado.",
        auto: true,
      },
    ],
  },

  // ───────────── Vestiário ─────────────
  {
    id: "conselho-veterano",
    categoria: "vestiario",
    titulo: "Conselho do veterano",
    texto: 'O capitão chama você para um café: "Já vi muito talento se perder fora de campo".',
    peso: 2,
    intervalo: 40,
    requer: { idade: [16, 24] },
    opcoes: [
      {
        texto: "Ouvir com atenção",
        efeito: { vida: { reputacao: 4, vicios: -5, elenco: 5 }, treino: 1 },
        resultado: "Ele virou um mentor.",
        auto: true,
      },
      {
        texto: "Agradecer e esquecer",
        efeito: { vida: { elenco: -2 } },
        resultado: '"Coroa chato", você pensou.',
      },
    ],
  },
  {
    id: "companheiro-mal",
    categoria: "vestiario",
    titulo: "Um companheiro em crise",
    texto: "Um colega de quarto nas concentrações confessa que está deprimido e pensa em largar o futebol.",
    peso: 2,
    intervalo: 40,
    opcoes: [
      {
        texto: "Apoiar e indicar ajuda",
        efeito: { vida: { elenco: 8, reputacao: 3, moral: -2 } },
        resultado: "Ele procurou um psicólogo. Agradece até hoje.",
        auto: true,
      },
      {
        texto: "Mudar de assunto",
        efeito: { vida: { elenco: -3 } },
        resultado: "Ele não tocou mais no assunto.",
      },
    ],
  },
  {
    id: "capitania",
    categoria: "vestiario",
    titulo: "A braçadeira",
    texto: "{tecnico} quer saber se você aceitaria ser capitão.",
    peso: 3,
    unico: true,
    requer: { min: { elenco: 65, tecnico: 60, reputacao: 55 }, idade: [23, 40] },
    opcoes: [
      {
        texto: "Aceitar",
        efeito: { vida: { reputacao: 8, elenco: 5, fama: 4, moral: 5 }, marcar: { capitao: 60 } },
        resultado: "Braçadeira no braço e voz no vestiário.",
        auto: true,
      },
      {
        texto: 'Recusar: "Lidero com a bola"',
        efeito: { vida: { elenco: -2 } },
        resultado: "O técnico respeitou.",
      },
    ],
  },

  // ───────────── Saúde ─────────────
  {
    id: "dor-joelho",
    categoria: "saude",
    titulo: "Dor no joelho",
    texto:
      "O joelho incha depois dos jogos. O médico sugere uma semana de repouso; o técnico precisa de você.",
    peso: 3,
    intervalo: 25,
    opcoes: [
      {
        texto: "Jogar no sacrifício",
        efeito: {
          vida: { tecnico: 5, torcida: 2 },
          agendar: [{ evento: "lesao-grave", em: [2, 6], chance: 0.3 }],
        },
        resultado: "Infiltração e bola pra frente.",
      },
      {
        texto: "Repousar uma semana",
        efeito: { lesao: 1, vida: { forma: -2 } },
        resultado: "O joelho desinchou.",
        auto: true,
      },
    ],
  },
  {
    id: "lesao-grave",
    categoria: "saude",
    titulo: "Lesão grave",
    texto: "O joelho cedeu num treino. Ligamento rompido. Os médicos apresentam duas saídas.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Cirurgia e recuperação completa",
        efeito: { lesao: 14, vida: { moral: -10, forma: -15 } },
        resultado: "Catorze semanas de fisioterapia.",
        auto: true,
      },
      {
        texto: "Tratamento conservador para voltar logo",
        efeito: { lesao: 6, vida: { moral: -5, forma: -8 } },
        resultado: "Você voltou rápido, mas o joelho nunca mais foi o mesmo.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { lesao: 18, vida: { moral: -18, forma: -20 } },
            resultado: "Rompeu de novo. Agora não tem jeito: cirurgia e meses fora.",
          },
        },
      },
    ],
  },
  {
    id: "analgesicos",
    categoria: "saude",
    titulo: "Remédio para dormir",
    texto:
      "Você está tomando remédio para dormir quase toda noite e bebendo mais do que devia depois dos jogos.",
    peso: 5,
    intervalo: 20,
    requer: { min: { vicios: 35 } },
    opcoes: [
      {
        texto: "Procurar ajuda profissional",
        efeito: { meses: -0.5, vida: { vicios: -25, moral: 4, forma: 4 } },
        resultado: "Tratamento discreto, com resultado.",
        auto: true,
      },
      {
        texto: "Está sob controle",
        efeito: {
          vida: { vicios: 8, forma: -6 },
          agendar: [{ evento: "flagra-noite", em: [2, 8], chance: 0.4 }],
        },
        resultado: "Não estava.",
      },
    ],
  },
  {
    id: "flagra-noite",
    categoria: "imprensa",
    titulo: "Escândalo de madrugada",
    texto:
      "Você se envolveu numa confusão numa casa noturna e a polícia foi chamada. As imagens estão em todo lugar.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Pedir desculpas e internar-se para tratamento",
        efeito: { lesao: 3, vida: { vicios: -30, reputacao: -6, imprensa: 2, torcida: -4 } },
        resultado: "Três semanas numa clínica. Saiu outra pessoa.",
        auto: true,
      },
      {
        texto: "Negar tudo",
        efeito: {
          vida: { reputacao: -15, imprensa: -15, torcida: -12, tecnico: -10 },
          marcar: { barrado: 5 },
          meses: -1,
        },
        resultado: "Multa do clube, afastamento e manchetes por semanas.",
      },
    ],
  },
  {
    id: "psicologo",
    categoria: "saude",
    titulo: "Cabeça pesada",
    texto:
      "Você não está dormindo bem e a bola parece pesar uma tonelada. O clube tem uma psicóloga do esporte.",
    peso: 4,
    intervalo: 25,
    requer: { max: { moral: 35 } },
    opcoes: [
      {
        texto: "Marcar uma sessão",
        efeito: { vida: { moral: 12, forma: 2 } },
        resultado: "Falar ajudou mais do que você imaginava.",
        auto: true,
      },
      {
        texto: "Guardar para si",
        efeito: { vida: { moral: -4, vicios: 4 } },
        resultado: "Você foi levando.",
      },
    ],
  },

  // ───────────── Carreira ─────────────
  {
    id: "proposta",
    categoria: "carreira",
    titulo: "Proposta do {clube0}",
    texto:
      "O {clube0} quer você por {anos} anos, com salário de {salario0} por ano (hoje você ganha {atual}).",
    peso: 2,
    maximo: 99,
    intervalo: 6,
    capital: true,
    montar: montarProposta,
    requer: { teste: (c) => c.j.ovr >= 55 },
    opcoes: [
      { texto: "Aceitar", efeito: { acao: "aceitarProposta" }, resultado: "" },
      { texto: "Mandar o empresário pedir mais", efeito: { acao: "pedirMais" }, resultado: "" },
      {
        texto: "Recusar e ficar",
        efeito: { vida: { torcida: 4, empresario: -3, tecnico: 2 } },
        resultado: "O {clube} agradeceu a lealdade.",
        auto: true,
      },
    ],
  },
  {
    id: "renovacao",
    categoria: "carreira",
    titulo: "Renovação com o {clube}",
    texto:
      "Seu contrato acaba no fim da temporada. O {clube} oferece mais {anos} anos com salário de {salario} por ano.",
    peso: 40,
    maximo: 99,
    intervalo: 30,
    capital: true,
    montar: montarRenovacao,
    opcoes: [
      { texto: "Renovar", efeito: { acao: "renovar" }, resultado: "", auto: true },
      { texto: "Pedir aumento", efeito: { acao: "pedirAumento" }, resultado: "" },
      {
        texto: "Recusar e testar o mercado",
        efeito: { acao: "recusarRenovacao", vida: { torcida: -4 } },
        resultado: "",
      },
    ],
  },
  {
    id: "leilao",
    categoria: "carreira",
    titulo: "Os gigantes batem na porta",
    texto:
      "O telefone do seu empresário não para. {clube0} oferece {salario0} por ano, {clube1} chega a {salario1} e {clube2} fala em {salario2}, todos por {anos} anos. O {clube} diz que cobre com {contrapropostaTxt} por ano se você ficar.",
    agendado: true,
    capital: true,
    montar: montarLeilao,
    opcoes: [
      { texto: "Assinar com o {clube0}", efeito: { acao: "assinarLivre", indice: 0 }, resultado: "" },
      { texto: "Assinar com o {clube1}", efeito: { acao: "assinarLivre", indice: 1 }, resultado: "" },
      { texto: "Assinar com o {clube2}", efeito: { acao: "assinarLivre", indice: 2 }, resultado: "" },
      {
        texto: "Ficar e aceitar a renovação do {clube}",
        dica: "Salário maior e a torcida do seu lado",
        efeito: { acao: "valorizar" },
        resultado: "",
        auto: true,
      },
    ],
  },
  {
    id: "livre",
    categoria: "carreira",
    titulo: "Fim de contrato",
    texto:
      "Seu contrato acabou e você está livre. Três clubes procuraram o seu empresário: {clube0} ({salario0}/ano), {clube1} ({salario1}/ano) e {clube2} ({salario2}/ano).",
    agendado: true,
    capital: true,
    montar: montarLivre,
    opcoes: [
      {
        texto: "Assinar com o {clube0}",
        efeito: { acao: "assinarLivre", indice: 0 },
        resultado: "",
        auto: true,
      },
      { texto: "Assinar com o {clube1}", efeito: { acao: "assinarLivre", indice: 1 }, resultado: "" },
      { texto: "Assinar com o {clube2}", efeito: { acao: "assinarLivre", indice: 2 }, resultado: "" },
    ],
  },
  {
    id: "convocacao",
    categoria: "carreira",
    titulo: "Convocado para a seleção!",
    texto: "Seu nome foi anunciado na lista da seleção para a próxima Data FIFA.",
    peso: 4,
    maximo: 99,
    intervalo: 14,
    capital: true,
    requer: { teste: (c) => podeSerConvocado(c.a, c.j) },
    opcoes: [
      {
        texto: "Vestir a camisa",
        efeito: { acao: "convocacao", vida: { fama: 10, moral: 10, torcida: 4 }, treino: 1 },
        resultado: "",
        auto: true,
      },
      {
        texto: "Pedir dispensa para cuidar do corpo",
        efeito: { vida: { fama: -5, forma: 5, tecnico: 4, imprensa: -6 } },
        resultado: "A imprensa não perdoou.",
      },
    ],
  },
  {
    id: "aposentadoria",
    categoria: "carreira",
    titulo: "Hora de parar?",
    texto:
      "Aos {idade} anos, o corpo demora mais para se recuperar. A família pergunta se não é hora de pendurar as chuteiras.",
    agendado: true,
    capital: true,
    montar: (c) => ({ idade: c.a.idade }),
    opcoes: [
      {
        texto: "Jogar mais uma temporada",
        efeito: { acao: "adiarAposentadoria", vida: { moral: 3 } },
        resultado: "",
        auto: true,
      },
      { texto: "Anunciar a aposentadoria", efeito: { acao: "aposentar" }, resultado: "" },
    ],
  },
];
