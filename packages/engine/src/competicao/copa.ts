/**
 * Copa do Brasil, conforme o REC da CBF de 2026: 126 clubes, 9 fases.
 * 1ª, 3ª e 4ª fase e final em jogo único (empate: pênaltis); 2ª fase e 5ª fase à semifinal em
 * ida e volta (saldo, depois pênaltis). A Série A entra na 5ª fase; 4 vagas
 * diretas (campeões de outras competições) entram na 3ª.
 *
 * Simplificações: o Ranking Nacional de Clubes vira "divisão e depois força";
 * os 102 clubes que no real vêm dos estaduais saem das Séries B, C e D; o mando
 * dos jogos únicos e da volta é sorteado (no real vem do Anexo B e de sorteio).
 */
import type { Rng } from "../rng";
import { sortear } from "../rng";
import { dataDoHorario, horarioDaData } from "./calendario";
import { type Agenda, decidirConfronto, montarFaseMataMata, parear } from "./fases";
import type { Chaveamento, EstadoFaseMataMata, JogoAgendado } from "./tipos";

interface FaseDaCopa {
  nome: string;
  /** Datas oficiais (CBF, calendário 2026): jogo único ou ida e volta. */
  datas: readonly string[];
  chaveamento: Chaveamento | "blocos";
  neutro?: boolean;
}

/** Datas do calendário oficial da CBF de 2026 (datas 01 a 14 da Copa do Brasil). */
export const FASES_DA_COPA_2026: readonly FaseDaCopa[] = [
  { nome: "1ª fase", datas: ["2026-02-18"], chaveamento: "melhorContraPior" },
  { nome: "2ª fase", datas: ["2026-02-25", "2026-03-04"], chaveamento: "sorteio" },
  { nome: "3ª fase", datas: ["2026-03-11"], chaveamento: "sorteio" },
  { nome: "4ª fase", datas: ["2026-03-18"], chaveamento: "sorteio" },
  { nome: "5ª fase", datas: ["2026-04-22", "2026-05-13"], chaveamento: "blocos" },
  { nome: "Oitavas de final", datas: ["2026-08-02", "2026-08-05"], chaveamento: "sorteio" },
  { nome: "Quartas de final", datas: ["2026-08-26", "2026-09-02"], chaveamento: "sorteio" },
  { nome: "Semifinal", datas: ["2026-11-01", "2026-11-08"], chaveamento: "chave" },
  { nome: "Final", datas: ["2026-12-06"], chaveamento: "chave", neutro: true },
];

export interface EstadoCopa {
  /** Quem entra em cada fase (índice da fase), já ordenado pelo ranking. */
  entram: Record<number, string[]>;
  fases: EstadoFaseMataMata[];
  campeao: string | null;
  vice: string | null;
}

export interface ParticipantesDaCopa {
  serieA: string[];
  vagasDiretas: string[];
  /** Os demais, do mais bem ranqueado ao pior (B, C, depois D por força). */
  demais: string[];
  /** O clube do usuário entra garantido ("colherzinha de chá" do protótipo). */
  usuarioId?: string | null;
}

export function montarCopa(p: ParticipantesDaCopa): EstadoCopa {
  const diretas = p.vagasDiretas.filter((id) => !p.serieA.includes(id)).slice(0, 4);
  const resto = p.demais.filter((id) => !diretas.includes(id) && !p.serieA.includes(id));
  const segunda = resto.slice(0, 74);
  const primeira = resto.slice(74, 74 + 28);
  if (primeira.length < 28) throw new Error("Clubes insuficientes para a 1ª fase da Copa do Brasil");
  const todos = [...p.serieA, ...diretas, ...segunda, ...primeira];
  if (p.usuarioId && !todos.includes(p.usuarioId)) primeira[primeira.length - 1] = p.usuarioId;
  return {
    entram: { 0: primeira, 1: segunda, 2: diretas, 4: p.serieA },
    fases: [],
    campeao: null,
    vice: null,
  };
}

function pares(fase: FaseDaCopa, ordenados: string[], rng: Rng): [string, string][] {
  if (fase.chaveamento !== "blocos") return parear(ordenados, fase.chaveamento, rng);
  // REC Art. 17: Bloco I (16 mais bem ranqueados) contra Bloco II, por sorteio.
  const metade = ordenados.length / 2;
  const blocoII = parear(ordenados.slice(metade), "sorteio", rng).flat();
  return ordenados.slice(0, metade).map((id, i) => [id, blocoII[i]!] as [string, string]);
}

/** Sorteia e agenda a fase `indice`, com quem sobrou da anterior mais quem entra agora. */
export function abrirFaseDaCopa(
  copa: EstadoCopa,
  indice: number,
  jogos: Record<string, JogoAgendado>,
  rng: Rng,
  ranking: (ids: string[]) => string[],
  semanaMin = 0,
): void {
  const fase = FASES_DA_COPA_2026[indice]!;
  const anterior = copa.fases[indice - 1];
  const vivos = anterior ? anterior.confrontos.map((c) => c.vencedor!) : [];
  const entram = copa.entram[indice] ?? [];
  const ordenados = fase.chaveamento === "chave" ? vivos.concat(entram) : ranking(vivos.concat(entram));
  const agenda: Agenda = { competicao: "copa", jogos, meioDeSemana: true };
  const sorteioDeMando = (a: string, b: string) => sortear(rng, [a, b]);
  copa.fases.push(
    montarFaseMataMata(
      { nome: fase.nome, idaEVolta: fase.datas.length === 2 },
      pares(fase, ordenados, rng),
      fase.datas.map((d, k) => {
        // Fase atrasada (adiamentos na anterior): a data que já passou vai para a primeira semana possível.
        const h = horarioDaData(d);
        const min = semanaMin + k;
        return h.semana >= min ? h : { semana: min, meio: h.meio, data: dataDoHorario(min, h.meio) };
      }),
      agenda,
      sorteioDeMando,
      fase.neutro,
    ),
  );
}

/** Fecha a fase que terminou nesta rodada e sorteia a próxima. */
export function fecharRodadaDaCopa(
  copa: EstadoCopa,
  rodada: number,
  jogos: Record<string, JogoAgendado>,
  rng: Rng,
  forca: (id: string) => number,
  ranking: (ids: string[]) => string[],
): void {
  const atual = copa.fases[copa.fases.length - 1];
  if (!atual || atual.encerrada || atual.rodadaFinal !== rodada) return;
  for (const c of atual.confrontos) decidirConfronto(c, jogos, rng, forca);
  atual.encerrada = true;
  if (copa.fases.length === FASES_DA_COPA_2026.length) {
    const final = atual.confrontos[0]!;
    copa.campeao = final.vencedor;
    copa.vice = final.vencedor === final.a ? final.b : final.a;
    return;
  }
  abrirFaseDaCopa(copa, copa.fases.length, jogos, rng, ranking, rodada + 1);
}
