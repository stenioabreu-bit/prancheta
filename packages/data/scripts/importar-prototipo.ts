/**
 * Converte os dados do protótipo (prancheta-do-timao.html) no pacote de teste
 * com nomes reais, gravado em packs/teste-real/ (fora do git).
 *
 * Uso: npm run importar-prototipo -- <caminho do .html>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import {
  type ClubeDados,
  type Esquema,
  type Estilo,
  type ExtrasJogador,
  type JogadorDados,
  criarJogador,
  hashTexto,
} from "@prancheta/engine";
import { PASTA_TESTE_REAL } from "../src/node";
import { type PacoteDados, idDoClube } from "../src/pacote";

interface TimePrototipo {
  id: string;
  nome: string;
  curto: string;
  cor: string;
  cor2: string;
  form: Esquema;
  estilo: Estilo;
  estadio?: string;
  elenco?: JogadorDados[];
  xi: (string | JogadorDados)[];
  banco?: JogadorDados[];
}

interface DadosPrototipo {
  DB: { teams: TimePrototipo[] };
  SERIE_B: [string, string, string | null, string | null][];
  SERIE_C: string[];
  SERIE_D: string[];
  CORES_C: Record<string, [string, string]>;
  CORES_D: Record<string, [string, string]>;
}

function trecho(codigo: string, inicio: string, fim: string): string {
  const i = codigo.indexOf(inicio);
  const f = codigo.indexOf(fim, i);
  if (i < 0 || f < 0) throw new Error(`Trecho "${inicio}" não encontrado no protótipo`);
  return codigo.slice(i, f);
}

/** Sigla do protótipo: iniciais das palavras, ou 3 letras se o nome for uma palavra só. */
function siglaDe(nome: string): string {
  const palavras = nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z ]/g, " ")
    .split(" ")
    .filter(Boolean);
  return palavras
    .map((p) => (palavras.length > 1 ? p[0] : p.slice(0, 3)))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function corCompleta(c: string): string {
  return c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
}

function cores(par: [string | null, string | null] | undefined) {
  if (!par?.[0] || !par[1]) return null;
  return { principal: corCompleta(par[0]), secundaria: corCompleta(par[1]) };
}

/** Nível fixo por clube dentro da faixa da divisão (o protótipo sorteava a cada jogo novo). */
function nivel(nome: string, min: number, max: number): number {
  return min + (hashTexto(nome) % (max - min + 1));
}

const caminho = process.argv[2];
if (!caminho) throw new Error("Informe o caminho do HTML do protótipo");
const html = readFileSync(caminho, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
const codigo = `${trecho(script, "const DB = {", "/* ================= MOTOR")}
${trecho(script, "const SERIE_B", "const PALETA")}
({ DB, SERIE_B, SERIE_C, SERIE_D, CORES_C, CORES_D });`;
const dados = runInNewContext(codigo, {}) as DadosPrototipo;

/**
 * Grava atributos e personalidade explícitos. No protótipo, os não informados
 * vinham de um hash de nome + sigla antiga (COR, PAL...); com os ids novos o
 * hash mudaria e os jogadores também.
 */
function comAtributosDoPrototipo(elenco: JogadorDados[], idAntigo: string): JogadorDados[] {
  return elenco.map((dadosJogador, i) => {
    const j = criarJogador(dadosJogador, idAntigo, i);
    const extras: ExtrasJogador = { ...j.at, perso: j.perso };
    if (j.alt.length) extras.alt = j.alt;
    return [j.nome, j.pos, j.ovr, extras] as const;
  });
}

const serieA: ClubeDados[] = dados.DB.teams.map((t) => {
  const elenco = t.elenco ?? (t.xi as JogadorDados[]).concat(t.banco ?? []);
  const clube: ClubeDados = {
    id: idDoClube(t.nome),
    nome: t.nome,
    sigla: t.curto,
    cores: cores([t.cor, t.cor2]),
    esquema: t.form,
    estilo: t.estilo,
    elenco: comAtributosDoPrototipo(elenco, t.id),
  };
  if (t.estadio) clube.estadio = t.estadio;
  if (t.elenco) clube.titulares = t.xi as string[];
  return clube;
});
const serieB: ClubeDados[] = dados.SERIE_B.map(([nome, sigla, c1, c2]) => ({
  id: idDoClube(nome),
  nome,
  sigla,
  cores: cores([c1, c2]),
  nivel: nivel(nome, 65, 70),
}));
const serieC: ClubeDados[] = dados.SERIE_C.map((nome) => ({
  id: idDoClube(nome),
  nome,
  sigla: siglaDe(nome),
  cores: cores(dados.CORES_C[nome]),
  nivel: nivel(nome, 59, 64),
}));
const serieD: ClubeDados[] = dados.SERIE_D.map((nome) => ({
  id: idDoClube(nome),
  nome,
  sigla: siglaDe(nome),
  cores: cores(dados.CORES_D[nome]),
  nivel: nivel(nome, 51, 58),
}));

const ids = [serieA, serieB, serieC, serieD].flat().map((c) => c.id);
const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
if (repetidos.length) throw new Error(`Ids de clube repetidos: ${repetidos.join(", ")}`);

const pacote: PacoteDados = {
  formato: 1,
  id: "teste-real",
  nome: "Brasileirão 2026 (teste pessoal, nomes reais)",
  ficticio: false,
  temporada: 2027,
  divisoes: { A: serieA, B: serieB, C: serieC, D: serieD },
};
mkdirSync(PASTA_TESTE_REAL, { recursive: true });
writeFileSync(join(PASTA_TESTE_REAL, "pacote.json"), `${JSON.stringify(pacote, null, 1)}\n`);
process.stdout.write(
  `Pacote gravado em ${PASTA_TESTE_REAL}: A ${serieA.length}, B ${serieB.length}, C ${serieC.length}, D ${serieD.length} clubes.\n`,
);
