import type { PacoteDados } from "@prancheta/data";
import { type Armazenamento, type Save, type Slot, armazenamentoEmMemoria } from "@prancheta/save";
import { type IDBPDatabase, openDB } from "idb";

/** Pacote importado pelo jogador: o JSON e as imagens de escudo (por id de clube). */
export interface PacoteImportado {
  pacote: PacoteDados;
  escudos: Record<string, Blob | string>;
}

interface Esquema {
  saves: Save;
  pacotes: PacoteImportado;
  config: string;
}

let banco: Promise<IDBPDatabase<Esquema>> | null = null;

function abrir(): Promise<IDBPDatabase<Esquema>> {
  banco ??= openDB<Esquema>("prancheta", 1, {
    upgrade(db) {
      db.createObjectStore("saves");
      db.createObjectStore("pacotes");
      db.createObjectStore("config");
    },
  });
  return banco;
}

/** IndexedDB; cai para memória se o navegador bloquear (aba anônima, por exemplo). */
export function armazenamentoDoNavegador(): Armazenamento {
  const memoria = armazenamentoEmMemoria();
  const tentar = async <T>(f: (db: IDBPDatabase<Esquema>) => Promise<T>, reserva: () => Promise<T>) => {
    try {
      return await f(await abrir());
    } catch {
      return reserva();
    }
  };
  return {
    ler: (slot: Slot) =>
      tentar(
        (db) => db.get("saves", slot),
        () => memoria.ler(slot),
      ),
    gravar: (slot: Slot, save: Save) =>
      tentar(
        async (db) => void (await db.put("saves", save, slot)),
        () => memoria.gravar(slot, save),
      ),
    apagar: (slot: Slot) =>
      tentar(
        (db) => db.delete("saves", slot),
        () => memoria.apagar(slot),
      ),
  };
}

export async function guardarPacote(p: PacoteImportado): Promise<void> {
  const db = await abrir();
  await db.put("pacotes", p, p.pacote.id);
}

export async function lerPacote(id: string): Promise<PacoteImportado | undefined> {
  try {
    return await (await abrir()).get("pacotes", id);
  } catch {
    return undefined;
  }
}

export async function listarPacotes(): Promise<PacoteImportado[]> {
  try {
    return await (await abrir()).getAll("pacotes");
  } catch {
    return [];
  }
}

export async function lerConfig(chave: string): Promise<string | undefined> {
  try {
    return await (await abrir()).get("config", chave);
  } catch {
    return undefined;
  }
}

export async function gravarConfig(chave: string, valor: string): Promise<void> {
  try {
    await (await abrir()).put("config", valor, chave);
  } catch {
    // sem IndexedDB, a preferência vale só nesta sessão
  }
}
