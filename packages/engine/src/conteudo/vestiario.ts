/**
 * Textos do vestiário: preleções, conversas, coletivas e conselhos. A lógica de
 * quando cada um aparece fica em carreira/vestiario.ts; aqui só o que se lê
 * (e o efeito de cada resposta, que anda junto com o texto).
 */
import type { Efeito, OpcaoDeResposta, TomDeConversa } from "../carreira/tipos";
import type { Estilo } from "../tipos";

export const TONS: Record<TomDeConversa, { nome: string; fala: string }> = {
  calmo: { nome: "Calma", fala: "Joguem o nosso jogo, sem afobação." },
  motivar: { nome: "Motivar", fala: "Eu confio em cada um de vocês. Vamos pra cima!" },
  cobrar: { nome: "Cobrar", fala: "Isso aqui não é o que a gente treinou. Quero mais!" },
  elogiar: { nome: "Elogiar", fala: "Vocês estão fazendo exatamente o que pedi. Parabéns." },
  semPressao: { nome: "Tirar a pressão", fala: "Ninguém espera nada da gente hoje. Joguem soltos." },
  agressivo: { nome: "Bronca", fala: "(batendo na prancheta) Que vergonha! Acordem!" },
};

export function reacaoIndividual(nome: string, d: number): string {
  if (d >= 6) return `${nome} parece muito motivado.`;
  if (d >= 2) return `${nome} reagiu bem.`;
  if (d > -2) return `${nome} ficou indiferente.`;
  if (d > -6) return `${nome} não gostou do que ouviu.`;
  return `${nome} ficou visivelmente abalado.`;
}

export function reacaoDoGrupo(media: number): string {
  if (media >= 4) return "O vestiário respondeu muito bem.";
  if (media >= 1) return "O grupo absorveu a mensagem.";
  if (media > -1) return "A conversa não mudou muita coisa.";
  return "A fala caiu mal no vestiário.";
}

/* ---------- conversa individual ---------- */

export const CONVERSA = {
  elogiar: "Elogiar a fase dele",
  cobrar: "Cobrar mais empenho",
  minutos: "Prometer mais minutos nas próximas rodadas",
  paciencia: "Pedir paciência, a chance vai chegar",
  titular: "Garantir que ele segue titular",
  lideranca: "Pedir que ele assuma mais liderança",
  promessaMinutos: "Promessa registrada: ele precisa jogar em 2 das próximas 4 rodadas.",
  promessaTitular: "Promessa registrada: ele precisa começar as próximas 3 rodadas.",
};

/* ---------- coletivas ---------- */

export interface Pergunta {
  pergunta: string;
  opcoes: OpcaoDeResposta[];
}

const op = (texto: string, efeito: Efeito): OpcaoDeResposta => ({ texto, efeito });

