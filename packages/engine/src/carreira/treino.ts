import { melhorPara } from "../clube";
import { ESQUEMA_POSTOS } from "../constantes";
import { disponivel } from "../jogador";
import { type Rng, inteiroEntre, limitar, sortear } from "../rng";
import { ATRIBUTOS, type Atributo, type Bonus, type Clube, type Jogador } from "../tipos";
import { notaDaFuncao } from "./comissao";
import type { EstadoCarreira, FocoTreino, FuncaoComissao } from "./tipos";

export const FOCOS: Record<FocoTreino, { nome: string; descricao: string }> = {
  equilibrado: { nome: "Equilibrado", descricao: "Um pouco de tudo, sem sobrecarga." },
  tatico: { nome: "Tático", descricao: "Aumenta o entrosamento no esquema atual." },
  ataque: { nome: "Ataque", descricao: "Finalização e jogadas ofensivas. Bônus no ataque no próximo jogo." },
  defesa: { nome: "Defesa", descricao: "Posicionamento defensivo. Bônus na defesa no próximo jogo." },
  bolaParada: { nome: "Bola parada", descricao: "Escanteios e faltas ensaiados para o próximo jogo." },
  fisico: { nome: "Físico", descricao: "Resistência e força. Cansa mais nesta semana." },
  recuperacao: { nome: "Recuperação", descricao: "Recupera condição e moral, sem evolução técnica." },
};

const ATRIBUTOS_DO_FOCO: Record<FocoTreino, readonly Atributo[]> = {
  ataque: ["FIN", "ATQ", "CTL"],
  defesa: ["DEF", "CAB", "FIS"],
  fisico: ["RES", "VEL", "FIS"],
  tatico: ["PAS", "CTL", "DEF"],
  bolaParada: ["CAB", "PAS", "FIN"],
  equilibrado: ATRIBUTOS.filter((a) => a !== "GOL"),
  recuperacao: [],
};

function areaDoAtributo(a: Atributo): FuncaoComissao {
  if (["FIN", "ATQ", "CTL"].includes(a)) return "ataque";
  if (["DEF", "CAB"].includes(a)) return "defesa";
  if (["RES", "VEL", "FIS"].includes(a)) return "fisico";
  if (a === "GOL") return "goleiros";
  return "auxiliar";
}

/** Overall atual = overall de partida + evolução/3. */
export function recalcularOverall(j: Jogador): void {
  j.ovr = limitar((j.ovrBase ?? j.ovr) + Math.floor((j.evolucao ?? 0) / 3), 40, 92);
}

/**
 * Uma semana de treino para um jogador: chance de ganhar 1 ponto num atributo
 * do foco, maior com treinador bom, intensidade alta e jogador jovem; ninguém
 * passa do potencial (ou de overall de partida + 4, para quem não é da base).
 */
export function treinarJogador(
  carreira: EstadoCarreira,
  j: Jogador,
  multiplicador: number,
  rng: Rng,
): boolean {
  const { foco, intensidade } = carreira.treino;
  const lista = j.pos === "GOL" ? (["GOL", "GOL", "CAB"] as const) : ATRIBUTOS_DO_FOCO[foco];
  if (!lista.length) return false;
  j.ovrBase ??= j.ovr;
  j.evolucao ??= 0;
  const atributo = sortear(rng, lista);
  const area = j.pos === "GOL" ? "goleiros" : areaDoAtributo(atributo);
  // Idade pesa na evolução: garoto evolui rápido, veterano quase não; moral alta ajuda.
  const anos = j.idade;
  const idade =
    anos !== undefined
      ? anos <= 20
        ? 2.3
        : anos <= 23
          ? 1.6
          : anos <= 28
            ? 1
            : anos <= 31
              ? 0.6
              : 0.3
      : j.daBase || j.perso === "jovem"
        ? 2
        : j.perso === "veterano"
          ? 0.4
          : 1;
  const animo = 0.7 + j.moral / 200;
  const teto = j.potencial ?? j.ovrBase + 4;
  if (j.ovr >= teto) return false;
  const chance =
    0.07 * [0.6, 1, 1.45][intensidade]! * (notaDaFuncao(carreira, area) / 13) * idade * animo * multiplicador;
  if (rng.proximo() >= chance) return false;
  j.at[atributo] = Math.min(95, j.at[atributo] + 1);
  j.evolucao++;
  recalcularOverall(j);
  return true;
}

export interface RelatorioDoTreino {
  evoluiram: string[];
  lesionados: { nome: string; rodadas: number }[];
}

