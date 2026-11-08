import { APELIDOS_BASE, SOBRENOMES_BASE } from "../conteudo/nomes";
import { criarJogador } from "../jogador";
import { type Rng, inteiroEntre, limitar, sortear } from "../rng";
import type { Clube, Jogador, Posicao } from "../tipos";
import { notaDaFuncao } from "./comissao";
import type { EstadoCarreira } from "./tipos";

const POSICOES_DA_BASE: readonly Posicao[] = [
  "GOL",
  "ZAG",
  "ZAG",
  "LD",
  "LE",
  "VOL",
  "MC",
  "MEI",
  "PD",
  "PE",
  "ATA",
  "ATA",
];

/** Garotos de 16 a 19 anos, overall 50–62 e potencial 62–84. */
export function gerarGarotos(carreira: EstadoCarreira, quantidade: number, rng: Rng): Jogador[] {
  return Array.from({ length: quantidade }, () => {
    const n = carreira.proximoId++;
    const pos = POSICOES_DA_BASE[n % POSICOES_DA_BASE.length]!;
    const nome = `${sortear(rng, APELIDOS_BASE)} ${sortear(rng, SOBRENOMES_BASE)}`;
    const ovr = inteiroEntre(rng, 50, 62);
    const j = criarJogador([nome, pos, ovr, { perso: "jovem" }], "base", n);
    j.idade = inteiroEntre(rng, 16, 19);
    j.potencial = limitar(ovr + inteiroEntre(rng, 6, 24), 62, 84);
    j.daBase = true;
    j.ovrBase = ovr;
    j.evolucao = 0;
    return j;
  });
}

/** Avaliação do coordenador: quanto pior ele for, mais erra o potencial (até ±5). */
export function avaliarPotencial(carreira: EstadoCarreira, j: Jogador, rng: Rng): string {
  const erro = Math.round((20 - notaDaFuncao(carreira, "base")) / 3);
  const estimado = (j.potencial ?? j.ovr) + inteiroEntre(rng, -erro, erro);
  if (estimado >= 78) return "Pode virar titular de seleção";
  if (estimado >= 73) return "Tem cara de titular do time principal";
  if (estimado >= 68) return "Bom jogador de elenco";
  return "Dificilmente vinga no profissional";
}

export function promover(carreira: EstadoCarreira, clube: Clube, jogadorId: string): Jogador | null {
  const i = carreira.base.findIndex((j) => j.id === jogadorId);
  if (i < 0) return null;
  const [j] = carreira.base.splice(i, 1);
  j!.id = `${clube.id}_b${carreira.proximoId++}`;
  clube.jogadores.push(j!);
  carreira.torcida = limitar(carreira.torcida + 1, 0, 100);
  return j!;
}

/** Devolve à base um garoto promovido (não pode estar entre os titulares). */
export function devolverABase(carreira: EstadoCarreira, clube: Clube, jogadorId: string): boolean {
  const j = clube.jogadores.find((x) => x.id === jogadorId);
  if (!j?.daBase || clube.titulares.includes(jogadorId)) return false;
  clube.jogadores = clube.jogadores.filter((x) => x !== j);
  carreira.base.push(j);
  return true;
}