export const COLETIVA = {
  vitoria: (adversario: string): Pergunta => ({
    pergunta: `Três pontos contra o ${adversario}. O time finalmente encontrou o caminho?`,
    opcoes: [
      op("O mérito é todo dos jogadores", { elenco: 3 }),
      op("Ainda temos muito a melhorar", { diretoria: 1 }),
      op("Eu sempre disse que esse time ia render", { torcida: 2, elenco: -1 }),
    ],
  }),
  derrota: (adversario: string, protesto: boolean): Pergunta => ({
    pergunta: `Derrota para o ${adversario}. ${protesto ? "A torcida protestou. " : ""}O que deu errado?`,
    opcoes: [
      op("A responsabilidade é minha", { elenco: 3, diretoria: -1 }),
      op("Os jogadores não fizeram o que pedi", { elenco: -5, torcida: 1 }),
      op("Fomos melhores, faltou detalhe", { torcida: -2, elenco: 1 }),
    ],
  }),
  empate: (adversario: string): Pergunta => ({
    pergunta: `Empate com o ${adversario}. Ficou satisfeito?`,
    opcoes: [
      op("Um ponto importante", { elenco: 1 }),
      op("Não, viemos para vencer", { torcida: 2, elenco: -1 }),
      op("Faz parte, seguimos trabalhando", {}),
    ],
  }),
  destaque: (nome: string, id: string, profissional: boolean): Pergunta => ({
    pergunta: `${nome} foi o melhor em campo. Ele está no melhor momento?`,
    opcoes: [
      op("Sim, merece todos os elogios", { jogador: { id, moral: 8 } }),
      op("Não gosto de individualizar", { elenco: 1 }),
      op("Ainda pode render mais", { jogador: { id, moral: profissional ? 2 : -5 } }),
    ],
  }),
  criticado: (nome: string, id: string): Pergunta => ({
    pergunta: `${nome} foi muito criticado hoje. Ele segue com você?`,
    opcoes: [
      op("Tem toda a minha confiança", { jogador: { id, moral: 7 } }),
      op("Vou avaliar durante a semana", { jogador: { id, moral: -3 } }),
      op("Ninguém tem vaga garantida", { jogador: { id, moral: -7 }, elenco: 1 }),
    ],
  }),
  encostado: (nome: string, id: string, jogos: number): Pergunta => ({
    pergunta: `${nome} não entra em campo há ${jogos} jogos. Por quê?`,
    opcoes: [
      op("Ele vai ter oportunidades em breve", {
        jogador: { id, moral: 6 },
        promessa: { tipo: "minutos", jogadorId: id, nome, meta: 2, prazo: 4 },
      }),
      op("Opção técnica", { jogador: { id, moral: -5 } }),
      op("Ele precisa treinar melhor", { jogador: { id, moral: -9 }, elenco: -1 }),
    ],
  }),
  cargoAmeacado: (): Pergunta => ({
    pergunta: "Dizem que a diretoria já sonda outros técnicos. Você se sente ameaçado?",
    opcoes: [
      op("Tenho contrato e confio no meu trabalho", { diretoria: 1 }),
      op("Quem decide é o presidente", { diretoria: -1, torcida: 1 }),
      op("Só penso no próximo jogo", {}),
    ],
  }),
  classico: (adversario: string): Pergunta => ({
    pergunta: `Clássico contra o ${adversario}. Qual o recado para a torcida?`,
    opcoes: [
      op("Vamos pra cima deles", { torcida: 3, elenco: 1, marcar: "prometeuClassico" }),
      op("Respeitamos o adversário", {}),
      op("É um jogo como outro qualquer", { torcida: -2, elenco: 2 }),
    ],
  }),
  abaixoDaMeta: (clube: string, posicao: number, adversario: string): Pergunta => ({
    pergunta: `O ${clube} está em ${posicao}º, abaixo da meta. A pressão aumenta contra o ${adversario}?`,
    opcoes: [
      op(`Pressão faz parte do ${clube}`, { torcida: 1 }),
      op("O elenco precisa reagir", { elenco: -2, diretoria: 1 }),
      op("Confio na virada", { elenco: 2 }),
    ],
  }),
};

/* ---------- auxiliar ---------- */

export const DICA_POR_ESTILO: Record<Estilo, string> = {
  "contra-ataque": "Eles saem muito rápido. Eu evitaria a linha alta hoje.",
  posse: "Eles gostam de sair jogando. Pressão alta pode forçar erros.",
  defensivo: "Vão fechar o meio. Precisamos de amplitude e cruzamentos.",
  intenso: "Eles cansam no segundo tempo. Guarde as trocas para depois dos 60.",
  ofensivo: "Deixam muito espaço atrás. Contra-ataque pode render.",
  equilibrado: "Jogo parelho. Manter o equilíbrio e explorar a bola parada.",
};

export const CONSELHO_INTERVALO = {
  cansados: (nomes: string[]) =>
    `${nomes.join(" e ")} já ${nomes.length > 1 ? "estão cansados" : "está cansado"}.`,
  malNoJogo: (nome: string) => `${nome} está mal no jogo.`,
  elesChegamMais: "Eles estão chegando mais. Talvez valha recuar a linha.",
  faltaCapricho: "Estamos criando, falta caprichar. Mantém a pegada.",
  controlado: "Jogo controlado. Eu não mexeria muito.",
};

/* ---------- falas da preleção por momento e placar ---------- */

export type SituacaoDaFala =
  | "antes"
  | "vencendo"
  | "empatando"
  | "perdendo"
  | "vitoria"
  | "empate"
  | "derrota";

