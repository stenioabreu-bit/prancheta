import { salarioDeMercado } from "../atleta/mercado";
/**
 * Momentos da carreira que não são sorteados: marcos (estreia, primeiro gol, hat-trick, gol 100,
 * jogo 300, primeiro título, estreia na seleção), a semana antes de um jogo grande (clássico, final,
 * mata-mata, reencontro com um ex-clube), Copa do Mundo e Copa América, a cerimônia da Bola de Ouro,
 * e momentos de vestiário e de jogo (a volta da lesão, as pernas pesadas, o impedimento que ninguém
 * viu, o clube que te revelou querendo você de volta).
 */
import type { ContextoAtleta, DefEvento } from "../atleta/motor";
import { riquezaDoClube } from "../atleta/mundo";
import { arredondar, formatarDinheiro } from "../mercado/valores";

/** O clube que revelou o atleta quer ele de volta (proposta no formato de `montarProposta`). */
function montarVolta(c: ContextoAtleta): Record<string, string | number> | null {
  const origem = c.a.historico[0]?.clubeId;
  const clube = origem ? c.estado.temporada.clubes[origem] : undefined;
  if (!clube || clube.id === c.clube.id) return null;
  // O clube de origem paga bem menos: no máximo o que cabe no orçamento dele.
  const sal = arredondar(
    Math.min(
      c.a.contrato.salario * 0.6,
      salarioDeMercado(c.j, c.a.vida.fama) * riquezaDoClube(c.estado, clube) * 0.7,
    ),
  );
  return { clubeId0: clube.id, clube0: clube.nome, sal0: sal, salario0: formatarDinheiro(sal), anos: 2 };
}

