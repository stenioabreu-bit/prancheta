import { type PacoteDados, pacoteFicticio } from "@prancheta/data";
import { type PacoteImportado, guardarPacote, lerPacote, listarPacotes } from "./banco";

export const ID_FICTICIO = "ficticio";
export const ID_BRASILEIRAO = "teste-real";

// Pacote do Brasileirão incluído no build do projeto acadêmico.
const JSON_REAL = import.meta.glob<PacoteDados>("../../../../packages/data/packs/teste-real/pacote.json", {
  eager: true,
  import: "default",
});
const ESCUDOS_REAL = import.meta.glob<string>("../../../../packages/data/packs/teste-real/escudos/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const PACOTE_REAL = Object.values(JSON_REAL)[0] ?? null;
const URLS_REAL: Record<string, string> = Object.fromEntries(
  Object.entries(ESCUDOS_REAL).map(([caminho, url]) => [caminho.split("/").pop()!.replace(".png", ""), url]),
);
export const PACOTE_PADRAO = PACOTE_REAL ? ID_BRASILEIRAO : ID_FICTICIO;

export interface OpcaoDePacote {
  id: string;
  nome: string;
  ficticio: boolean;
  escudos: number;
}

/** Pacotes que já vêm no app e não dependem do IndexedDB. */
export const OPCOES_EMBUTIDAS: OpcaoDePacote[] = PACOTE_REAL
  ? [{ id: ID_BRASILEIRAO, nome: "Brasileirão 2026", ficticio: false, escudos: Object.keys(URLS_REAL).length }]
  : [];

export async function opcoesDePacote(): Promise<OpcaoDePacote[]> {
  const importados = await listarPacotes();
  return [
    ...OPCOES_EMBUTIDAS,
    ...importados.map((p) => ({
      id: p.pacote.id,
      nome: p.pacote.nome,
      ficticio: p.pacote.ficticio,
      escudos: Object.keys(p.escudos).length,
    })),
  ];
}

export async function carregarPacote(id: string): Promise<PacoteImportado> {
  if (id === ID_BRASILEIRAO && PACOTE_REAL) return { pacote: PACOTE_REAL, escudos: URLS_REAL };
  if (id === ID_FICTICIO) return { pacote: pacoteFicticio(), escudos: {} };
  const p = await lerPacote(id);
  if (!p) throw new Error("Pacote não encontrado neste navegador. Importe a pasta de novo.");
  return p;
}

function validar(pacote: unknown): PacoteDados {
  const p = pacote as Partial<PacoteDados>;
  if (p?.formato !== 1 || !p.id || !p.divisoes?.A || !p.divisoes.B || !p.divisoes.C || !p.divisoes.D) {
    throw new Error("Esse pacote.json não está no formato do jogo.");
  }
  return { vagasDiretasCopa: [], classicos: [], ...p } as PacoteDados;
}

/**
 * Importa uma pasta de pacote: `pacote.json` e, se houver, `escudos/<id-do-clube>.png` (ou .svg/.webp).
 * As imagens ficam só neste navegador; o jogo nunca vem com escudos oficiais.
 */
export async function importarPasta(arquivos: FileList | File[]): Promise<PacoteImportado> {
  const lista = Array.from(arquivos);
  const json = lista.find((f) => f.name === "pacote.json");
  if (!json) throw new Error("Não achei o pacote.json na pasta escolhida.");
  const pacote = validar(JSON.parse(await json.text()));
  const ids = new Set(
    Object.values(pacote.divisoes)
      .flat()
      .map((c) => c.id),
  );
  const escudos: Record<string, Blob> = {};
  for (const f of lista) {
    const caminho = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const m = caminho.match(/(?:^|\/)escudos\/([^/]+)\.(png|svg|webp|jpg)$/i);
    if (m && ids.has(m[1]!)) escudos[m[1]!] = f;
  }
  const importado = { pacote, escudos };
  await guardarPacote(importado);
  return importado;
}

/** URLs temporárias das imagens de escudo (válidas enquanto a página estiver aberta). */
export function urlsDosEscudos(escudos: Record<string, Blob | string>): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [id, b] of Object.entries(escudos))
    urls[id] = typeof b === "string" ? b : URL.createObjectURL(b);
  return urls;
}
