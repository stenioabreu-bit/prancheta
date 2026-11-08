import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PacoteDados } from "./pacote";

export const PASTA_PACOTES = join(dirname(fileURLToPath(import.meta.url)), "..", "packs");
export const PASTA_TESTE_REAL = join(PASTA_PACOTES, "teste-real");

/** Lê `pacote.json` de uma pasta; devolve null se a pasta não tiver pacote. */
export function lerPacote(pasta: string): PacoteDados | null {
  const arquivo = join(pasta, "pacote.json");
  if (!existsSync(arquivo)) return null;
  return JSON.parse(readFileSync(arquivo, "utf8")) as PacoteDados;
}