export const EVENTOS_ATLETA_MOMENTOS: DefEvento[] = [
  // ───────────── Marcos ─────────────
  {
    id: "marco-estreia",
    categoria: "marco",
    titulo: "A estreia",
    texto:
      "Você entrou em campo pela primeira vez como profissional do {clube}. No túnel, o barulho era tanto que você não ouvia a própria respiração. A camisa do jogo está no seu armário, ainda suada.",
    agendado: true,
    opcoes: [
      {
        texto: "Dar a camisa para a sua mãe",
        dica: "Ela vai emoldurar",
        efeito: { vida: { familia: 8, moral: 4 } },
        resultado: "Ela pendurou na parede da sala, do lado da foto do seu batizado.",
        auto: true,
      },
      {
        texto: "Trocar com o craque do time adversário",
        efeito: { vida: { fama: 3, moral: 3 } },
        resultado:
          "Ele te deu a camisa e disse: “Continua assim, garoto”. Você vai lembrar disso para sempre.",
      },
      {
        texto: "Guardar para você, sem lavar",
        efeito: { vida: { moral: 5 }, marcar: { confiante: 2 } },
        resultado: "Ela está num saco plástico no fundo do armário. Às vezes você abre só para ver.",
      },
    ],
  },
  {
    id: "marco-primeiro-gol",
    categoria: "marco",
    titulo: "Seu primeiro gol",
    texto:
      "Quando a bola entrou, você ficou parado um segundo antes de lembrar de comemorar. Já são {gols} gols oficiais, mas o primeiro é um só.",
    agendado: true,
    opcoes: [
      {
        texto: "Correr para comemorar na frente da torcida",
        dica: "A torcida vai lembrar dessa cena",
        efeito: { vida: { torcida: 6, fama: 3, moral: 5 } },
        resultado: "A foto de você pendurado no alambrado virou capa do jornal.",
        auto: true,
      },
      {
        texto: "Abraçar primeiro quem deu o passe",
        dica: "O vestiário vai reparar",
        efeito: { vida: { elenco: 7, moral: 4 } },
        resultado: "O passe foi do capitão. Ele bagunçou o seu cabelo e disse “o primeiro de muitos”.",
      },
      {
        texto: "Pedir a bola do jogo",
        dica: "Pode ser que não te deem",
        efeito: { vida: { moral: 6, familia: 3 } },
        resultado: "O árbitro te entregou a bola com um sorriso. Ela está na estante do seu pai.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { moral: 1 } },
            resultado: "A bola já tinha ido para a arquibancada. Uma criança dormiu abraçada com ela.",
          },
        },
      },
    ],
  },
  {
    id: "marco-hat-trick",
    categoria: "marco",
    titulo: "Hat-trick!",
    texto:
      "Três gols no mesmo jogo, o primeiro da sua carreira. No apito final, o gandula corre na sua direção com a bola debaixo do braço.",
    agendado: true,
    opcoes: [
      {
        texto: "Levar a bola para casa, autografada pelo time",
        efeito: { vida: { moral: 6, elenco: 3, fama: 2 } },
        resultado: "Todos assinaram, até o massagista. A bola tem lugar de honra na sua sala.",
        auto: true,
      },
      {
        texto: "Dar a bola para o gandula",
        efeito: { vida: { torcida: 6, reputacao: 3, fama: 3 } },
        resultado: "O menino chorou na frente das câmeras. A cena rodou o mundo.",
      },
      {
        texto: "Dedicar os gols à sua família na entrevista",
        efeito: { vida: { familia: 8, moral: 4 } },
        resultado: "Sua mãe assistiu à entrevista seis vezes, segundo seu pai.",
      },
    ],
  },
  {
    id: "marco-gols",
    categoria: "marco",
    titulo: "Gol número {n}",
    texto:
      "Você chegou ao gol número {n} na carreira. O {clube} preparou uma camisa especial com o número {n} nas costas e quer entregar antes do próximo jogo em casa.",
    agendado: true,
    opcoes: [
      {
        texto: "Receber com a família na beira do campo",
        dica: "O dia é deles também",
        efeito: { vida: { familia: 7, moral: 5, torcida: 3 } },
        resultado: "Seu pai segurou a camisa como se fosse uma taça.",
        auto: true,
      },
      {
        texto: "Doar a camisa para leilão beneficente",
        efeito: { vida: { reputacao: 5, fama: 3 } },
        resultado: "A camisa foi arrematada por um valor que reformou uma ala de hospital infantil.",
      },
      {
        texto: "Dizer aos jornalistas qual é a próxima meta",
        dica: "Eles não vão esquecer a frase",
        efeito: { vida: { fama: 4, imprensa: 3 }, marcar: { confiante: 4 } },
        resultado: "A frase virou manchete. Agora você tem uma meta pública.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { vida: { fama: 2 }, marcar: { pressionado: 3 } },
            resultado: "A frase virou cobrança a cada jogo sem gol.",
          },
        },
      },
    ],
  },
  {
    id: "marco-jogos",
    categoria: "marco",
    titulo: "Jogo número {n}",
    texto:
      "Antes do jogo, o {clube} te entregou uma camisa com o número {n} nas costas. Você já tem {jogos} partidas oficiais na carreira.",
    agendado: true,
    opcoes: [
      {
        texto: "Dar a camisa para a base",
        dica: "A garotada vai ver a camisa todo dia",
        efeito: { vida: { reputacao: 4, elenco: 3 } },
        resultado: "A camisa está pendurada na entrada do vestiário da base.",
        auto: true,
      },
      {
        texto: "Chamar a família para receber com você",
        efeito: { vida: { familia: 7, moral: 4 } },
        resultado: "Seus filhos entraram em campo de mãos dadas com você. Ou seus sobrinhos. Ou o cachorro.",
      },
      {
        texto: "Prometer mais tantos jogos quanto já jogou",
        dica: "Os jornalistas não vão esquecer",
        efeito: { vida: { fama: 3, torcida: 3 }, marcar: { confiante: 3 } },
        resultado: "O estádio aplaudiu. Seu joelho fingiu que não ouviu.",
      },
    ],
  },
  {
    id: "marco-primeiro-titulo",
    categoria: "marco",
    titulo: "O primeiro título",
    texto:
      "A medalha ainda está no seu pescoço no vestiário. Tem champanhe no chão, música alta e o técnico dançando em cima do banco. É o primeiro título da sua carreira.",
    agendado: true,
    opcoes: [
      {
        texto: "Ficar na festa até o sol nascer",
        efeito: { vida: { elenco: 7, moral: 8, forma: -4 }, marcar: { ressaca: 2 } },
        resultado: "Você não lembra como chegou em casa. Lembra de tudo antes disso.",
      },
      {
        texto: "Pegar a estrada e levar a medalha para o seu pai",
        efeito: { vida: { familia: 12, moral: 6 } },
        resultado: "Quatro horas de estrada. Ele estava acordado te esperando na varanda.",
        auto: true,
      },
      {
        texto: "Tatuar a taça na panturrilha",
        efeito: { vida: { fama: 3, moral: 4 } },
        resultado: "Ficou parecendo um vaso, mas você sabe o que é.",
      },
    ],
  },
  {
    id: "marco-estreia-selecao",
    categoria: "selecao",
    titulo: "Estreia pela seleção",
    texto:
      "Antes do jogo tocou o hino, e você estava na fila ao lado de jogadores que via na TV quando era criança. Quando o jogo acabou, você levou a camisa da seleção para o hotel.",
    agendado: true,
    opcoes: [
      {
        texto: "Mandar a camisa para casa",
        dica: "Sua família esperou muito por este dia",
        efeito: { vida: { familia: 9, moral: 5 } },
        resultado: "Sua mãe dormiu com ela naquela noite. Seu pai negou que chorou.",
        auto: true,
      },
      {
        texto: "Mandar para a base onde você começou",
        dica: "Foi lá que tudo começou",
        efeito: { vida: { reputacao: 5, torcida: 3 } },
        resultado: "A escolinha fez uma festa para receber a camisa.",
      },
      {
        texto: "Voltar a treinar no clube no dia seguinte",
        dica: "Você vai faltar às entrevistas da seleção",
        efeito: { vida: { tecnico: 6, imprensa: -3 }, marcar: { focado: 2 } },
        resultado: "Às 8h você estava no CT. {tecnico} anotou.",
      },
    ],
  },

  // ───────────── Semana de jogo grande ─────────────
  {
    id: "semana-de-classico",
    categoria: "carreira",
    titulo: "Semana de clássico contra o {adversario}",
    texto:
      "Tem torcedor todo dia na porta do CT. A cidade está cheia de bandeiras dos dois times, e {tecnico} avisou que os treinos desta semana são fechados.",
    agendado: true,
    opcoes: [
      {
        texto: "Não dar entrevista e focar no treino",
        dica: "Deixe para falar em campo",
        efeito: { vida: { tecnico: 2 }, marcar: { focado: 2 } },
        resultado: "Uma semana em silêncio. Você chega ao clássico com a cabeça no lugar.",
        auto: true,
      },
      {
        texto: "Falar nas entrevistas o que a torcida sente",
        dica: "Se ganhar, vira herói; se perder, a rival não esquece",
        efeito: { vida: { torcida: 7, fama: 3 }, marcar: { confiante: 2 } },
        resultado: "Sua frase estampou os jornais. A torcida comprou a briga com você.",
        sorte: {
          p: 0.45,
          senao: {
            efeito: { vida: { torcida: 3, imprensa: -3 }, marcar: { pressionado: 2 } },
            resultado: "A frase virou munição do rival. Cada lance seu vai ser vaiado em dobro.",
          },
        },
      },
      {
        texto: "Ver três vezes os últimos cinco jogos do rival",
        dica: "Conhecer o rival não garante a vitória",
        efeito: { vida: { tecnico: 3 }, marcar: { "estudou-rival": 2 } },
        resultado: "Você sabe para que lado o zagueiro deles gira. Falta saber se vai adiantar.",
      },
    ],
  },
  {
    id: "semana-de-final",
    categoria: "carreira",
    titulo: "Final contra o {adversario}",
    texto:
      "É a semana da final, contra o {adversario}. {tecnico} chamou o elenco para a sala de vídeo e passou a final mais famosa da história do clube. Ninguém falou nada quando a luz acendeu.",
    agendado: true,
    opcoes: [
      {
        texto: "Treinar finalização de primeira todo dia",
        dica: "Treino demais pode pesar nas pernas",
        efeito: { vida: { tecnico: 3 }, treino: 1, marcar: { focado: 2 } },
        resultado: "Trezentos chutes na semana. O pé está calibrado.",
        sorte: {
          p: 0.65,
          senao: {
            efeito: { vida: { forma: -5 }, marcar: { cansado: 2 } },
            resultado: "Na quinta-feira a coxa avisou. Você vai jogar, mas pesado.",
          },
        },
      },
      {
        texto: "Estudar a defesa deles com os atacantes",
        dica: "Menos treino de chute, mais leitura",
        efeito: { vida: { elenco: 3, tecnico: 2 }, marcar: { "estudou-rival": 2 } },
        resultado: "Vocês descobriram que o lateral deles não volta depois dos 70 minutos.",
        auto: true,
      },
      {
        texto: "Desligar o celular e dormir cedo a semana inteira",
        efeito: { vida: { forma: 4, imprensa: -2 }, marcar: { descansado: 2 } },
        resultado: "Ninguém te achou a semana toda. Nem a sua mãe.",
      },
      {
        texto: "Prometer o título na coletiva",
        dica: "Vira herói ou vira piada",
        efeito: { vida: { torcida: 8, fama: 4 }, marcar: { confiante: 2 } },
        resultado: "“Pode escrever: a taça é nossa.” O estádio vai estar lotado de faixas com a sua frase.",
        sorte: {
          p: 0.4,
          senao: {
            efeito: { vida: { torcida: 4, fama: 2 }, marcar: { pressionado: 2 } },
            resultado: "A frase está em todas as rádios. O peso também.",
          },
        },
      },
    ],
  },
  {
    id: "semana-de-mata-mata",
    categoria: "carreira",
    titulo: "Mata-mata: {fase}",
    texto:
      "Jogo de vida ou morte contra o {adversario}. No vestiário, alguém escreveu no quadro branco: “90 minutos ou 4 meses de arrependimento”.",
    agendado: true,
    opcoes: [
      {
        texto: "Ficar até mais tarde treinando bola parada",
        efeito: { vida: { tecnico: 2 }, marcar: { focado: 2 } },
        resultado: "Você e o goleiro reserva, sozinhos no campo, até a luz apagar.",
        auto: true,
      },
      {
        texto: "Puxar uma conversa só dos jogadores",
        dica: "Une o grupo; pode soar como cobrança",
        efeito: { vida: { elenco: 6 }, marcar: { confiante: 2 } },
        resultado: "Ninguém saiu da sala sem falar. O grupo está fechado.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { elenco: -4 } },
            resultado: "Um veterano achou que você não tinha esse direito. Ficou um clima.",
          },
        },
      },
    ],
  },
  {
    id: "noite-continental",
    categoria: "carreira",
    titulo: "Noite de {fase}",
    texto:
      "Hino da competição, estádio lotado, câmeras do mundo inteiro e o {adversario} do outro lado. É o tipo de jogo que vira vídeo de melhores momentos para sempre, ou de piores.",
    agendado: true,
    opcoes: [
      {
        texto: "Ficar no hotel revendo os lances do rival",
        dica: "Mais leitura de jogo; menos descanso",
        efeito: { vida: { tecnico: 2 }, marcar: { "estudou-rival": 2 } },
        resultado: "Você sabe de cor para que lado o zagueiro deles gira o corpo.",
        auto: true,
      },
      {
        texto: "Ir para o gramado ouvir o hino antes de todo mundo",
        dica: "Pode arrepiar e inspirar, ou pesar nas pernas",
        efeito: { vida: { moral: 3 }, marcar: { inspirado: 2 } },
        resultado: "Você fechou os olhos no círculo central e sentiu o estádio tremer.",
        sorte: {
          p: (c) => 0.45 + c.a.vida.moral / 250,
          senao: {
            efeito: { vida: { moral: -2 }, marcar: { pressionado: 2 } },
            resultado: "O barulho entrou fundo demais. Você vai entrar em campo com o coração na boca.",
          },
        },
      },
      {
        texto: "Prometer gol para a torcida que viajou",
        dica: "A promessa vira cobrança se não sair",
        efeito: { vida: { torcida: 5, fama: 2 }, marcar: { confiante: 2 } },
        resultado: "A torcida visitante cantou o seu nome a viagem inteira.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { torcida: 2 }, marcar: { pressionado: 2 } },
            resultado: "Agora cada chance perdida vai ecoar na arquibancada.",
          },
        },
      },
    ],
  },
  {
    id: "reencontro-ex",
    categoria: "carreira",
    titulo: "Reencontro com o {adversario}",
    texto:
      "No fim de semana tem jogo contra o {adversario}, seu ex-clube. Metade da torcida deles te idolatra, a outra metade te chama de traidor. A lei do ex está na boca de todo mundo.",
    agendado: true,
    opcoes: [
      {
        texto: "Prometer não comemorar se fizer gol",
        dica: "Respeito; a sua torcida atual pode não gostar",
        efeito: { vida: { reputacao: 4, torcida: -1 }, marcar: { focado: 2 } },
        resultado: "Os dois lados aplaudiram a sua entrevista.",
        auto: true,
      },
      {
        texto: "Prometer gol e comemoração na frente deles",
        dica: "Vira lenda ou vira meme",
        efeito: { vida: { torcida: 6, fama: 4, imprensa: -2 }, marcar: { confiante: 2 } },
        resultado: "Você vai entrar em campo com a faca nos dentes.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { torcida: 2, imprensa: -4 }, marcar: { pressionado: 2 } },
            resultado: "O ex-clube pendurou a sua frase no vestiário deles.",
          },
        },
      },
      {
        texto: "Mandar uma carta para a antiga torcida",
        efeito: { vida: { reputacao: 3, fama: 2, moral: 2 } },
        resultado: "A carta foi lida no telão antes do jogo. Teve aplauso.",
      },
    ],
  },

  // ───────────── Seleção ─────────────
  {
    id: "lista-torneio",
    categoria: "selecao",
    titulo: "{torneio}: o seu nome está na lista",
    texto:
      "O técnico da seleção leu os nomes devagar, em ordem alfabética, e o seu estava lá. Em algumas semanas começa a {torneio}. O país inteiro vai parar para assistir.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Ir para ganhar",
        dica: "Titular, todos os jogos, tudo ou nada",
        efeito: { acao: "torneio", vida: { moral: 6 } },
        resultado: "",
        auto: true,
      },
      {
        texto: "Ir, mas aceitar o banco para cuidar do corpo",
        dica: "Menos minutos, menos desgaste",
        efeito: { acao: "torneio", marcar: { "poupado-torneio": 4 }, vida: { forma: 4, tecnico: 3 } },
        resultado: "",
      },
      {
        texto: "Pedir dispensa",
        dica: "O clube agradece; o país, não",
        efeito: { vida: { fama: -8, imprensa: -12, torcida: -4, tecnico: 6, forma: 6 } },
        resultado: "O seu nome foi cortado da lista. Os programas de TV debateram o caso por uma semana.",
      },
    ],
  },
  {
    id: "volta-campeao",
    categoria: "selecao",
    titulo: "Campeões!",
    texto:
      "A seleção é campeã. No avião de volta, a taça passa de mão em mão e ninguém dorme. No aeroporto, um caminhão de bombeiros espera para o desfile pela cidade.",
    agendado: true,
    opcoes: [
      {
        texto: "Subir no caminhão e desfilar até a noite",
        efeito: { vida: { fama: 6, torcida: 6, moral: 6, forma: -4 }, marcar: { ressaca: 2 } },
        resultado: "Doze horas em cima do caminhão. Você perdeu a voz e ganhou o país.",
        auto: true,
      },
      {
        texto: "Ir direto para a sua cidade natal",
        efeito: { vida: { familia: 12, moral: 6 } },
        resultado: "A cidade inteira estava na praça. O prefeito decretou feriado.",
      },
      {
        texto: "Voltar logo ao clube",
        efeito: { vida: { tecnico: 6, elenco: 3 }, marcar: { inspirado: 2 } },
        resultado: "Você chegou ao CT de medalha no peito e chuteira na mão.",
      },
    ],
  },
  {
    id: "vice-na-final",
    categoria: "selecao",
    titulo: "A final perdida",
    texto:
      "A seleção perdeu a final. No gramado, você vê o outro time levantar a taça que estava a noventa minutos das suas mãos. As câmeras procuram o seu rosto.",
    agendado: true,
    opcoes: [
      {
        texto: "Ficar no gramado e aplaudir os campeões",
        efeito: { vida: { reputacao: 6, moral: -4 } },
        resultado: "A foto de você aplaudindo com os olhos vermelhos virou símbolo da campanha.",
        auto: true,
      },
      {
        texto: "Culpar a arbitragem na zona mista",
        efeito: { vida: { torcida: 3, imprensa: -6, reputacao: -4, moral: -2 } },
        resultado: "A entidade abriu processo. Metade do país concorda com você.",
      },
      {
        texto: "Prometer voltar e ganhar",
        efeito: { vida: { torcida: 4, moral: -1 }, marcar: { confiante: 4 } },
        resultado: "“Eu vou voltar aqui.” A frase vai te perseguir pelos próximos anos.",
      },
    ],
  },
  {
    id: "queda-selecao",
    categoria: "selecao",
    titulo: "Eliminados",
    texto:
      "A seleção caiu. O vestiário está em silêncio, só se ouve o chuveiro. Lá fora, a imprensa espera os jogadores na zona mista.",
    agendado: true,
    opcoes: [
      {
        texto: "Parar e falar com a imprensa",
        efeito: { vida: { imprensa: 5, reputacao: 3, moral: -3 } },
        resultado: "Você assumiu a sua parte. Os jornais elogiaram a postura.",
        auto: true,
      },
      {
        texto: "Passar direto, de fone",
        efeito: { vida: { imprensa: -4, moral: -2 } },
        resultado: "A foto de você de fone, passando, foi a capa do dia seguinte.",
      },
      {
        texto: "Anunciar que deixa a seleção",
        dica: "Sem volta",
        efeito: {
          vida: { imprensa: -2, fama: 3, moral: -4, forma: 4 },
          marcar: { "aposentou-selecao": null },
        },
        resultado: "Uma carta no seu perfil: “Obrigado por tudo”. O país ficou dividido.",
        so: (c) => c.a.idade >= 28,
      },
    ],
  },
  {
    id: "fora-da-selecao",
    categoria: "selecao",
    titulo: "Fora da seleção",
    texto:
      "A seleção divulgou a nova convocação, e a lista chegou por mensagem no seu celular. Você já jogou pela seleção, mas desta vez o seu nome não está lá.",
    peso: 3,
    maximo: 6,
    intervalo: 40,
    requer: {
      teste: (c) =>
        c.a.convocacoes > 0 &&
        (c.a.marcas.selecao ?? -1) < c.a.semana &&
        (c.a.marcas["aposentou-selecao"] ?? -1) < c.a.semana,
    },
    opcoes: [
      {
        texto: "Mandar só um obrigado ao técnico da seleção",
        dica: "Sem confusão; você não fica sabendo o motivo",
        efeito: { vida: { reputacao: 3, moral: -3 } },
        resultado: "Ele respondeu: “Porta aberta”. Você vai acreditar nisso.",
        auto: true,
      },
      {
        texto: "Ligar e perguntar o motivo",
        dica: "Você tem direito à verdade; a conversa pode dar errado",
        efeito: { vida: { moral: 2 }, marcar: { focado: 3 } },
        resultado: "Ele foi direto: falta regularidade. Agora você sabe o que fazer.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { moral: -5, imprensa: -3 } },
            resultado: "A conversa azedou e vazou. Agora você é “o jogador que brigou com a seleção”.",
          },
        },
      },
      {
        texto: "Anunciar que deixa a seleção",
        dica: "Sai por conta própria; a partir daqui não tem volta",
        efeito: {
          vida: { fama: 2, moral: -2, forma: 3, tecnico: 3 },
          marcar: { "aposentou-selecao": null },
        },
        resultado: "Você agradeceu pelos jogos e encerrou essa história.",
        so: (c) => c.a.idade >= 27,
      },
    ],
  },

  // ───────────── Bola de Ouro ─────────────
  {
    id: "noite-bola-de-ouro",
    categoria: "marco",
    titulo: "A noite da Bola de Ouro",
    texto:
      "Teatro lotado, smoking alugado e o seu nome lido em voz alta. Você é o melhor jogador do mundo. Agora tem um microfone na sua frente e um teatro inteiro em silêncio.",
    agendado: true,
    opcoes: [
      {
        texto: "Agradecer à família, que está na primeira fila",
        efeito: { vida: { familia: 12, moral: 8, reputacao: 4 } },
        resultado: "Você não conseguiu terminar a frase sobre a sua mãe. Não precisava.",
        auto: true,
      },
      {
        texto: "Dedicar a quem duvidou de você",
        dica: "Discurso para a história; a imprensa vai repercutir",
        efeito: { vida: { fama: 8, moral: 6, imprensa: -4 } },
        resultado: "“Isso aqui é para quem disse que eu não ia passar da base.” O teatro aplaudiu de pé.",
      },
      {
        texto: "Chamar os companheiros de time ao palco",
        efeito: { vida: { elenco: 12, reputacao: 5, moral: 6 } },
        resultado: "Onze jogadores de smoking no palco. A foto é a mais bonita da noite.",
      },
    ],
  },
  {
    id: "cerimonia-podio",
    categoria: "marco",
    titulo: "Quase",
    texto:
      "Você está entre os três melhores do mundo, mas a Bola de Ouro foi para outro jogador. A cerimônia é amanhã à noite, e o seu lugar na primeira fila está reservado.",
    agendado: true,
    opcoes: [
      {
        texto: "Ir e aplaudir o vencedor",
        efeito: { vida: { reputacao: 6, moral: -2 }, marcar: { focado: 3 } },
        resultado: "Você foi o primeiro a cumprimentar o vencedor. Voltou para casa com fome de ano que vem.",
        auto: true,
      },
      {
        texto: "Boicotar a cerimônia",
        dica: "Recado forte; nem todo mundo vai entender",
        efeito: { vida: { fama: 5, imprensa: -8, reputacao: -5, torcida: 3 }, marcar: { confiante: 4 } },
        resultado: "O seu lugar vazio na primeira fila foi a imagem da noite.",
      },
      {
        texto: "Postar uma indireta",
        efeito: { vida: { fama: 4, imprensa: -4, moral: 1 } },
        resultado: "Um emoji de palhaço, sem legenda. A internet entendeu.",
      },
    ],
  },

  // ───────────── Momentos de jogo e de vestiário ─────────────
  {
    id: "volta-da-lesao",
    categoria: "saude",
    titulo: "A volta da lesão",
    texto:
      "O médico do clube te deu o plano de recuperação. Seguindo à risca, você volta à lista de relacionados algumas semanas depois do que gostaria.",
    peso: 6,
    maximo: 8,
    intervalo: 30,
    requer: { teste: (c) => c.j.lesao >= 3 },
    opcoes: [
      {
        texto: "Seguir o plano do médico",
        dica: "Volta mais tarde, com menos chance de recaída",
        efeito: { vida: { tecnico: 2, forma: 3 }, marcar: { "cuida-do-corpo": 20 } },
        resultado: "Você fez cada exercício como mandaram. O médico te chamou de paciente-modelo.",
        auto: true,
      },
      {
        texto: "Treinar dobrado para voltar antes",
        dica: "Pode voltar antes; pode se machucar de novo",
        efeito: { recuperar: 2, vida: { tecnico: 3, moral: 3 } },
        resultado: "Você voltou uma semana antes e sem dor.",
        sorte: {
          p: 0.55,
          senao: {
            efeito: { lesao: 6, vida: { moral: -8, tecnico: -2 } },
            resultado: "A fisgada voltou no primeiro treino com bola. Mais seis semanas.",
          },
        },
      },
      {
        texto: "Procurar o seu fisioterapeuta de confiança",
        dica: "O médico do clube pode não gostar",
        efeito: { meses: -0.2, vida: { tecnico: -3, forma: 4, moral: 2 } },
        resultado: "O seu fisioterapeuta tem mãos de ouro. O médico do clube tem memória longa.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { meses: -0.2, vida: { tecnico: -6 } },
            resultado: "O médico descobriu e reclamou com a diretoria. Clima ruim no departamento médico.",
          },
        },
      },
    ],
  },
  {
    id: "pernas-pesadas",
    categoria: "saude",
    titulo: "As pernas pesam",
    texto:
      "Muitos jogos seguidos e as panturrilhas travam a cada pique. O GPS do treino mostra que você corre 15% menos do que no começo da temporada.",
    peso: 5,
    maximo: 6,
    intervalo: 20,
    requer: { max: { forma: 45 } },
    opcoes: [
      {
        texto: "Pedir ao técnico para ficar fora do próximo jogo",
        dica: "Descansa; alguém pode pegar a sua vaga",
        efeito: { vida: { forma: 10, tecnico: -2 }, marcar: { "ausente-jogo": 1 } },
        resultado: "Uma semana de descanso de verdade. As pernas voltaram.",
        auto: true,
      },
      {
        texto: "Jogar no sacrifício",
        dica: "Pode render; pode virar lesão",
        efeito: { vida: { tecnico: 3, torcida: 2 }, marcar: { dor: 2 } },
        resultado: "Você vai jogar no limite.",
        sorte: {
          p: 0.65,
          senao: {
            efeito: { lesao: 4, vida: { moral: -5 } },
            resultado: "A panturrilha estourou no treino. Quatro semanas fora.",
          },
        },
      },
      {
        texto: "Tratamento intensivo: crioterapia, massagem e sono",
        efeito: { meses: -0.15, vida: { forma: 6 } },
        resultado: "Câmara de gelo, botas de compressão e dez horas de sono. Funcionou.",
      },
    ],
  },
  {
    id: "impedimento-nao-marcado",
    categoria: "carreira",
    titulo: "O impedimento que ninguém viu",
    texto:
      "Gol vazio, bola no seu pé. Você olha para trás: o assistente não levantou a bandeira, mas você sabe que estava meio metro impedido. O estádio inteiro espera você empurrar.",
    peso: 2,
    intervalo: 100,
    requer: { teste: (c) => ["ATA", "PD", "PE", "MEI"].includes(c.j.pos) },
    opcoes: [
      {
        texto: "Empurrar para o gol e deixar a arbitragem decidir",
        dica: "O gol pode valer; se o VAR pegar, pega mal",
        efeito: { vida: { torcida: 3, moral: 3 }, marcar: { confiante: 2 } },
        resultado: "Gol validado. Você comemorou sem olhar para o bandeirinha.",
        sorte: {
          p: 0.75,
          senao: {
            efeito: { vida: { imprensa: -3, moral: -2 } },
            resultado: "O VAR anulou e a câmera pegou o seu sorriso amarelo.",
          },
        },
        auto: true,
      },
      {
        texto: "Parar e avisar o árbitro do impedimento",
        dica: "Honestidade fica na memória; seu técnico pode não entender",
        efeito: {
          vida: { reputacao: 9, imprensa: 7, fama: 4, tecnico: -5, torcida: -3 },
          noticia: {
            texto: "Atacante avisa o próprio impedimento e recebe aplausos do estádio rival.",
            tipo: "bom",
          },
        },
        resultado: "O estádio rival te aplaudiu de pé. O seu técnico ficou de braços cruzados.",
      },
      {
        texto: "Rolar para um companheiro em posição legal",
        dica: "Gol limpo, se ele não errar",
        efeito: { vida: { elenco: 5, reputacao: 3 } },
        resultado: "Ele só empurrou. Na comemoração, apontou para você.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { vida: { elenco: 1, moral: -2 } },
            resultado: "Ele furou. O estádio inteiro segurou a cabeça.",
          },
        },
      },
    ],
  },
  {
    id: "pior-armario",
    categoria: "vestiario",
    titulo: "O pior armário",
    texto:
      "Os armários do vestiário foram redistribuídos e você ficou com o do lado da porta: entra vento, os ganchos são tortos e na prateleira ficou um esparadrapo esquecido do dono anterior. Os veteranos ficam no canto, nos grandes.",
    peso: 3,
    intervalo: 200,
    unico: true,
    requer: { idade: [17, 20] },
    opcoes: [
      {
        texto: "Usar sem reclamar",
        dica: "O grupo pode achar que você só merece esse lugar",
        efeito: { vida: { elenco: 4, tecnico: 1 } },
        resultado: "Um veterano reparou e, no fim do mês, te chamou para o armário do lado dele.",
        auto: true,
      },
      {
        texto: "Pedir ao roupeiro para trocar",
        dica: "Um garoto pedindo troca, e a história pode chegar distorcida",
        efeito: { vida: { moral: 3 } },
        resultado: "O roupeiro trocou sem alarde. Ninguém comentou.",
        sorte: {
          p: 0.4,
          senao: {
            efeito: { vida: { elenco: -5, moral: -2 } },
            resultado: "A história chegou aos veteranos como “o garoto já quer luxo”.",
          },
        },
      },
      {
        texto: "Guardar o esparadrapo do dono anterior como amuleto",
        efeito: { vida: { moral: 2 }, marcar: { confiante: 3 } },
        resultado: "Descobriram que o armário era de um ídolo do clube. O esparadrapo virou relíquia.",
      },
    ],
  },
  {
    id: "estadio-lotado",
    categoria: "carreira",
    titulo: "Uma hora e meia antes",
    texto:
      "Você saiu cedo para sentir o gramado. A arquibancada tem um terço da lotação e o barulho já aperta os ouvidos como pressão de avião. O segurança sorri: “Lotado é sessenta mil. Isso é um terço.”",
    peso: 2,
    intervalo: 80,
    requer: { idade: [17, 23] },
    opcoes: [
      {
        texto: "Ficar no círculo central mais um minuto",
        dica: "Ou você se acostuma agora, ou o barulho te pega no jogo",
        efeito: { vida: { moral: 3 }, marcar: { confiante: 2 } },
        resultado: "Você fechou os olhos e deixou o barulho entrar. Na hora do jogo, era só música.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { vida: { moral: -2 }, marcar: { pressionado: 2 } },
            resultado: "As pernas tremeram ali mesmo. Vai ser um jogo longo.",
          },
        },
      },
      {
        texto: "Voltar para o vestiário e colocar o fone",
        dica: "Rotina conhecida, nenhum experimento hoje",
        efeito: { marcar: { focado: 2 } },
        resultado: "Mesma playlist, mesma ordem da chuteira. Cabeça no lugar.",
        auto: true,
      },
    ],
  },
  {
    id: "clube-que-revelou",
    categoria: "carreira",
    titulo: "O {clube0} quer você de volta",
    texto:
      "O presidente do {clube0}, o clube que te revelou, ligou pessoalmente: quer você de volta por {anos} anos, ganhando {salario0} por ano. É bem menos do que você ganha hoje. “A torcida nunca te esqueceu.”",
    peso: 2,
    intervalo: 100,
    capital: true,
    montar: montarVolta,
    // Não logo depois de assinar com outro clube.
    requer: {
      idade: [29, 39],
      min: { fama: 60 },
      semMarcas: ["recem-contratado"],
    },
    opcoes: [
      {
        texto: "Voltar para casa",
        dica: "Menos dinheiro; o coração manda",
        efeito: { acao: "aceitarProposta", vida: { familia: 8, moral: 8, torcida: 6 } },
        resultado: "",
      },
      {
        texto: "Prometer voltar antes de se aposentar",
        efeito: { vida: { reputacao: 2, familia: 2 } },
        resultado: "O presidente disse que vai cobrar. A torcida de lá já fez faixa.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: { vida: { empresario: 3 } },
        resultado: "Você agradeceu e desligou. Ficou olhando a foto da sua estreia por um tempo.",
      },
    ],
  },
];
