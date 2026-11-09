/**
 * Calendário em semanas com dois horários (fim de semana e meio de semana). Cada competição agenda
 * seus jogos em (semana, meioDeSemana); um clube não pode ter dois jogos no mesmo horário.
 * A temporada termina quando não sobra jogo e as competições fecharam, sem número fixo de rodadas.
 */
import type { JogoAgendado } from "./tipos";

export interface ConflitoDeCalendario {
  clube: string;
  semana: number;
  meioDeSemana: boolean;
  jogos: string[];
}

/** Clubes escalados duas vezes no mesmo horário. Lista vazia = calendário válido. */
export function conflitosDeCalendario(jogos: Record<string, JogoAgendado>): ConflitoDeCalendario[] {
  const porHorario = new Map<string, string[]>();
  for (const j of Object.values(jogos)) {
    for (const clube of [j.casa, j.visitante]) {
      const chave = `${clube}|${j.rodada}|${j.meioDeSemana ? 1 : 0}`;
      porHorario.set(chave, [...(porHorario.get(chave) ?? []), j.id]);
    }
  }
  const conflitos: ConflitoDeCalendario[] = [];
  for (const [chave, ids] of porHorario) {
    if (ids.length < 2) continue;
    const [clube, semana, meio] = chave.split("|");
    conflitos.push({ clube: clube!, semana: Number(semana), meioDeSemana: meio === "1", jogos: ids });
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
