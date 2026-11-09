import type { Rng } from "../rng";
import { horarioDaData } from "./calendario";
import {
  type Agenda,
  campanha,
  classificacaoDoGrupo,
  cruzarGrupos,
  decidirConfronto,
  montarFaseLiga,
  montarFaseMataMata,
  ordenarPorCampanha,
  parear,
} from "./fases";
import type {
  EstadoDivisao,
  EstadoFase,
  EstadoFaseLiga,
  EstadoFaseMataMata,
  Fase,
  FormatoDivisao,
  JogoAgendado,
  RegraDeMovimento,
} from "./tipos";

export interface ContextoCompeticao {
  jogos: Record<string, JogoAgendado>;
  rng: Rng;
  forca: (clubeId: string) => number;
}

function agendaDa(divisao: EstadoDivisao, ctx: ContextoCompeticao): Agenda {
  return { competicao: divisao.divisao, jogos: ctx.jogos, meioDeSemana: false };
}

function jogosDaDivisao(divisao: EstadoDivisao, ctx: ContextoCompeticao): JogoAgendado[] {
  return Object.values(ctx.jogos).filter((j) => j.competicao === divisao.divisao);
}

function campanhaDaDivisao(divisao: EstadoDivisao, ctx: ContextoCompeticao) {
  return campanha(jogosDaDivisao(divisao, ctx), divisao.clubes);
}

export function faseDoEstado(divisao: EstadoDivisao, nome: string): EstadoFase | undefined {
  return divisao.fases.find((f) => f.nome === nome);
}

/** `ids` ordenados pela classificação de entrada (para a 1ª fase, a ordem do pacote). */
export function iniciarDivisao(
  formato: FormatoDivisao,
  ids: readonly string[],
  ctx: ContextoCompeticao,
): EstadoDivisao {
  const divisao: EstadoDivisao = {
    divisao: formato.divisao,
    clubes: ids.slice(),
    fases: [],
    campeao: null,
    acesso: [],
    rebaixados: [],
    encerrada: false,
  };
  const primeira = formato.fases[0];
  if (primeira?.tipo !== "liga") throw new Error(`${formato.nome}: a primeira fase precisa ser de liga`);
  divisao.fases.push(montarFaseLiga(primeira, ids, formato.inicio ?? 0, agendaDa(divisao, ctx), ctx.rng));
  return divisao;
}

/** Fase do formato que alimenta `fase` (a anterior não terminal, ou a indicada em `origem`). */
function origemDa(formato: FormatoDivisao, indice: number): { nome: string; perdedores: boolean } | null {
  const fase = formato.fases[indice]!;
  if (fase.tipo === "mataMata" && fase.origem) return { nome: fase.origem.perdedoresDe, perdedores: true };
  for (let i = indice - 1; i >= 0; i--) {
    const anterior = formato.fases[i]!;
    if (!(anterior.tipo === "mataMata" && anterior.terminal))
      return { nome: anterior.nome, perdedores: false };
  }
  return null;
}

function encerrarFase(fase: EstadoFase, ctx: ContextoCompeticao) {
  if (fase.tipo === "mataMata") {
    for (const c of fase.confrontos) decidirConfronto(c, ctx.jogos, ctx.rng, ctx.forca);
  }
  fase.encerrada = true;
}

function vencedores(fase: EstadoFaseMataMata): string[] {
  return fase.confrontos.map((c) => c.vencedor!);
}

function perdedores(fase: EstadoFaseMataMata): string[] {
  return fase.confrontos.map((c) => (c.vencedor === c.a ? c.b : c.a));
}