/** Treino da semana: evolução, condição, moral, lesões, entrosamento e bônus do próximo jogo. */
export function semanaDeTreino(carreira: EstadoCarreira, clube: Clube, rng: Rng): RelatorioDoTreino {
  const { foco, intensidade } = carreira.treino;
  const relatorio: RelatorioDoTreino = { evoluiram: [], lesionados: [] };
  const multBase = (notaDaFuncao(carreira, "base") / 12) * 0.8;
  for (const j of [...clube.jogadores, ...carreira.base]) {
    if (j.lesao > 0) continue;
    const daBase = carreira.base.includes(j);
    if (treinarJogador(carreira, j, daBase ? multBase : 1, rng) && !daBase) relatorio.evoluiram.push(j.nome);
  }
  const fisico = notaDaFuncao(carreira, "fisico");
  for (const j of clube.jogadores) {
    const delta =
      [6, 0, -6][intensidade]! +
      (foco === "recuperacao" ? 10 : 0) +
      (foco === "fisico" ? -4 : 0) +
      (fisico - 11);
    // Treino puxado tira no máximo 5 de condição: o descanso da semana sempre compensa.
    j.cond = limitar(j.cond + Math.max(-5, delta), 30, 100);
    if (foco === "recuperacao") j.moral = limitar(j.moral + 2, 0, 100);
    if (intensidade === 2 && (j.perso === "veterano" || j.perso === "temperamental"))
      j.moral = limitar(j.moral - 1, 0, 100);
    const risco =
      0.004 * [0.5, 1, 2][intensidade]! * (foco === "fisico" ? 1.3 : 1) * (1.3 - (fisico / 20) * 0.6);
    if (j.lesao === 0 && rng.proximo() < risco) {
      j.lesao = inteiroEntre(rng, 1, 3);
      relatorio.lesionados.push({ nome: j.nome, rodadas: j.lesao });
    }
  }
  const tatico = notaDaFuncao(carreira, "auxiliar");
  for (const esquema of Object.keys(carreira.entrosamento) as (keyof typeof carreira.entrosamento)[]) {
    if (esquema !== clube.esquema)
      carreira.entrosamento[esquema] = Math.max(40, (carreira.entrosamento[esquema] ?? 40) - 1);
  }
  const atual = carreira.entrosamento[clube.esquema] ?? 45;
  const ganho =
    (foco === "tatico" ? 7 : foco === "recuperacao" ? 1 : 3) *
    (0.5 + tatico / 20) *
    [0.7, 1, 1.2][intensidade]!;
  carreira.entrosamento[clube.esquema] = Math.min(100, atual + ganho);
  const q = (f: FuncaoComissao) => 0.5 + notaDaFuncao(carreira, f) / 20;
  carreira.bonus = {
    A: foco === "ataque" ? 0.025 * q("ataque") : 0,
    D: foco === "defesa" ? 0.025 * q("defesa") : 0,
    M: foco === "tatico" ? 0.01 * q("auxiliar") : 0,
    parada: foco === "bolaParada" ? 0.35 * q("auxiliar") : 0,
  };
  return relatorio;
}

/** Bônus do time do usuário no jogo: o do treino mais o entrosamento no esquema (±4% de 70 para cima/baixo). */
/** Motivação do grupo: moral média do elenco (0–100). */
export function motivacaoDoGrupo(clube: Clube): number {
  const js = clube.jogadores;
  return js.length ? Math.round(js.reduce((s, j) => s + j.moral, 0) / js.length) : 60;
}

export function bonusDoUsuario(carreira: EstadoCarreira, clube: Clube): Bonus {
  const e = carreira.entrosamento[clube.esquema] ?? 70;
  // Grupo motivado rende mais, e rende ainda mais quando a tática está entrosada (sinergia).
  const motivacao = (motivacaoDoGrupo(clube) - 60) / 100;
  const ef = ((e - 70) / 100) * 0.04 + motivacao * 0.025 + Math.max(0, motivacao) * (e / 100) * 0.03;
  const b = carreira.bonus;
  return { A: b.A + ef, D: b.D + ef, M: b.M + ef, parada: b.parada };
}

/** Tira do time quem se machucou ou foi suspenso, pondo o melhor reserva para o posto. */
export function reporDesfalques(clube: Clube): { saiu: string; entrou: string }[] {
  const trocas: { saiu: string; entrou: string }[] = [];
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const voltas = (clube.substitutoDe ??= {});
  // Titular que cumpriu suspensão ou se recuperou volta para o lugar de quem o substituiu.
  for (const [reservaId, originalId] of Object.entries(voltas)) {
    const original = clube.jogadores.find((x) => x.id === originalId);
    const i = clube.titulares.indexOf(reservaId);
    if (!original || i < 0 || clube.titulares.includes(originalId)) {
      delete voltas[reservaId];
      continue;
    }
    if (!disponivel(original)) continue;
    clube.titulares[i] = originalId;
    if (clube.reservas) {
      clube.reservas = clube.reservas.filter((x) => x !== originalId);
      if (clube.reservas.length < 12) clube.reservas.push(reservaId);
    }
    delete voltas[reservaId];
    const reserva = clube.jogadores.find((x) => x.id === reservaId);
    trocas.push({ saiu: reserva?.nome ?? "", entrou: original.nome });
  }
  if (clube.reservas)
    clube.reservas = clube.reservas.filter((id) => {
      const x = clube.jogadores.find((y) => y.id === id);
      return !x || disponivel(x);
    });
  clube.titulares = clube.titulares.map((id, i) => {
    const j = clube.jogadores.find((x) => x.id === id);
    if (!j || disponivel(j)) return id;
    const reserva = melhorPara(
      clube.jogadores.filter((x) => !clube.titulares.includes(x.id) && disponivel(x)),
      postos[i]![0],
    );
    if (!reserva) return id;
    trocas.push({ saiu: j.nome, entrou: reserva.nome });
    voltas[reserva.id] = voltas[j.id] ?? j.id;
    delete voltas[j.id];
    // Suspenso ou lesionado não pode ser titular nem ficar no banco: vai para os não relacionados.
    if (clube.reservas) clube.reservas = clube.reservas.filter((x) => x !== reserva.id && x !== j.id);
    return reserva.id;
  });
  return trocas;
}
