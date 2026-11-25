/**
 * Criação do atleta: as três propostas da base (como no começo de um simulador de carreira) com a
 * previsão de minutos em cada clube, a partir da concorrência na posição.
 */
import { type ClubeDados, criarClube } from "../clube";
import { ESQUEMA_POSTOS, compatibilidade } from "../constantes";
import { criarRng, inteiroEntre, limitar } from "../rng";
import type { Clube, Posicao } from "../tipos";

export interface PropostaDaBase {
  clubeId: string;
  nome: string;
  /** Nome da liga do clube. */
  liga: string;
  descricao: string;
  /** Minutos previstos na primeira temporada. */
  minutos: number;
  /** Nível do clube de 1 a 5 (barrinhas). */
  nivel: number;
}

export interface ClubeParaProposta {
  dados: ClubeDados;
  liga: string;
  /** 1 = elite do país, 2 = segunda divisão... */
  divisao: number;
}

/** Minutos previstos na temporada (mesma régua do técnico: titular se poucos na posição são melhores). */
export function minutosPrevistos(clube: Clube, pos: Posicao, ovr: number): number {
  const vagas = Math.max(
    1,
    ESQUEMA_POSTOS[clube.esquema].filter((p) => compatibilidade(pos, p[0]) >= 0.9).length,
  );
  const rivais = clube.jogadores
    .filter((x) => compatibilidade(x.pos, pos) >= 0.9)
    .map((x) => x.ovr)
    .sort((x, y) => y - x);
  const acima = rivais.filter((o) => o > ovr).length;
  // Distância para o último titular da posição: quanto mais perto, mais chances.
  const distancia = (rivais[vagas - 1] ?? 0) - ovr;
  // Titular joga quase tudo; o reserva entra em metade dos jogos e ganha chances com lesões e
  // suspensões, mais quanto mais perto ele estiver do último titular.
  if (acima < vagas) return 3000 - acima * 300;
  const fila = acima - vagas;
  return limitar(1500 - fila * 120 - Math.max(0, distancia - 2) * 50, 300, 2100);
}

function descricao(divisao: number, posicaoNaLiga: number, total: number): string {
  if (divisao === 1 && posicaoNaLiga <= Math.ceil(total * 0.3))
    return "Gigante, presença nas copas continentais";
  if (divisao === 1) return "Clube da elite";
  if (divisao === 2) return "Clube da segunda divisão";
  return "Clube das divisões de acesso";
}

/**
 * Três clubes chamam o garoto: um grande da elite, um da elite ou do topo da segunda divisão e um
 * menor, onde ele joga mais. A semente define o sorteio (a mesma do save).
 */
export function propostasDaBase(
  opcoes: readonly ClubeParaProposta[],
  pos: Posicao,
  ovr: number,
  semente: number,
): PropostaDaBase[] {
  const rng = criarRng(semente ^ 0x2b0a);
  const montados = opcoes.map((o) => ({ ...o, clube: criarClube(o.dados, criarRng(1)) }));
  const porDivisao = (d: number) =>
    montados.filter((m) => m.divisao === d).sort((a, b) => b.clube.forca - a.clube.forca);
  const elite = porDivisao(1);
  const segunda = porDivisao(2).length ? porDivisao(2) : elite.slice(Math.ceil(elite.length / 2));
  const terceira = porDivisao(3);
  const sortear = <T>(lista: readonly T[]) =>
    lista.length ? lista[inteiroEntre(rng, 0, lista.length - 1)] : undefined;
  const escolhidos = [
    sortear(elite.slice(0, Math.max(1, Math.ceil(elite.length * 0.35)))),
    sortear([
      ...elite.slice(Math.ceil(elite.length * 0.35)),
      ...segunda.slice(0, Math.ceil(segunda.length / 3)),
    ]),
    sortear([...segunda.slice(Math.floor(segunda.length / 2)), ...terceira.slice(0, 8)]),
  ];
  const vistos = new Set<string>();
  const r: PropostaDaBase[] = [];
  for (const m of escolhidos) {
    if (!m || vistos.has(m.dados.id)) continue;
    vistos.add(m.dados.id);
    const lista = m.divisao === 1 ? elite : porDivisao(m.divisao);
    r.push({
      clubeId: m.dados.id,
      nome: m.dados.nome,
      liga: m.liga,
      descricao: descricao(m.divisao, lista.indexOf(m) + 1, lista.length),
      minutos: Math.round(minutosPrevistos(m.clube, pos, ovr) / 10) * 10,
      nivel: limitar(Math.round((m.clube.forca - 58) / 4), 1, 5),
    });
  }
  // Pacote pequeno: completa com quem sobrou.
  for (const m of montados.sort((a, b) => b.clube.forca - a.clube.forca)) {
    if (r.length >= 3) break;
    if (vistos.has(m.dados.id)) continue;
    vistos.add(m.dados.id);
    r.push({
      clubeId: m.dados.id,
      nome: m.dados.nome,
      liga: m.liga,
      descricao: descricao(m.divisao, 99, 1),
      minutos: Math.round(minutosPrevistos(m.clube, pos, ovr) / 10) * 10,
      nivel: limitar(Math.round((m.clube.forca - 58) / 4), 1, 5),
    });
  }
  return r.sort((a, b) => a.nivel - b.nivel);
}