const FALAS: Record<SituacaoDaFala, Record<TomDeConversa, string[]>> = {
  antes: {
    calmo: [
      "Joguem o nosso jogo, sem afobação.",
      "Cabeça fria. Fizemos o trabalho na semana, agora é executar.",
      "Sem pressa: a bola vai chegar, confiem no plano.",
    ],
    motivar: [
      "Eu confio em cada um de vocês. Vamos pra cima!",
      "Hoje é dia de mostrar quem a gente é. Pra cima deles!",
      "Olhem pro lado: esse grupo é forte. Vamos fazer história hoje.",
    ],
    cobrar: [
      "Quero intensidade desde o primeiro minuto. Sem desculpa.",
      "Semana passada não foi o suficiente. Hoje eu quero mais.",
      "Quem não correr, sai. Simples assim.",
    ],
    elogiar: [
      "A semana de treino foi excelente. Levem isso pro campo.",
      "Vocês merecem estar aqui. Joguem com orgulho.",
      "O trabalho de vocês tem sido impecável. Continuem assim.",
    ],
    semPressao: [
      "Ninguém espera nada da gente hoje. Joguem soltos.",
      "A pressão é toda deles. Divirtam-se lá dentro.",
      "Esqueçam a tabela. É só mais um jogo de bola.",
    ],
    agressivo: [
      "(batendo na prancheta) Hoje ninguém tira ponto da gente!",
      "Entrem com sangue nos olhos. Dividida é nossa!",
      "Eu quero raça! Quem amarelar não volta pro time.",
    ],
  },
  vencendo: {
    calmo: [
      "Tá tudo sob controle. Mantenham a organização.",
      "Não precisa inventar: segura a bola e administra.",
      "Calma, o jogo é nosso. Só não dêem espaço.",
    ],
    motivar: [
      "Tá dando certo! Vamos atrás do segundo, do terceiro!",
      "Não tirem o pé. Quero sair daqui com goleada.",
      "Esse é o time que eu quero ver. Mais 45 assim!",
    ],
    cobrar: [
      "Tá ganhando, mas eu vi muita desatenção. Corrijam.",
      "Placar engana: deixamos eles gostarem do jogo. Acordem.",
      "Ninguém relaxa. Jogo só acaba no apito.",
    ],
    elogiar: [
      "Primeiro tempo perfeito. Exatamente o que treinamos.",
      "Que atuação! Continuem fazendo o simples.",
      "Estou orgulhoso. Mais um tempo desse e é nosso.",
    ],
    semPressao: [
      "O mais difícil já foi. Joguem leve.",
      "Aproveitem: o jogo está na mão, sem stress.",
      "Sem pressão, só curtam e não dêem bobeira.",
    ],
    agressivo: [
      "Vencendo e jogando mal? Não aceito! Quero mais!",
      "(chutando a garrafa) Isso foi sorte! Acordem!",
      "Se continuar assim, a gente perde. Que vergonha!",
    ],
  },
  empatando: {
    calmo: [
      "O jogo está aberto. Paciência que o gol sai.",
      "Nada mudou: segue o plano e a chance aparece.",
      "Calma. Um detalhe decide, e o detalhe vai ser nosso.",
    ],
    motivar: [
      "Dá pra ganhar! Vamos buscar esse gol!",
      "Esse jogo é nosso se a gente quiser mais que eles.",
      "Um gol muda tudo. Acreditem!",
    ],
    cobrar: [
      "Empate não serve. Quero mais agressividade.",
      "Faltou coragem no primeiro tempo. Quero ver atitude.",
      "Tá faltando vontade. Quero mais chute, mais infiltração.",
    ],
    elogiar: [
      "Bom primeiro tempo, falta só caprichar no último passe.",
      "Estamos melhores em campo. Continuem que vai sair.",
      "Gostei da postura. Agora é ajustar a mira.",
    ],
    semPressao: [
      "Um ponto fora não é ruim. Joguem tranquilos.",
      "Sem desespero: o jogo vem pra gente.",
      "Joguem soltos, sem medo de errar.",
    ],
    agressivo: [
      "(batendo na mesa) Que primeiro tempo horrível! Acordem!",
      "Isso é time de quem quer ganhar? Mostrem!",
      "Vocês estão dormindo em campo. Chega!",
    ],
  },
  perdendo: {
    calmo: [
      "Calma: temos tempo de sobra pra virar.",
      "Ninguém entra em pânico. Um gol e o jogo muda.",
      "Respirem. Joguem o nosso jogo e a virada vem.",
    ],
    motivar: [
      "Ainda dá! Esse grupo já virou jogo pior.",
      "45 minutos pra escrever uma virada. Bora!",
      "Eu acredito na virada. Vocês acreditam?",
    ],
    cobrar: [
      "Isso aqui não é o que a gente treinou. Quero mais!",
      "Tô decepcionado. Vocês estão entregando o jogo.",
      "Ou muda a postura, ou eu mudo o time.",
    ],
    elogiar: [
      "O placar é injusto. Continuem jogando assim que vira.",
      "Estamos jogando bem, só falta o gol. Insistam.",
      "Não abaixem a cabeça: a atuação está boa.",
    ],
    semPressao: [
      "Não tem mais nada a perder. Arrisquem tudo.",
      "Esqueçam o placar. Joguem pela diversão.",
      "Joguem soltos, o pior já aconteceu.",
    ],
    agressivo: [
      "(batendo na prancheta) Que vergonha! Acordem!",
      "Vocês estão humilhando essa camisa!",
      "Quem não quiser jogar pode ficar aqui no vestiário!",
    ],
  },
  vitoria: {
    calmo: [
      "Bom resultado. Pé no chão, semana que vem tem mais.",
      "Vitória merecida. Agora descansem e recuperem.",
      "Três pontos, sem euforia. Seguimos trabalhando.",
    ],
    motivar: [
      "É isso! Esse é o caminho, vamos embalar!",
      "Que vitória! Quero esse time em todos os jogos.",
      "Comemorem: vocês mereceram cada ponto hoje.",
    ],
    cobrar: [
      "Ganhamos, mas tem muita coisa pra corrigir.",
      "Venceu, ok. Mas aquele segundo tempo não pode se repetir.",
      "Não se iludam com o placar. Dá pra jogar muito mais.",
    ],
    elogiar: [
      "Atuação de gala. Parabéns a cada um.",
      "Exatamente o que eu pedi. Tô orgulhoso.",
      "Vocês executaram o plano perfeitamente.",
    ],
    semPressao: [
      "Aproveitem a folga, vocês merecem.",
      "Curtam a vitória. Segunda-feira a gente pensa no próximo.",
      "Leveza: ganhar assim fica fácil.",
    ],
    agressivo: [
      "Ganhar jogando assim não me agrada! Quero mais!",
      "Sorte não ganha campeonato. Acordem!",
      "Vitória feia. Semana que vem ninguém dorme.",
    ],
  },
  empate: {
    calmo: [
      "Um ponto é um ponto. Seguimos.",
      "Empate justo. Vamos ver o que ajustar.",
      "Sem drama: a temporada é longa.",
    ],
    motivar: [
      "Faltou pouco! Na próxima a vitória vem.",
      "Gostei da entrega. Vamos transformar isso em vitória.",
      "Cabeça erguida, o time está no caminho.",
    ],
    cobrar: [
      "Empatar aqui é perder dois pontos.",
      "Faltou ambição. Não aceito jogar pelo empate.",
      "Muita bola desperdiçada. Isso tem que mudar.",
    ],
    elogiar: [
      "Postura boa, só faltou o gol.",
      "Jogo difícil e vocês não se entregaram. Valeu.",
      "Bom ponto contra um time forte.",
    ],
    semPressao: [
      "Ponto fora não é ruim. Descansem.",
      "Sem pressão: o empate tá de bom tamanho.",
      "Esqueçam esse jogo e foquem no próximo.",
    ],
    agressivo: [
      "Que apatia! Inaceitável!",
      "(batendo a porta) Isso não é time de ponta!",
      "Empate vergonhoso. Treino dobrado na semana.",
    ],
  },
  derrota: {
    calmo: [
      "Dia ruim acontece. Vamos analisar com calma.",
      "Cabeça fria. A gente se reergue no próximo.",
      "Derrota dói, mas não define a temporada.",
    ],
    motivar: [
      "Levantem a cabeça. Esse grupo é maior que essa derrota.",
      "Isso vai servir de combustível. Vamos dar a volta.",
      "Eu confio em vocês. Próximo jogo é resposta.",
    ],
    cobrar: [
      "Inadmissível. Faltou tudo hoje.",
      "Ninguém aqui jogou o que sabe. Quero explicações.",
      "Isso aqui não é o que a gente treinou. Quero mais!",
    ],
    elogiar: [
      "Perdemos, mas a entrega foi enorme.",
      "Resultado injusto pelo que vocês jogaram.",
      "Não tenho do que reclamar da postura de vocês.",
    ],
    semPressao: [
      "Esqueçam isso. Página virada.",
      "Ninguém esperava nada aqui. Bola pra frente.",
      "Tirem um peso: a temporada continua.",
    ],
    agressivo: [
      "(batendo na prancheta) Que vergonha! Acordem!",
      "Vocês envergonharam essa camisa hoje!",
      "Quem não quiser lutar, pode pedir pra sair!",
    ],
  },
};

/** Fala do tom conforme o momento/placar, variando pela semente. */
export function falaDoTom(tom: TomDeConversa, situacao: SituacaoDaFala, semente: number): string {
  const lista = FALAS[situacao][tom];
  return lista[Math.abs(semente) % lista.length]!;
}
