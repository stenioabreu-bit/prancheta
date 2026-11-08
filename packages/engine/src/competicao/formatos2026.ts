/**
 * Formatos das Séries A a D, conforme os Regulamentos Específicos da CBF de 2026.
 * Repetidos a cada temporada do jogo (decisão de 2026-11-08), com uma adaptação
 * para os tamanhos ficarem fixos: a Série C rebaixa 6 (o REC de 2026 rebaixa 2,
 * porque a C real cresce para 24 clubes em 2027), igual aos 6 que sobem da D.
 */
import type { FormatoDivisao } from "./tipos";

export const SERIE_A_2026: FormatoDivisao = {
  divisao: "A",
  nome: "Série A",
  clubes: 20,
  fases: [
    {
      tipo: "liga",
      nome: "Pontos corridos",
      grupos: 1,
      distribuicao: "unico",
      turnos: 2,
      avancamPorGrupo: 0,
    },
  ],
  acesso: [],
  rebaixamento: [{ fase: "Pontos corridos", posicao: "ultimos", quantidade: 4 }],
};

export const SERIE_B_2026: FormatoDivisao = {
  divisao: "B",
  nome: "Série B",
  clubes: 20,
  fases: [
    {
      tipo: "liga",
      nome: "Pontos corridos",
      grupos: 1,
      distribuicao: "unico",
      turnos: 2,
      avancamPorGrupo: 0,
    },
  ],
  acesso: [{ fase: "Pontos corridos", posicao: "primeiros", quantidade: 4 }],
  rebaixamento: [{ fase: "Pontos corridos", posicao: "ultimos", quantidade: 4 }],
};

/** REC Série C 2026: turno único, 8 para dois quadrangulares, 2 de cada grupo sobem, final entre os líderes. */
export const SERIE_C_2026: FormatoDivisao = {
  divisao: "C",
  nome: "Série C",
  clubes: 20,
  fases: [
    { tipo: "liga", nome: "1ª fase", grupos: 1, distribuicao: "unico", turnos: 1, avancamPorGrupo: 8 },
    { tipo: "liga", nome: "2ª fase", grupos: 2, distribuicao: "serpentina", turnos: 2, avancamPorGrupo: 1 },
    { tipo: "mataMata", nome: "Final", idaEVolta: true, chaveamento: "melhorContraPior" },
  ],
  acesso: [{ fase: "2ª fase", posicao: "primeirosDeCadaGrupo", quantidade: 2 }],
  rebaixamento: [{ fase: "1ª fase", posicao: "ultimos", quantidade: 6 }],
};

/**
 * REC Série D 2026 (Arts. 6, 13 a 21): 16 grupos de 6 em turno e returno, 4 de cada
 * avançam; mata-mata em ida e volta (saldo, depois pênaltis); os eliminados na 5ª
 * fase jogam playoffs (1º x 4º, 2º x 3º pela campanha) por 2 vagas; sobem os 4
 * semifinalistas e os 2 vencedores dos playoffs.
 */
export const SERIE_D_2026: FormatoDivisao = {
  divisao: "D",
  nome: "Série D",
  clubes: 96,
  fases: [
    { tipo: "liga", nome: "1ª fase", grupos: 16, distribuicao: "alternada", turnos: 2, avancamPorGrupo: 4 },
    { tipo: "mataMata", nome: "2ª fase", idaEVolta: true, chaveamento: "cruzamentoDeGrupos" },
    { tipo: "mataMata", nome: "3ª fase", idaEVolta: true, chaveamento: "chave" },
    { tipo: "mataMata", nome: "Oitavas de final", idaEVolta: true, chaveamento: "chave" },
    { tipo: "mataMata", nome: "Quartas de final", idaEVolta: true, chaveamento: "melhorContraPior" },
    {
      tipo: "mataMata",
      nome: "Playoffs",
      idaEVolta: true,
      chaveamento: "melhorContraPior",
      origem: { perdedoresDe: "Quartas de final" },
      terminal: true,
    },
    { tipo: "mataMata", nome: "Semifinal", idaEVolta: true, chaveamento: "chave" },
    { tipo: "mataMata", nome: "Final", idaEVolta: true, chaveamento: "chave" },
  ],
  acesso: [
    { fase: "Semifinal", posicao: "participantes" },
    { fase: "Playoffs", posicao: "vencedores" },
  ],
  rebaixamento: [],
};

export const FORMATOS_2026 = { A: SERIE_A_2026, B: SERIE_B_2026, C: SERIE_C_2026, D: SERIE_D_2026 } as const;
