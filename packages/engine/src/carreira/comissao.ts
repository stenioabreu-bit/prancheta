import { NOMES_COMISSAO, SOBRENOMES_COMISSAO } from "../conteudo/nomes";
import { type Rng, inteiroEntre, sortear } from "../rng";
import type { AtributoComissao, EstadoCarreira, FuncaoComissao, MembroComissao } from "./tipos";

export const FUNCOES_COMISSAO: readonly {
  funcao: FuncaoComissao;
  nome: string;
  atributo: AtributoComissao;
  descricao: string;
}[] = [
  {
    funcao: "auxiliar",
    nome: "Auxiliar técnico",
    atributo: "tatico",
    descricao: "Lê o jogo com você, dá conselhos e ajuda nas preleções.",
  },
  {
    funcao: "goleiros",
    nome: "Treinador de goleiros",
    atributo: "goleiros",
    descricao: "Treina os goleiros toda semana.",
  },
  {
    funcao: "ataque",
    nome: "Treinador de ataque",
    atributo: "ataque",
    descricao: "Finalização e movimentação dos atacantes e meias.",
  },
  {
    funcao: "defesa",
    nome: "Treinador de defesa",
    atributo: "defesa",
    descricao: "Posicionamento e desarme de zagueiros, laterais e volantes.",
  },
  {
    funcao: "fisico",
    nome: "Preparador físico",
    atributo: "fisico",
    descricao: "Recuperação, resistência e prevenção de lesões.",
  },
  {
    funcao: "base",
    nome: "Coordenador da base",
    atributo: "juventude",
    descricao: "Desenvolve e avalia os garotos da base.",
  },
];

export const NOME_ATRIBUTO_COMISSAO: Record<AtributoComissao, string> = {
  tatico: "Tático",
  motivacao: "Motivação",
  goleiros: "Goleiros",
  ataque: "Ataque",
  defesa: "Defesa",
  fisico: "Físico",
  juventude: "Base",
};

const ATRIBUTOS_COMISSAO = Object.keys(NOME_ATRIBUTO_COMISSAO) as AtributoComissao[];

/** 10 profissionais fictícios, cada um forte numa especialidade (atributos de 1 a 20). */
export function gerarComissao(rng: Rng): MembroComissao[] {
  const especialidades: AtributoComissao[] = [
    "tatico",
    "goleiros",
    "ataque",
    "defesa",
    "fisico",
    "juventude",
    "tatico",
    "fisico",
    "ataque",
    "motivacao",
  ];
  const usados = new Set<string>();
  return especialidades.map((esp, i) => {
    let nome: string;
    do {
      nome = `${sortear(rng, NOMES_COMISSAO)} ${sortear(rng, SOBRENOMES_COMISSAO)}`;
    } while (usados.has(nome));
    usados.add(nome);
    const at = {} as Record<AtributoComissao, number>;
    for (const a of ATRIBUTOS_COMISSAO) at[a] = inteiroEntre(rng, 5, 12);
    at[esp] = inteiroEntre(rng, 13, 18);
    if (esp !== "motivacao") at.motivacao = Math.max(at.motivacao, inteiroEntre(rng, 8, 15));
    return { id: `comissao${i}`, nome, at };
  });
}

/** Põe em cada função quem for melhor no atributo dela, sem repetir pessoa. */
export function distribuirFuncoes(membros: readonly MembroComissao[]): Record<FuncaoComissao, string> {
  const funcoes = {} as Record<FuncaoComissao, string>;
  const ocupados = new Set<string>();
  for (const { funcao, atributo } of FUNCOES_COMISSAO) {
    const melhor = membros
      .filter((m) => !ocupados.has(m.id))
      .sort((a, b) => b.at[atributo] - a.at[atributo])[0]!;
    funcoes[funcao] = melhor.id;
    ocupados.add(melhor.id);
  }
  return funcoes;
}

export function membroDaFuncao(carreira: EstadoCarreira, funcao: FuncaoComissao): MembroComissao {
  const id = carreira.comissao.funcoes[funcao];
  return carreira.comissao.membros.find((m) => m.id === id)!;
}

/** Nota (1–20) de quem cuida da função, no atributo que a função usa. */
export function notaDaFuncao(carreira: EstadoCarreira, funcao: FuncaoComissao): number {
  const atributo = FUNCOES_COMISSAO.find((f) => f.funcao === funcao)!.atributo;
  return membroDaFuncao(carreira, funcao)?.at[atributo] ?? 6;
}

/** Troca quem ocupa a função; quem estava em outra função troca de lugar. */
export function definirFuncao(carreira: EstadoCarreira, funcao: FuncaoComissao, membroId: string): void {
  const funcoes = carreira.comissao.funcoes;
  const anterior = funcoes[funcao];
  const outra = (Object.keys(funcoes) as FuncaoComissao[]).find((f) => funcoes[f] === membroId);
  if (outra) funcoes[outra] = anterior;
  funcoes[funcao] = membroId;
}

/** O auxiliar motivador amplifica a preleção que dá certo e amortece a que dá errado. */
export function multiplicadorDoAuxiliar(carreira: EstadoCarreira, efeitoBase: number): number {
  const motivacao = membroDaFuncao(carreira, "auxiliar").at.motivacao;
  return 1 + (efeitoBase > 0 ? (motivacao - 10) / 45 : -(motivacao - 10) / 60);
}
