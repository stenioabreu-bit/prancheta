/**
 * Calibração: simula N temporadas da Série A (todos os jogos pelo motor
 * minuto a minuto e, separado, todos pela simulação rápida) e compara com
 * o protótipo original e com a referência do Brasileirão.
 *
 * Uso: npm run calibrar -- [--temporadas 100] [--semente 1] [--pacote ficticio|teste-real] [--prototipo <html>]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pacoteFicticio } from "@prancheta/data";
import { PASTA_TESTE_REAL, lerPacote } from "@prancheta/data/node";
import { type Relatorio, type TemporadaMedida, resumir } from "./metricas";
import { type Modo, temporadaPort } from "./temporadaPort";
import { carregarPrototipo } from "./temporadaPrototipo";

function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const qtdTemporadas = Number(argumento("temporadas") ?? 100);
const semente = Number(argumento("semente") ?? 1);
const caminhoPrototipo = argumento("prototipo");
const pacote =
  argumento("pacote") === "ficticio" ? pacoteFicticio() : (lerPacote(PASTA_TESTE_REAL) ?? pacoteFicticio());
const serieA = pacote.divisoes.A ?? [];

function rodar(
  fonte: string,
  modo: Modo,
  temporada: (i: number) => TemporadaMedida,
): Relatorio & { fonte: string; segundos: number } {
  const inicio = performance.now();
  const temporadas = Array.from({ length: qtdTemporadas }, (_, i) => temporada(i));
  return { ...resumir(temporadas), fonte, segundos: (performance.now() - inicio) / 1000 };
}

const colunas: (Relatorio & { fonte: string; segundos: number })[] = [];
const prototipo = caminhoPrototipo ? carregarPrototipo(caminhoPrototipo) : null;
for (const modo of ["motor", "rapido"] as const) {
  colunas.push(rodar(`Port · ${modo}`, modo, (i) => temporadaPort(serieA, semente * 100_003 + i, modo)));
  if (prototipo && !pacote.ficticio) colunas.push(rodar(`Protótipo · ${modo}`, modo, () => prototipo(modo)));
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const n2 = (v: number) => v.toFixed(2);
const ic = (r: { media: number; margem: number }, casas = 2) =>
  `${r.media.toFixed(casas)} ± ${r.margem.toFixed(casas)}`;

type Linha = [string, string, (r: Relatorio) => string];
const linhas: Linha[] = [
  ["Gols por jogo", "2,3–2,6", (r) => ic(r.golsPorJogo)],
  ["Gols do mandante", "~1,4", (r) => ic(r.golsCasa)],
  ["Gols do visitante", "~1,0", (r) => ic(r.golsVisitante)],
  ["Vitória do mandante", "~48%", (r) => pct(r.vitoriaCasa)],
  ["Empate", "~27%", (r) => pct(r.empate)],
  ["Vitória do visitante", "~25%", (r) => pct(r.vitoriaVisitante)],
  ["0 x 0", "~7–9%", (r) => pct(r.zeroAZero)],
  ["Diferença de 4+ gols", "~2%", (r) => pct(r.goleadas4)],
  ["6+ gols no jogo", "~2%", (r) => pct(r.seisOuMaisGols)],
  [
    "Artilheiro (gols)",
    "15–25",
    (r) => `${ic(r.artilheiro, 1)} (mín ${r.artilheiro.min}, máx ${r.artilheiro.max})`,
  ],
  ["Garçom (assistências)", "~10–14", (r) => `${ic(r.garcom, 1)} (máx ${r.garcom.max})`],
  ["Pontos do campeão", "~75–85", (r) => ic(r.pontosCampeao, 1)],
  ["Pontos do lanterna", "~20–30", (r) => ic(r.pontosLanterna, 1)],
  ["Mais forte: gols/jogo", "—", (r) => n2(r.maisForte.golsPorJogo)],
  ["Mais forte: goleadas 4+/temporada", "—", (r) => r.maisForte.goleadasPorTemporada.toFixed(1)],
  ["Mais forte: pontos", "—", (r) => r.maisForte.pontos.toFixed(1)],
  ["Amarelos por jogo", "~4,5", (r) => (r.detalhe ? n2(r.detalhe.amarelos) : "—")],
  ["Vermelhos por jogo", "~0,2", (r) => (r.detalhe ? n2(r.detalhe.vermelhos) : "—")],
  ["Finalizações por jogo", "~24", (r) => (r.detalhe ? n2(r.detalhe.chutes) : "—")],
  ["xG por jogo", "—", (r) => (r.detalhe ? n2(r.detalhe.xg) : "—")],
  ["Lesões por jogo", "—", (r) => (r.detalhe ? n2(r.detalhe.lesoes) : "—")],
];

const cabecalho = ["Métrica", "Referência real", ...colunas.map((c) => c.fonte)];
const tabela = [
  `| ${cabecalho.join(" | ")} |`,
  `|${cabecalho.map(() => "---").join("|")}|`,
  ...linhas.map(([nome, ref, f]) => `| ${nome} | ${ref} | ${colunas.map(f).join(" | ")} |`),
];
const placares = colunas.map(
  (c) => `- **${c.fonte}:** ${c.placares.map(([p, f]) => `${p} ${pct(f)}`).join(", ")}`,
);
const artilheiros = colunas.map((c) => `- **${c.fonte}:** ${c.artilheiro.nomes.join(", ")}`);

const relatorio = [
  `# Calibração — ${new Date().toISOString().slice(0, 10)}`,
  "",
  `Pacote: **${pacote.nome}** · Série A com ${serieA.length} clubes · ${qtdTemporadas} temporadas (${colunas[0]!.jogos} jogos por coluna) · semente ${semente}.`,
  "",
  "- **motor**: todos os jogos pelo motor minuto a minuto (IA x IA).",
  "- **rapido**: todos os jogos pela simulação rápida (Poisson + estatísticas rápidas), como os jogos que o usuário não assiste.",
  "- Intervalos são de 95%. A coluna de referência real é uma ordem de grandeza aproximada do Brasileirão Série A recente, ainda não conferida em fonte oficial.",
  "",
  ...tabela,
  "",
  "## Placares mais comuns (mandante x visitante)",
  "",
  ...placares,
  "",
  "## Artilheiros que mais se repetiram",
  "",
  ...artilheiros,
  "",
  `Tempo: ${colunas.map((c) => `${c.fonte} ${c.segundos.toFixed(1)} s`).join(" · ")}`,
  "",
].join("\n");

const pasta = join(dirname(fileURLToPath(import.meta.url)), "..", "relatorios");
mkdirSync(pasta, { recursive: true });
const arquivo = join(pasta, `calibracao-${pacote.id}-${qtdTemporadas}t.md`);
writeFileSync(arquivo, relatorio);
process.stdout.write(`${relatorio}\nRelatório salvo em ${arquivo}\n`);
