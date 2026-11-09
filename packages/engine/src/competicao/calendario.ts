/**
 * Calendário em semanas com dois horários (fim de semana e meio de semana). Cada competição agenda
 * seus jogos em (semana, meioDeSemana); um clube não pode ter dois jogos no mesmo horário.
 * A temporada termina quando não sobra jogo e as competições fecharam, sem número fixo de rodadas.
 */
import type { JogoAgendado } from "./tipos";

/** Horário de um jogo: semana da temporada (passo da simulação), meio de semana e a data (AAAA-MM-DD). */
export interface Horario {
  semana: number;
  meio: boolean;
  data?: string;
}

/** Segunda-feira da semana 0. Datas de outros anos usam o mesmo mês/dia (o calendário se repete). */
const INICIO = Date.UTC(2026, 0, 5);
const DIA = 86_400_000;

function diasDesdeInicio(data: string): number {
  const [, m, d] = data.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(2026, m - 1, d) - INICIO) / DIA);
}

/** Converte a data real no horário do jogo (seg–qui = meio de semana; sex–dom = fim de semana). */
export function horarioDaData(data: string): Horario {
  const dias = Math.max(0, diasDesdeInicio(data));
  return { semana: Math.floor(dias / 7), meio: dias % 7 <= 3, data };
}

/** Data padrão do horário: quarta no meio de semana, domingo no fim de semana. */
export function dataDoHorario(semana: number, meio: boolean): string {
  return new Date(INICIO + (semana * 7 + (meio ? 2 : 6)) * DIA).toISOString().slice(0, 10);
}

/** Data efetiva de um jogo (a registrada ou a padrão do horário). */
export function dataDoJogo(j: Pick<JogoAgendado, "rodada" | "meioDeSemana" | "data">): string {
  return j.data ?? dataDoHorario(j.rodada, j.meioDeSemana);
}

/** Dias entre duas datas AAAA-MM-DD. */
export function diasEntre(a: string, b: string): number {
  return Math.abs(diasDesdeInicio(a) - diasDesdeInicio(b));
}

/** Descanso mínimo entre dois jogos do mesmo clube (dias). */
export const DESCANSO_MINIMO = 2;

export interface ConflitoDeCalendario {
  clube: string;
  semana: number;
  meioDeSemana: boolean;
  jogos: string[];
}

/**
 * Clubes com dois jogos no mesmo dia ou com menos de DESCANSO_MINIMO dias entre um jogo e o seguinte.
 * Lista vazia = calendário válido.
 */
export function conflitosDeCalendario(jogos: Record<string, JogoAgendado>): ConflitoDeCalendario[] {
  const porClube = new Map<string, JogoAgendado[]>();
  for (const j of Object.values(jogos)) {
    for (const clube of [j.casa, j.visitante]) porClube.set(clube, [...(porClube.get(clube) ?? []), j]);
  }
  const conflitos: ConflitoDeCalendario[] = [];
  for (const [clube, lista] of porClube) {
    lista.sort((a, b) => dataDoJogo(a).localeCompare(dataDoJogo(b)));
    for (let i = 1; i < lista.length; i++) {
      const a = lista[i - 1]!;
      const b = lista[i]!;
      if (diasEntre(dataDoJogo(a), dataDoJogo(b)) < DESCANSO_MINIMO) {
        conflitos.push({ clube, semana: b.rodada, meioDeSemana: b.meioDeSemana, jogos: [a.id, b.id] });
      }
    }
  }
  return conflitos;
}

/** Horário livre para um clube a partir de uma semana (para encaixar jogos de outra competição). */
export function horarioLivre(
  jogos: Record<string, JogoAgendado>,
  clubes: readonly string[],
  aPartirDe: number,
  meioDeSemana: boolean,
): number {
  const ocupado = new Set(
    Object.values(jogos)
      .filter((j) => j.meioDeSemana === meioDeSemana)
      .flatMap((j) => [`${j.casa}|${j.rodada}`, `${j.visitante}|${j.rodada}`]),
  );
  let semana = aPartirDe;
  while (clubes.some((c) => ocupado.has(`${c}|${semana}`))) semana++;
  return semana;
}

/** Última semana com jogo agendado (−1 sem jogos). */
export function ultimaSemanaAgendada(jogos: Record<string, JogoAgendado>): number {
  let max = -1;
  for (const j of Object.values(jogos)) max = Math.max(max, j.rodada);
  return max;
}
