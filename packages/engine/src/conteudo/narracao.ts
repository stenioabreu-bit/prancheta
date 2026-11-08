/**
 * Frases da narração. Marcadores: {t} time, {T} time em maiúsculas, {p} jogador
 * principal do lance, {a} quem deu o passe, {g} goleiro, {z} zagueiro, {v} quem sofreu a falta.
 */
export const NARRACAO = {
  posse: [
    "{t} troca passes com paciência no campo de defesa.",
    "{p} gira e abre o jogo.",
    "{t} tenta encontrar espaço pelo meio.",
    "Bola rodando no meio-campo, {t} controla.",
    "{p} recua para o goleiro, sem pressa.",
  ],
  press: [
    "{t} sufoca a saída de bola, {p} rouba na intermediária!",
    "Pressão alta funciona: {p} recupera no ataque.",
  ],
  trama: [
    "{a} tabela com {p} e encontra espaço na entrada da área...",
    "{a} acha {p} entre as linhas, que avança...",
    "Boa troca de passes do {t}, {a} enfia para {p}...",
  ],
  cruz: [
    "{a} vai à linha de fundo e cruza na área...",
    "Cruzamento de {a} procurando {p}...",
    "{a} levanta da intermediária...",
  ],
  contra: [
    "Contra-ataque do {t}! {a} lança {p} em velocidade...",
    "Roubada e saída rápida! {p} parte em direção ao gol...",
  ],
  fora: ["{p} arrisca de fora da área...", "Sobra para {p}, que solta a bomba de longe..."],
  indiv: [
    "{p} parte para cima, passa por um, passa por dois...",
    "{p} dribla na ponta e corta para dentro...",
  ],
  parada: ["Escanteio para o {t}. {a} cobra...", "Falta perigosa para o {t}. {a} na bola..."],
  gol: [
    "GOOOOL DO {T}! {p} não perdoa!",
    "É GOL! {p} balança a rede!",
    "GOL! {p} manda para o fundo da rede!",
  ],
  defesa: ["{g} faz grande defesa!", "{g} espalma para escanteio!", "Defesa segura de {g}."],
  paraFora: [
    "Passou raspando a trave!",
    "Para fora, por cima do travessão.",
    "Chute sem direção, tiro de meta.",
  ],
  bloqueio: ["Travado pela zaga!", "{z} se joga e bloqueia o chute."],
  falta: ["Falta de {p} em {v}.", "{p} chega atrasado e derruba {v}."],
  amarelo: ["Cartão amarelo para {p}."],
  vermelho: ["Cartão vermelho! {p} está expulso!"],
  lesao: ["{p} sente a coxa e pede atendimento.", "{p} fica caído após dividida, parece lesionado."],
} as const;

export function preencher(frase: string, valores: Record<string, string>): string {
  return frase.replace(/\{(\w)\}/g, (_, k: string) => valores[k] ?? "");
}
