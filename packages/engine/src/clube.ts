import { ESQUEMA_POSTOS, taticaPadrao } from "./constantes";
import { type JogadorDados, criarJogador, disponivel, familiaridade } from "./jogador";
import { type Rng, hashTexto, inteiroEntre, limitar, sortear } from "./rng";
import {
  type Clube,
  type Cores,
  ESTILOS,
  type Esquema,
  type Estilo,
  type Jogador,
  type Posicao,
} from "./tipos";

/** Clube como vem no pacote de dados. */
export interface ClubeDados {
  id: string;
  nome: string;
  sigla: string;
  cores?: Cores | null;
  esquema?: Esquema;
  estilo?: Estilo;
  estadio?: string;
  /** Elenco real/fixo. Sem elenco, o jogo gera um com o `nivel`. */
  elenco?: JogadorDados[];
  /**
   * Nomes dos titulares preferidos. Sem a lista, os 11 primeiros do elenco são
   * os titulares, na ordem dos postos do esquema.
   */
  titulares?: string[];
  /** Overall médio do elenco gerado (clubes sem elenco). */
  nivel?: number;
  /**
   * Elenco real incompleto (clube pequeno sem fontes): completa até este tamanho com jogadores gerados no
   * `nivel`, marcados como provisórios. Só para clubes que disputam apenas o estadual.
   */
  completarAte?: number;
  /** Clube de massa: mais orçamento, mais exigência, mais atração no mercado. */
  grande?: boolean;
  /** Técnico atual (só para clubes da IA). */
  tecnico?: string;
  perfilDiretoria?: "economico" | "normal";
}

const PALETA_GENERICA: readonly Cores[] = [
  { principal: "#2a5f9e", secundaria: "#ffffff" },
  { principal: "#7a1f3d", secundaria: "#ffffff" },
  { principal: "#0a6b5b", secundaria: "#ffffff" },
  { principal: "#4a3f8f", secundaria: "#ffffff" },
  { principal: "#b5651d", secundaria: "#ffffff" },
  { principal: "#3d4a5c", secundaria: "#ffffff" },
  { principal: "#8a6d1d", secundaria: "#ffffff" },
  { principal: "#1f5a3a", secundaria: "#f2c200" },
  { principal: "#5c2a2a", secundaria: "#ffffff" },
  { principal: "#26545e", secundaria: "#ffffff" },
];

const NOMES_GERADOS = [
  "Wellington",
  "Jefferson",
  "Rafinha",
  "Diogo",
  "Matheusinho",
  "Léo",
  "Caio",
  "Igor",
  "Vinícius",
  "Allan",
  "Tiago",
  "Renan",
  "Robson",
  "Elias",
  "Fabinho",
  "Edu",
  "Pablo",
  "Juninho",
  "Gustavo",
  "Danilo",
  "Wesley",
  "Marlon",
  "Maycon",
  "Ronald",
  "Kelvin",
  "Ewerton",
  "Lucas",
  "Jean",
  "Felipe",
  "Douglas",
  "Gabriel",
  "Hugo",
  "Yago",
  "Willian",
  "Alisson",
  "Michel",
  "Sávio",
  "Patrick",
  "Romário",
  "Cristian",
];
const SOBRENOMES_GERADOS = [
  "Silva",
  "Santos",
  "Souza",
  "Oliveira",
  "Pereira",
  "Costa",
  "Ribeiro",
  "Alves",
  "Carvalho",
  "Araújo",
  "Mendes",
  "Barbosa",
  "Rocha",
  "Dias",
  "Teixeira",
  "Moreira",
  "Cardoso",
  "Nunes",
  "Freitas",
  "Batista",
  "Lopes",
  "Ramos",
  "Vieira",
  "Monteiro",
  "Correia",
  "Machado",
  "Pinto",
  "Cunha",
  "Farias",
  "Neves",
];
const POSICOES_ELENCO_GERADO: readonly Posicao[] = [
  "GOL",
  "GOL",
  "LD",
  "LE",
  "ZAG",
  "ZAG",
  "ZAG",
  "VOL",
  "VOL",
  "MC",
  "MC",
  "MEI",
  "PD",
  "PE",
  "ATA",
  "ATA",
  "LD",
  "MEI",
];
const ESQUEMAS_GERADOS: readonly Esquema[] = ["4-4-2", "4-3-3", "4-2-3-1", "4-1-4-1", "3-5-2"];

/** Elenco fictício de 18 jogadores em torno do `nivel` (reservas 3 pontos abaixo). */
export function gerarElenco(rng: Rng, nivel: number): JogadorDados[] {
  const usados = new Set<string>();
  return POSICOES_ELENCO_GERADO.map((pos, i) => {
    let nome: string;
    do {
      nome =
        sortear(rng, NOMES_GERADOS) + (rng.proximo() < 0.6 ? ` ${sortear(rng, SOBRENOMES_GERADOS)}` : "");
    } while (usados.has(nome));
    usados.add(nome);
    const ovr = limitar(nivel + inteiroEntre(rng, -5, 4) - (i >= 11 ? 3 : 0), 40, 85);
    return [nome, pos, ovr] as const;
  });
}

