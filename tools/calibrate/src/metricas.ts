/** O que a calibração guarda de cada jogo e de cada temporada. */
export interface JogoMedido {
  golsCasa: number;
  golsVisitante: number;
  /** Só existe nos jogos pelo motor minuto a minuto. */
  detalhe?: { amarelos: number; vermelhos: number; chutes: number; xg: number; lesoes: number };
}

export interface TemporadaMedida {
  jogos: JogoMedido[];
  artilheiro: { nome: string; gols: number };
  garcom: { nome: string; assist: number };
  pontosCampeao: number;
  pontosLanterna: number;
  /** Clube de maior força: gols por jogo e goleadas de 4+ a favor. */
  maisForte: { golsPorJogo: number; goleadas: number; pontos: number };
}

interface Resumo {
  media: number;
  /** Meia largura do intervalo de 95%. */
  margem: number;
}

function resumo(valores: number[]): Resumo {
  const n = valores.length;
  const media = valores.reduce((s, v) => s + v, 0) / n;
  const variancia = valores.reduce((s, v) => s + (v - media) ** 2, 0) / Math.max(1, n - 1);
  return { media, margem: 1.96 * Math.sqrt(variancia / n) };
}

export interface Relatorio {
  temporadas: number;
  jogos: number;
  golsPorJogo: Resumo;
  golsCasa: Resumo;
  golsVisitante: Resumo;
  vitoriaCasa: number;
  empate: number;
  vitoriaVisitante: number;
  zeroAZero: number;
  goleadas4: number;
  seisOuMaisGols: number;
  placares: [string, number][];
  artilheiro: Resumo & { min: number; max: number; nomes: string[] };
  garcom: Resumo & { max: number };
  pontosCampeao: Resumo;
  pontosLanterna: Resumo;
  maisForte: { golsPorJogo: number; goleadasPorTemporada: number; pontos: number };
  detalhe: {
    amarelos: number;
    vermelhos: number;
    chutes: number;
    xg: number;
    lesoes: number;
  } | null;
}

export function resumir(temporadas: TemporadaMedida[]): Relatorio {
  const jogos = temporadas.flatMap((t) => t.jogos);
  const n = jogos.length;
  const frac = (f: (j: JogoMedido) => boolean) => jogos.filter(f).length / n;
  const contagem = new Map<string, number>();
  for (const j of jogos) {
    const chave = `${j.golsCasa}x${j.golsVisitante}`;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  const placares = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([p, c]) => [p, c / n] as [string, number]);
  const artilheiros = temporadas.map((t) => t.artilheiro.gols);
  const comDetalhe = jogos.filter((j) => j.detalhe);
  const mediaDetalhe = (f: (d: NonNullable<JogoMedido["detalhe"]>) => number) =>
    comDetalhe.reduce((s, j) => s + f(j.detalhe!), 0) / comDetalhe.length;
  const nomesFrequentes = new Map<string, number>();
  for (const t of temporadas)
    nomesFrequentes.set(t.artilheiro.nome, (nomesFrequentes.get(t.artilheiro.nome) ?? 0) + 1);
  return {
    temporadas: temporadas.length,
    jogos: n,
    golsPorJogo: resumo(jogos.map((j) => j.golsCasa + j.golsVisitante)),
    golsCasa: resumo(jogos.map((j) => j.golsCasa)),
    golsVisitante: resumo(jogos.map((j) => j.golsVisitante)),
    vitoriaCasa: frac((j) => j.golsCasa > j.golsVisitante),
    empate: frac((j) => j.golsCasa === j.golsVisitante),
    vitoriaVisitante: frac((j) => j.golsCasa < j.golsVisitante),
    zeroAZero: frac((j) => j.golsCasa + j.golsVisitante === 0),
    goleadas4: frac((j) => Math.abs(j.golsCasa - j.golsVisitante) >= 4),
    seisOuMaisGols: frac((j) => j.golsCasa + j.golsVisitante >= 6),
    placares,
    artilheiro: {
      ...resumo(artilheiros),
      min: Math.min(...artilheiros),
      max: Math.max(...artilheiros),
      nomes: [...nomesFrequentes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nome, vezes]) => `${nome} (${vezes}x)`),
    },
    garcom: {
      ...resumo(temporadas.map((t) => t.garcom.assist)),
      max: Math.max(...temporadas.map((t) => t.garcom.assist)),
    },
    pontosCampeao: resumo(temporadas.map((t) => t.pontosCampeao)),
    pontosLanterna: resumo(temporadas.map((t) => t.pontosLanterna)),
    maisForte: {
      golsPorJogo: temporadas.reduce((s, t) => s + t.maisForte.golsPorJogo, 0) / temporadas.length,
      goleadasPorTemporada: temporadas.reduce((s, t) => s + t.maisForte.goleadas, 0) / temporadas.length,
      pontos: temporadas.reduce((s, t) => s + t.maisForte.pontos, 0) / temporadas.length,
    },
    detalhe: comDetalhe.length
      ? {
          amarelos: mediaDetalhe((d) => d.amarelos),
          vermelhos: mediaDetalhe((d) => d.vermelhos),
          chutes: mediaDetalhe((d) => d.chutes),
          xg: mediaDetalhe((d) => d.xg),
          lesoes: mediaDetalhe((d) => d.lesoes),
        }
      : null,
  };
}
