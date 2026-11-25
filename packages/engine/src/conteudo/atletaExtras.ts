/**
 * Mais eventos do modo jogador: jogatina e agiota, documentário, licença de técnico (que pesa nos
 * convites do pós-carreira), mentoria de um garoto da base, segurança, redes sociais, política...
 * Mesmo formato de `conteudo/atleta.ts`.
 */
import type { DefEvento } from "../atleta/motor";

export const EVENTOS_ATLETA_EXTRAS: DefEvento[] = [
  // ───────────── Jogatina → dívida → agiota ─────────────
  {
    id: "poquer-concentracao",
    categoria: "festa",
    titulo: "Pôquer valendo alto",
    texto:
      "Na folga, um grupo de amigos famosos chama você para uma mesa de pôquer numa cobertura. A aposta mínima vale um mês de salário de muita gente.",
    peso: 2,
    intervalo: 30,
    opcoes: [
      {
        texto: "Sentar à mesa",
        dica: "Pode render, pode viciar",
        efeito: {
          vida: { moral: 4, vicios: 6 },
          marcar: { jogatina: 16 },
          agendar: [{ evento: "divida-de-jogo", em: [2, 6], chance: 0.45 }],
        },
        resultado: "Você saiu ganhando na primeira noite. Já marcaram a próxima.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: {
              meses: -1,
              vida: { moral: -3, vicios: 6 },
              marcar: { jogatina: 16 },
              agendar: [{ evento: "divida-de-jogo", em: [1, 4], chance: 0.65 }],
            },
            resultado: "Perdeu feio e saiu jurando que recupera na próxima.",
          },
        },
      },
      {
        texto: "Ir só para conversar",
        efeito: { vida: { moral: 2, fama: 1 } },
        resultado: "Boas histórias, nenhuma ficha comprada.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: { vida: { reputacao: 1 } },
        resultado: "Você ficou em casa vendo jogo.",
      },
    ],
  },
  {
    id: "divida-de-jogo",
    categoria: "dinheiro",
    titulo: "A conta do pôquer",
    texto:
      "As noites de pôquer viraram rotina, e agora a conta chegou: você deve uma quantia que equivale a três meses de salário para um conhecido da mesa.",
    agendado: true,
    requer: { marcas: ["jogatina"] },
    opcoes: [
      {
        texto: "Pagar tudo e largar a mesa",
        efeito: { meses: -3, vida: { vicios: -8, moral: -4, familia: 2 }, desmarcar: ["jogatina"] },
        resultado: "Doeu no bolso, mas acabou ali.",
        auto: true,
      },
      {
        texto: "Pedir adiantamento ao clube",
        efeito: {
          vida: { tecnico: -3, reputacao: -4, vicios: -4 },
          gastoFixo: { motivo: "Adiantamento do clube", fracao: 0.45, semanas: 30 },
          desmarcar: ["jogatina"],
        },
        resultado: "A diretoria adiantou o salário e descontará por meses. O vestiário ficou sabendo.",
      },
      {
        texto: "Enrolar o credor",
        efeito: {
          vida: { moral: -2, vicios: 3 },
          agendar: [{ evento: "agiota", em: [2, 5], chance: 0.75 }],
        },
        resultado: '"Semana que vem eu acerto." O credor sorriu e não disse nada.',
      },
    ],
  },
  {
    id: "agiota",
    categoria: "dinheiro",
    titulo: "Gente estranha no portão",
    texto:
      "Dois homens esperam você na saída do CT. Dizem que a dívida do pôquer foi vendida, com juros, e que sabem onde sua família mora.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Pagar com juros",
        efeito: { meses: -5, vida: { moral: -8, familia: -4, vicios: -6 }, desmarcar: ["jogatina"] },
        resultado: "Você pagou e nunca mais viu os dois. O susto ficou.",
        auto: true,
      },
      {
        texto: "Ir à polícia e contar ao clube",
        efeito: {
          vida: { reputacao: -6, imprensa: -6, familia: 4, vicios: -10, tecnico: -2 },
          noticia: { texto: "{nome} denuncia ameaças por dívida de jogo", tipo: "ruim" },
          desmarcar: ["jogatina"],
        },
        resultado: "O caso virou manchete, mas a polícia cuidou dos dois. A família agradeceu a coragem.",
      },
    ],
  },

  // ───────────── Pós-carreira ─────────────
  {
    id: "licenca-tecnico",
    categoria: "carreira",
    titulo: "Curso de treinador",
    texto:
      "A federação abriu turma para a licença de treinador nas férias. {tecnico} acha que você tem cabeça para isso.",
    peso: 2,
    unico: true,
    requer: { idade: [29, 40], min: { reputacao: 45 } },
    opcoes: [
      {
        texto: "Fazer o curso nas férias",
        dica: "Abre portas no pós-carreira",
        efeito: {
          vida: { reputacao: 5, tecnico: 6, familia: -5, forma: -2 },
          marcar: { "licenca-tecnico": null },
        },
        resultado: "Licença no bolso. Você já enxerga o jogo de outro jeito.",
      },
      {
        texto: "Deixar para depois",
        efeito: { vida: { familia: 3 } },
        resultado: "As férias foram da família.",
        auto: true,
      },
    ],
  },
  {
    id: "garoto-da-base",
    categoria: "vestiario",
    titulo: "O garoto que te imita",
    texto:
      "Um meia de 16 anos da base copia até o seu jeito de comemorar. O coordenador pergunta se você toparia acompanhá-lo de perto.",
    peso: 2,
    unico: true,
    requer: { idade: [27, 40], min: { elenco: 45 } },
    opcoes: [
      {
        texto: "Virar padrinho dele",
        efeito: {
          vida: { elenco: 5, reputacao: 4, moral: 3 },
          marcar: { mentor: null },
          agendar: [{ evento: "garoto-estoura", em: [30, 70], chance: 0.6 }],
        },
        resultado: "Vocês combinaram treinos extras às terças.",
        auto: true,
      },
      {
        texto: "Sem tempo agora",
        efeito: { vida: { elenco: -1 } },
        resultado: "O garoto entendeu. Continua imitando a comemoração.",
      },
    ],
  },
  {
    id: "garoto-estoura",
    categoria: "vestiario",
    titulo: "O afilhado estourou",
    texto:
      "Aquele garoto da base virou titular e foi convocado para a seleção de base. Na entrevista, citou você como a pessoa mais importante da carreira dele.",
    agendado: true,
    requer: { marcas: ["mentor"] },
    opcoes: [
      {
        texto: "Mandar uma mensagem emocionada",
        efeito: { vida: { moral: 8, reputacao: 6, fama: 3, elenco: 4 } },
        resultado: "Ele respondeu com um áudio de cinco minutos.",
        auto: true,
      },
      {
        texto: "Postar a entrevista nas redes",
        efeito: { vida: { fama: 6, imprensa: 3, moral: 4 } },
        resultado: "Milhões de visualizações. O clube repostou.",
      },
    ],
  },

  // ───────────── Mídia ─────────────
  {
    id: "documentario",
    categoria: "imprensa",
    titulo: "Câmeras 24 horas",
    texto:
      "Uma plataforma de streaming quer filmar uma temporada da sua vida, dentro e fora do clube. O cachê é alto; a privacidade, nenhuma.",
    peso: 2,
    unico: true,
    requer: { min: { fama: 55 } },
    capital: true,
    opcoes: [
      {
        texto: "Topar tudo",
        dica: "Dinheiro e fama; vestiário e família expostos",
        efeito: {
          meses: 6,
          vida: { fama: 6, elenco: -4, familia: -5 },
          marcar: { documentario: 40 },
          agendar: [{ evento: "documentario-estreia", em: [20, 35], chance: 1 }],
        },
        resultado: "Uma equipe de filmagem passou a morar na sua sala.",
      },
      {
        texto: "Só dentro de campo",
        efeito: { meses: 2, vida: { fama: 3 } },
        resultado: "Fizeram um especial mais curto, sobre o atleta.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: { vida: { familia: 3 } },
        resultado: "Sua casa continua sendo sua.",
      },
    ],
  },
  {
    id: "documentario-estreia",
    categoria: "imprensa",
    titulo: "Estreia do documentário",
    texto: "A série sobre a sua vida estreou. As redes só falam disso.",
    agendado: true,
    requer: { marcas: ["documentario"] },
    opcoes: [
      {
        texto: "Ver a reação",
        efeito: { vida: { fama: 10, torcida: 6, imprensa: 4, moral: 5 } },
        resultado: "Virou a série mais vista do mês. Você ganhou fãs que nem gostam de futebol.",
        auto: true,
        sorte: {
          p: (c) => 0.35 + c.a.vida.reputacao / 200 - c.a.vida.vicios / 200,
          senao: {
            efeito: { vida: { reputacao: -8, elenco: -8, familia: -6, fama: 4 } },
            resultado:
              "A edição mostrou as brigas, as noites e o que você disse de colegas. Fama em alta, vestiário em chamas.",
          },
        },
      },
    ],
  },
  {
    id: "ataque-nas-redes",
    categoria: "imprensa",
    titulo: "Ofensas nas redes",
    texto:
      "Depois de uma derrota, perfis anônimos lotam seus comentários com ofensas pesadas, algumas preconceituosas.",
    peso: 2,
    intervalo: 40,
    opcoes: [
      {
        texto: "Denunciar e falar publicamente",
        efeito: {
          vida: { reputacao: 6, imprensa: 5, moral: -2, torcida: 3 },
          noticia: { texto: "{nome} denuncia ataques nas redes e recebe apoio do clube", tipo: "info" },
        },
        resultado: "O clube e a liga se manifestaram. Dois perfis foram identificados.",
        auto: true,
      },
      {
        texto: "Responder um por um",
        efeito: { vida: { moral: -4, imprensa: -3, fama: 2 } },
        resultado: "Virou uma guerra de prints que durou a semana.",
      },
      {
        texto: "Sair das redes por um tempo",
        efeito: { vida: { moral: 3, fama: -2, familia: 2 } },
        resultado: "Celular na gaveta. Você dormiu melhor.",
      },
    ],
  },
  {
    id: "candidato-politico",
    categoria: "imprensa",
    titulo: "Foto com o candidato",
    texto:
      "Em ano de eleição, um candidato quer gravar um vídeo com você. Oferece apoio a um projeto social com o seu nome.",
    peso: 1,
    intervalo: 100,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Gravar o vídeo",
        efeito: { vida: { fama: 2, torcida: -6, imprensa: -4, elenco: -2 }, dinheiro: 0.05 },
        resultado: "Metade da torcida aplaudiu, a outra metade xingou.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { torcida: -10, imprensa: -6, reputacao: -3 } },
            resultado:
              "O candidato se envolveu num escândalo na semana seguinte. Seu vídeo voltou a circular.",
          },
        },
      },
      {
        texto: "Recusar com educação",
        efeito: { vida: { reputacao: 2 } },
        resultado: '"Futebol é para todos", você respondeu.',
        auto: true,
      },
    ],
  },
  {
    id: "declaracao-rival",
    categoria: "imprensa",
    titulo: "O rival falou de você",
    texto: 'Na coletiva, um zagueiro rival disse que você "é marrento e some em jogo grande".',
    peso: 2,
    intervalo: 30,
    opcoes: [
      {
        texto: "Responder em campo, calado",
        efeito: { vida: { reputacao: 3, moral: 2 } },
        resultado: "Você só sorriu para as câmeras.",
        auto: true,
      },
      {
        texto: "Devolver na coletiva",
        efeito: { vida: { fama: 4, imprensa: 2, torcida: 3 }, marcar: { "rixa-rival": 8 } },
        resultado: "A frase virou meme. O próximo encontro promete faíscas.",
      },
    ],
  },

  // ───────────── Vida e família ─────────────
  {
    id: "assalto",
    categoria: "familia",
    titulo: "Susto no semáforo",
    texto:
      "Na volta do treino, dois homens armados abordam seu carro. Levam relógio e celular; ninguém se fere.",
    peso: 1,
    intervalo: 80,
    requer: { min: { fama: 35 } },
    opcoes: [
      {
        texto: "Contratar seguranças",
        efeito: {
          vida: { moral: -3, familia: 4 },
          gastoFixo: { motivo: "Segurança particular", fracao: 0.06 },
        },
        resultado: "Agora há sempre um carro atrás do seu.",
        auto: true,
      },
      {
        texto: "Levar a família para um condomínio",
        efeito: { meses: -4, vida: { familia: 6, moral: -2 } },
        resultado: "Casa nova, muros altos.",
      },
      {
        texto: "Seguir a vida",
        efeito: { vida: { moral: -6, familia: -4 } },
        resultado: "Você troca de caminho todo dia, mas o susto não passa.",
      },
    ],
  },
  {
    id: "filho-quer-jogar",
    categoria: "familia",
    titulo: "Seu filho quer ser jogador",
    texto:
      "Seu filho entrou numa escolinha e pergunta se você vai ver o primeiro torneio dele, no sábado do seu jogo.",
    peso: 2,
    intervalo: 60,
    requer: { filhos: true, idade: [27, 40] },
    opcoes: [
      {
        texto: "Pedir para ir ao torneio",
        efeito: { vida: { familia: 12, moral: 6, tecnico: -4 }, marcar: { "ausente-jogo": 1 } },
        resultado: "Ele fez um gol e apontou para você na arquibancada. Você ficou fora do seu jogo.",
      },
      {
        texto: "Ver pela chamada de vídeo no vestiário",
        efeito: { vida: { familia: 4, moral: 2 } },
        resultado: "O sinal caiu no pênalti, mas deu para ver a comemoração.",
        auto: true,
      },
    ],
  },
  {
    id: "viagem-de-folga",
    categoria: "festa",
    titulo: "Folga de três dias",
    texto:
      "Três dias de folga. Os amigos fecharam uma viagem para uma ilha, com voo de volta no dia do treino.",
    peso: 2,
    intervalo: 30,
    opcoes: [
      {
        texto: "Ir com os amigos",
        efeito: { vida: { moral: 7, forma: -4, vicios: 3 } },
        resultado: "Sol, mar e um voo de volta pontual.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: {
              vida: { moral: 3, tecnico: -10, forma: -5 },
              marcar: { "faltou-treino": 8 },
              agendar: [{ evento: "tecnico-desconfiado", em: [1, 2], chance: 0.8 }],
              noticia: { texto: "{nome} perde voo e falta ao treino do {clube}", tipo: "ruim" },
            },
            resultado: "O voo atrasou um dia. Você chegou com o treino acabando.",
          },
        },
      },
      {
        texto: "Ficar e descansar",
        efeito: { vida: { forma: 3, familia: 3 } },
        resultado: "Sono em dia, churrasco em casa.",
        auto: true,
      },
    ],
  },
  {
    id: "preparador-particular",
    categoria: "treino",
    titulo: "Preparador particular",
    texto:
      "Um preparador físico que cuida de atletas de elite oferece acompanhamento diário, com nutrição e sono monitorados. Não é barato.",
    peso: 2,
    unico: true,
    requer: { idade: [24, 40], mesesMin: 3 },
    opcoes: [
      {
        texto: "Contratar",
        dica: "Forma e longevidade; custa por semana",
        efeito: {
          vida: { forma: 8, vicios: -6, reputacao: 3 },
          treino: 2,
          gastoFixo: { motivo: "Preparador particular", fracao: 0.1 },
          marcar: { "atleta-regrado": 30 },
        },
        resultado: "Rotina de atleta olímpico. Seu corpo agradece.",
      },
      {
        texto: "Seguir só com o clube",
        efeito: {},
        resultado: "O departamento do clube dá conta.",
        auto: true,
      },
    ],
  },

  // ───────────── Vestiário e campo ─────────────
  {
    id: "salarios-atrasados",
    categoria: "vestiario",
    titulo: "Salários atrasados",
    texto:
      "O {clube} atrasou dois meses de salário. O elenco quer boicotar a concentração e espera a sua posição.",
    peso: 2,
    intervalo: 60,
    requer: { teste: (c) => c.clube.forca < 66 },
    capital: true,
    opcoes: [
      {
        texto: "Liderar o protesto",
        efeito: {
          vida: { elenco: 10, tecnico: -6, torcida: -4, reputacao: -2 },
          noticia: { texto: "Elenco do {clube} protesta por salários; {nome} lidera", tipo: "ruim" },
        },
        resultado: "A diretoria pagou um mês na sexta. O presidente não esquece.",
      },
      {
        texto: "Ajudar os mais jovens do próprio bolso",
        efeito: { meses: -1, vida: { elenco: 12, reputacao: 6, moral: 2 } },
        resultado: "Você pagou o aluguel de três garotos. Ninguém soube, mas todos sabem.",
      },
      {
        texto: "Ficar fora da briga",
        efeito: { vida: { elenco: -6, tecnico: 2 } },
        resultado: "Treinou normalmente. Alguns colegas pararam de falar com você.",
        auto: true,
      },
    ],
  },
  {
    id: "nova-posicao",
    categoria: "treino",
    titulo: "Teste em outra função",
    texto:
      "{tecnico} quer testar você mais recuado, ajudando na marcação. Diz que é para o time, não contra você.",
    peso: 2,
    intervalo: 50,
    opcoes: [
      {
        texto: "Topar o teste",
        efeito: { vida: { tecnico: 8, moral: -3, elenco: 2 } },
        resultado: "Você correu como nunca. {tecnico} elogiou na coletiva.",
        auto: true,
      },
      {
        texto: "Pedir para jogar na sua posição",
        efeito: { vida: { tecnico: -5, moral: 2 } },
        resultado: "Ele aceitou, mas anotou no caderninho.",
      },
    ],
  },
  {
    id: "lesionou-adversario",
    categoria: "imprensa",
    titulo: "A dividida que machucou",
    texto:
      "Numa dividida no último jogo, um adversário saiu de maca. O exame mostrou lesão de joelho: meses fora. As imagens dividem opiniões.",
    peso: 1,
    intervalo: 80,
    opcoes: [
      {
        texto: "Visitar e pedir desculpas",
        efeito: { vida: { reputacao: 6, imprensa: 4, moral: -2 } },
        resultado: "A foto no hospital encerrou a polêmica.",
        auto: true,
      },
      {
        texto: '"Foi lance de jogo"',
        efeito: { vida: { reputacao: -3, imprensa: -5 }, marcar: { "rixa-rival": 12 } },
        resultado: "A torcida adversária prometeu receber você do jeito dela.",
      },
    ],
  },
  {
    id: "promessa-hospital",
    categoria: "familia",
    titulo: "Visita ao hospital infantil",
    texto: "Um menino internado escreveu uma carta pedindo que você faça um gol para ele no próximo jogo.",
    peso: 2,
    intervalo: 60,
    opcoes: [
      {
        texto: "Visitar e prometer o gol",
        efeito: { vida: { moral: 6, torcida: 5, fama: 2 } },
        resultado: "Ele ganhou uma camisa autografada. Você ganhou um motivo a mais.",
        auto: true,
      },
      {
        texto: "Mandar uma camisa",
        efeito: { vida: { torcida: 1 } },
        resultado: "A mãe dele agradeceu por mensagem.",
      },
    ],
  },
];