function abrirFase(
  formato: FormatoDivisao,
  indice: number,
  divisao: EstadoDivisao,
  ctx: ContextoCompeticao,
  rodadaInicial: number,
) {
  const fase: Fase = formato.fases[indice]!;
  const origem = origemDa(formato, indice)!;
  const anterior = faseDoEstado(divisao, origem.nome)!;
  const tabelaCampanha = campanhaDaDivisao(divisao, ctx);
  const melhorCampanha = (a: string, b: string) => ordenarPorCampanha([a, b], tabelaCampanha)[0]!;
  const agenda = agendaDa(divisao, ctx);

  if (fase.tipo === "liga") {
    if (anterior.tipo !== "liga") throw new Error(`${fase.nome}: liga depois de mata-mata não é suportada`);
    const entram = anterior.grupos.flatMap((_, g) =>
      classificacaoDoGrupo(anterior, g).slice(0, avancamDe(formato, anterior.nome)),
    );
    const ordenados = anterior.grupos.length === 1 ? entram : ordenarPorCampanha(entram, tabelaCampanha);
    divisao.fases.push(montarFaseLiga(fase, ordenados, rodadaInicial, agenda, ctx.rng));
    return;
  }

  let pares: [string, string][];
  let mando = melhorCampanha;
  if (anterior.tipo === "liga") {
    const porGrupo = anterior.grupos.map((_, g) =>
      classificacaoDoGrupo(anterior, g).slice(0, avancamDe(formato, anterior.nome)),
    );
    if (fase.chaveamento === "cruzamentoDeGrupos") {
      pares = cruzarGrupos(porGrupo);
      mando = (a) => a; // REC Série D, Art. 19: 1º e 2º colocados decidem em casa
    } else {
      pares = parear(ordenarPorCampanha(porGrupo.flat(), tabelaCampanha), fase.chaveamento, ctx.rng);
    }
  } else {
    const entram = origem.perdedores ? perdedores(anterior) : vencedores(anterior);
    const ordenados = fase.chaveamento === "chave" ? entram : ordenarPorCampanha(entram, tabelaCampanha);
    pares = parear(ordenados, fase.chaveamento, ctx.rng);
  }
  const rodadas = fase.datas?.length
    ? fase.datas.map(horarioDaData)
    : fase.idaEVolta
      ? [rodadaInicial, rodadaInicial + 1]
      : [rodadaInicial];
  divisao.fases.push(montarFaseMataMata(fase, pares, rodadas, agenda, mando));
}

function avancamDe(formato: FormatoDivisao, nomeFase: string): number {
  const f = formato.fases.find((x) => x.nome === nomeFase);
  return f?.tipo === "liga" ? f.avancamPorGrupo : 0;
}

function aplicarRegra(regra: RegraDeMovimento, divisao: EstadoDivisao): string[] {
  const fase = faseDoEstado(divisao, regra.fase);
  if (!fase) throw new Error(`Fase ${regra.fase} não foi disputada`);
  if (regra.posicao === "participantes" || regra.posicao === "vencedores") {
    if (fase.tipo !== "mataMata") throw new Error(`${regra.fase} não é mata-mata`);
    return regra.posicao === "vencedores" ? vencedores(fase) : fase.confrontos.flatMap((c) => [c.a, c.b]);
  }
  if (fase.tipo !== "liga") throw new Error(`${regra.fase} não é fase de liga`);
  if (regra.posicao === "primeirosDeCadaGrupo") {
    return fase.grupos.flatMap((_, g) => classificacaoDoGrupo(fase, g).slice(0, regra.quantidade));
  }
  const ordem = classificacaoDoGrupo(fase, 0);
  return regra.posicao === "primeiros" ? ordem.slice(0, regra.quantidade) : ordem.slice(-regra.quantidade);
}

function finalizar(formato: FormatoDivisao, divisao: EstadoDivisao) {
  const ultima = [...divisao.fases].reverse().find((f) => {
    const config = formato.fases.find((x) => x.nome === f.nome);
    return !(config?.tipo === "mataMata" && config.terminal);
  })!;
  divisao.campeao =
    ultima.tipo === "mataMata"
      ? ultima.confrontos[0]!.vencedor
      : classificacaoDoGrupo(ultima as EstadoFaseLiga, 0)[0]!;
  divisao.acesso = formato.acesso.flatMap((r) => aplicarRegra(r, divisao));
  divisao.rebaixados = formato.rebaixamento.flatMap((r) => aplicarRegra(r, divisao));
  divisao.encerrada = true;
}

/** Fecha as fases que terminaram nesta rodada e abre as seguintes. */
export function fecharRodadaDaDivisao(
  formato: FormatoDivisao,
  divisao: EstadoDivisao,
  rodada: number,
  ctx: ContextoCompeticao,
): void {
  if (divisao.encerrada) return;
  const terminaram = divisao.fases.filter((f) => !f.encerrada && f.rodadaFinal === rodada);
  if (!terminaram.length) return;
  for (const f of terminaram) encerrarFase(f, ctx);
  for (let i = 0; i < formato.fases.length; i++) {
    const nome = formato.fases[i]!.nome;
    if (faseDoEstado(divisao, nome)) continue;
    const origem = origemDa(formato, i);
    const fonte = origem && faseDoEstado(divisao, origem.nome);
    if (!fonte?.encerrada) continue;
    abrirFase(formato, i, divisao, ctx, rodada + 1);
  }
  if (divisao.fases.length === formato.fases.length && divisao.fases.every((f) => f.encerrada)) {
    finalizar(formato, divisao);
  }
}
