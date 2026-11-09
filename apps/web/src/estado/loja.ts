import { type EstadoJogo, novoJogo } from "@prancheta/engine";
import { apagarTudo, carregar, salvar } from "@prancheta/save";
import { create } from "zustand";
import { armazenamentoDoNavegador, gravarConfig, lerConfig } from "./banco";
import { carregarPacote, urlsDosEscudos } from "./pacotes";

export type Aba = "inicio" | "clube" | "elenco" | "tatica" | "tabela";

interface Loja {
  pronto: boolean;
  jogo: EstadoJogo | null;
  /** Sobe a cada alteração do jogo (o motor muda o estado no lugar). */
  versao: number;
  escudos: Record<string, string>;
  aba: Aba;
  emPartida: boolean;
  /** Menu inicial, criação de carreira ou o jogo. */
  tela: "menu" | "novo" | "jogo";
  irParaTela(tela: "menu" | "novo" | "jogo"): void;
  aviso: string | null;
  iniciar(): Promise<void>;
  comecar(o: { pacoteId: string; tecnico: string; clubeId: string }): Promise<void>;
  /** Única porta de alteração do jogo: roda `f`, redesenha e agenda o save. */
  mexer<T>(f: (jogo: EstadoJogo) => T): T;
  irPara(aba: Aba): void;
  avisar(texto: string): void;
  setEmPartida(sim: boolean): void;
  abandonar(): Promise<void>;
}

const armazenamento = armazenamentoDoNavegador();
let saveAgendado: ReturnType<typeof setTimeout> | null = null;

function agendarSave(jogo: EstadoJogo) {
  if (saveAgendado) clearTimeout(saveAgendado);
  saveAgendado = setTimeout(() => {
    saveAgendado = null;
    void salvar(armazenamento, jogo);
  }, 400);
}

async function escudosDoPacote(id: string | undefined): Promise<Record<string, string>> {
  if (!id) return {};
  try {
    return urlsDosEscudos((await carregarPacote(id)).escudos);
  } catch {
    return {};
  }
}

let avisoAgendado: ReturnType<typeof setTimeout> | null = null;

export const useLoja = create<Loja>((set, get) => ({
  pronto: false,
  jogo: null,
  versao: 0,
  escudos: {},
  aba: "inicio",
  emPartida: false,
  tela: "menu",
  irParaTela(tela) {
    set({ tela });
  },
  aviso: null,

  async iniciar() {
    const jogo = await carregar(armazenamento);
    const escudos = jogo ? await escudosDoPacote(await lerConfig("pacoteDoJogo")) : {};
    set(jogo ? { jogo, escudos, pronto: true } : { pronto: true });
  },

  async comecar({ pacoteId, tecnico, clubeId }) {
    const { pacote, escudos } = await carregarPacote(pacoteId);
    const semente = crypto.getRandomValues(new Uint32Array(1))[0]!;
    const jogo = novoJogo({
      semente,
      temporada: pacote.temporada,
      divisoes: pacote.divisoes,
      vagasDiretasCopa: pacote.vagasDiretasCopa,
      classicos: pacote.classicos,
      ...(pacote.formatos ? { formatos: pacote.formatos } : {}),
      ...(pacote.semCopa ? { semCopa: true } : {}),
      ...(pacote.estaduais ? { estaduais: pacote.estaduais } : {}),
      ...(pacote.clubesExtras ? { clubesExtras: pacote.clubesExtras } : {}),
      tecnico,
      clubeId,
    });
    await gravarConfig("pacoteDoJogo", pacoteId);
    set({ jogo, escudos: urlsDosEscudos(escudos), aba: "inicio", tela: "jogo", versao: get().versao + 1 });
    await salvar(armazenamento, jogo);
  },

  mexer(f) {
    const jogo = get().jogo;
    if (!jogo) throw new Error("Sem jogo em andamento");
    const r = f(jogo);
    set({ versao: get().versao + 1 });
    agendarSave(jogo);
    return r;
  },

  irPara(aba) {
    set({ aba });
    window.scrollTo({ top: 0 });
  },

  avisar(texto) {
    if (avisoAgendado) clearTimeout(avisoAgendado);
    set({ aviso: texto });
    avisoAgendado = setTimeout(() => set({ aviso: null }), 3500);
  },

  setEmPartida(sim) {
    set({ emPartida: sim });
  },

  async abandonar() {
    await apagarTudo(armazenamento);
    set({ jogo: null, tela: "menu", aba: "inicio", emPartida: false, versao: get().versao + 1 });
  },
}));

/** Lê o jogo (re-renderiza a cada `mexer`). Use só dentro de telas com jogo carregado. */
export function useJogo(): EstadoJogo {
  useLoja((s) => s.versao);
  const jogo = useLoja((s) => s.jogo);
  if (!jogo) throw new Error("Tela de jogo sem jogo carregado");
  return jogo;
}