export function criarClube(dados: ClubeDados, rng: Rng): Clube {
  const h = hashTexto(dados.nome);
  let elenco = dados.elenco ?? gerarElenco(rng, dados.nivel ?? 60);
  if (dados.elenco && dados.completarAte && elenco.length < dados.completarAte) {
    const faltam = dados.completarAte - elenco.length;
    elenco = [
      ...elenco,
      ...gerarElenco(rng, dados.nivel ?? 55)
        .slice(0, faltam)
        .map((j) => [j[0], j[1], j[2], { ...j[3], fonte: "provisorio" }] as const),
    ];
  }
  const jogadores = elenco.map((j, i) => criarJogador(j, dados.id, i));
  const esquema = dados.esquema ?? ESQUEMAS_GERADOS[h % ESQUEMAS_GERADOS.length]!;
  const estilo = dados.estilo ?? ESTILOS[(h >>> 3) % ESTILOS.length]!;
  const clube: Clube = {
    id: dados.id,
    nome: dados.nome,
    sigla: dados.sigla,
    cores: dados.cores ?? PALETA_GENERICA[h % PALETA_GENERICA.length]!,
    esquema,
    estilo,
    jogadores,
    titulares: [],
    tatica: taticaPadrao(estilo),
    instrucoes: {},
    forca: 0,
  };
  if (dados.titulares) clube.titulares = escalarAutomatico(clube, esquema, dados.titulares);
  else if (dados.elenco) clube.titulares = jogadores.slice(0, 11).map((j) => j.id);
  else clube.titulares = escalarAutomatico(clube, esquema);
  clube.forca = forcaDoClube(clube);
  return clube;
}

export function jogadorDoClube(clube: Clube, id: string): Jogador {
  const j = clube.jogadores.find((p) => p.id === id);
  if (!j) throw new Error(`Jogador ${id} não está no ${clube.nome}`);
  return j;
}

/** Valor do jogador para o posto, considerando familiaridade e condição. */
export function melhorPara(candidatos: readonly Jogador[], posto: Posicao): Jogador | null {
  let melhor: Jogador | null = null;
  let melhorValor = -1;
  for (const j of candidatos) {
    const v = j.ovr * familiaridade(j, posto) * (0.6 + (0.4 * j.cond) / 100);
    if (v > melhorValor) {
      melhorValor = v;
      melhor = j;
    }
  }
  return melhor;
}

const ORDEM_DE_ESCALACAO: readonly Posicao[] = [
  "GOL",
  "ATA",
  "ZAG",
  "LD",
  "LE",
  "VOL",
  "MEI",
  "PD",
  "PE",
  "MC",
];

/**
 * Escala o time no esquema, dando preferência aos `preferidos` (por nome) e só
 * trocando quando há alguém claramente melhor para o posto. Ignora lesionados e suspensos,
 * a não ser que o elenco não tenha 11 disponíveis.
 */
export function escalarAutomatico(clube: Clube, esquema: Esquema, preferidos?: readonly string[]): string[] {
  const postos = ESQUEMA_POSTOS[esquema];
  const usados = new Set<string>();
  const escalacao = new Array<string>(postos.length);
  const livre = (j: Jogador) => !usados.has(j.id) && disponivel(j);
  const preferencia = preferidos ? clube.jogadores.filter((j) => preferidos.includes(j.nome)) : [];
  const ordem = postos
    .map((_, i) => i)
    .sort((a, b) => ORDEM_DE_ESCALACAO.indexOf(postos[a]![0]) - ORDEM_DE_ESCALACAO.indexOf(postos[b]![0]));
  for (const i of ordem) {
    const posto = postos[i]![0];
    let escolhido = melhorPara(preferencia.filter(livre), posto);
    if (!escolhido || familiaridade(escolhido, posto) < 0.8) {
      const alternativa = melhorPara(clube.jogadores.filter(livre), posto);
      if (
        alternativa &&
        (!escolhido ||
          alternativa.ovr * familiaridade(alternativa, posto) >
            escolhido.ovr * familiaridade(escolhido, posto) + 4)
      ) {
        escolhido = alternativa;
      }
    }
    escolhido ??= clube.jogadores.find(livre) ?? null;
    // Elenco curto demais (lesões + suspensões): entra quem estiver menos longe de voltar.
    escolhido ??=
      clube.jogadores
        .filter((j) => !usados.has(j.id))
        .sort((a, b) => a.susp + a.lesao - (b.susp + b.lesao))[0] ?? null;
    if (!escolhido) throw new Error(`${clube.nome} tem menos de 11 jogadores no elenco`);
    usados.add(escolhido.id);
    escalacao[i] = escolhido.id;
  }
  return escalacao;
}

export function forcaDoClube(clube: Clube): number {
  const titulares = clube.titulares.map((id) => jogadorDoClube(clube, id));
  return titulares.reduce((s, j) => s + j.ovr, 0) / titulares.length;
}
