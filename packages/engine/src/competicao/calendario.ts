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

/** Segunda-feira da semana 0 da primeira temporada disponível no jogo. */
const INICIO = Date.UTC(2026, 0, 5);
const DIA = 86_400_000;

// Caches: o calendário inteiro é conferido a cada rodada, com milhares de jogos.
const DIAS_DA_DATA = new Map<string, number>();
const DATA_DO_HORARIO = new Map<number, string>();

function diasDesdeInicio(data: string): number {
  let dias = DIAS_DA_DATA.get(data);
  if (dias === undefined) {
    const [a, m, d] = data.split("-").map(Number) as [number, number, number];
    dias = Math.round((Date.UTC(a, m - 1, d) - INICIO) / DIA);
    DIAS_DA_DATA.set(data, dias);
  }
  return dias;
}

/** Converte a data real no horário do jogo (seg–qui = meio de semana; sex–dom = fim de semana). */
export function horarioDaData(data: string): Horario {
  const dias = Math.max(0, diasDesdeInicio(data));
  return { semana: Math.floor(dias / 7), meio: dias % 7 <= 3, data };
}

/** Data padrão do horário: quarta no meio de semana, domingo no fim de semana. */
export function dataDoHorario(semana: number, meio: boolean): string {
  const chave = semana * 2 + (meio ? 1 : 0);
  let data = DATA_DO_HORARIO.get(chave);
  if (data === undefined) {
    data = new Date(INICIO + (semana * 7 + (meio ? 2 : 6)) * DIA).toISOString().slice(0, 10);
    DATA_DO_HORARIO.set(chave, data);
  }
  return data;
}

/** Data efetiva de um jogo (a registrada ou a padrão do horário). */
export function dataDoJogo(j: Pick<JogoAgendado, "rodada" | "meioDeSemana" | "data">): string {
  return j.data ?? dataDoHorario(j.rodada, j.meioDeSemana);
}

/** Ano do calendário-modelo: toda temporada reusa as datas de 2026 (a semana 0 é 05/01/2026). */
export const ANO_DO_CALENDARIO = 2026;

/**
 * Data do calendário-modelo levada para o ano da temporada, para mostrar na tela. Anda semanas inteiras
 * (o domingo de jogo continua domingo), então fica a no máximo 3 dias da mesma data do calendário.
 */
export function dataNaTemporada(data: string, temporada: number): string {
  const anos = temporada - ANO_DO_CALENDARIO;
  if (!anos) return data;
  const semanas = Math.round((anos * 365.2425) / 7);
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + semanas * 7)).toISOString().slice(0, 10);
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
  const dia = new Map<JogoAgendado, number>();
  for (const j of Object.values(jogos)) {
    dia.set(j, diasDesdeInicio(dataDoJogo(j)));
    for (const clube of [j.casa, j.visitante]) {
      const lista = porClube.get(clube);
      if (lista) lista.push(j);
      else porClube.set(clube, [j]);
    }
  }
  const conflitos: ConflitoDeCalendario[] = [];
  for (const [clube, lista] of porClube) {
    lista.sort((a, b) => dia.get(a)! - dia.get(b)!);
    for (let i = 1; i < lista.length; i++) {
      const a = lista[i - 1]!;
      const b = lista[i]!;
      if (Math.abs(dia.get(a)! - dia.get(b)!) < DESCANSO_MINIMO) {
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
