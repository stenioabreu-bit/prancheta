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
