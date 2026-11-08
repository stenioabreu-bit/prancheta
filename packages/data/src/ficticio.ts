import { type ClubeDados, type Divisao, hashTexto } from "@prancheta/engine";
import { type PacoteDados, idDoClube } from "./pacote";

/**
 * Série A fictícia, escrita à mão. A faixa de níveis imita a da Série A real
 * (força ~66 a ~80).
 */
const SERIE_A: readonly [string, string, number][] = [
  ["Atlético Pedra Alta", "APA", 80],
  ["Grêmio Mar Bravo", "GMB", 79],
  ["União Campo Dourado", "UCD", 78],
  ["Real Planalto", "RPL", 77],
  ["Porto Dourado", "PDO", 76],
  ["Ipê Vermelho", "IPV", 75],
  ["Vila Serena", "VSE", 75],
  ["Clube Atlético Ventania", "CAV", 74],
  ["Sertão Bravo", "SBR", 74],
  ["Lagoa Funda", "LAF", 73],
  ["Morro Verde", "MVE", 73],
  ["Carcará", "CAR", 72],
  ["Águas Serenas", "AGS", 72],
  ["Aurora do Campo", "ADC", 71],
  ["Cerro Velho", "CVE", 71],
  ["Trovão", "TRO", 70],
  ["Farol Novo", "FAN", 70],
  ["Bruma Alta", "BRA", 69],
  ["Luar", "LUA", 68],
  ["Sereno", "SER", 67],
];

/** Lugares inventados para as Séries B a D: lugar + qualidade, concordando em gênero. */
const LUGAR: readonly [string, "m" | "f"][] = [
  ["Vale", "m"],
  ["Serra", "f"],
  ["Campo", "m"],
  ["Lagoa", "f"],
  ["Morro", "m"],
  ["Cerro", "m"],
  ["Baía", "f"],
  ["Pedra", "f"],
  ["Chapada", "f"],
  ["Mata", "f"],
  ["Ilha", "f"],
  ["Planície", "f"],
];
const QUALIDADE: readonly [string, string][] = [
  ["Azul", "Azul"],
  ["Alto", "Alta"],
  ["Dourado", "Dourada"],
  ["Bravo", "Brava"],
  ["Fundo", "Funda"],
  ["Sereno", "Serena"],
  ["Bonito", "Bonita"],
  ["Velho", "Velha"],
  ["Largo", "Larga"],
  ["Escuro", "Escura"],
  ["Formoso", "Formosa"],
  ["Sombrio", "Sombria"],
];
const PREFIXO = [
  "Esporte Clube",
  "Atlético",
  "União",
  "Sociedade Esportiva",
  "Associação",
  "Grêmio",
  "Real",
  "Clube",
];

/** Faixa de nível de cada série (mesma do protótipo). */
const NIVEL: Record<Exclude<Divisao, "A">, [number, number]> = { B: [65, 70], C: [59, 64], D: [51, 58] };
const TAMANHO: Record<Exclude<Divisao, "A">, number> = { B: 20, C: 20, D: 96 };

/** Sigla de 3 letras ainda não usada: iniciais do lugar e da qualidade + uma letra da qualidade. */
function sigla(lugar: string, qualidade: string, usadas: Set<string>): string {
  const base = `${lugar[0]}${qualidade[0]}`.toUpperCase();
  const letras = idDoClube(`${qualidade}${lugar}abcdefghijklmnopqrstuvwxyz`).replace(/-/g, "").slice(1);
  for (const letra of letras) {
    const s = `${base}${letra.toUpperCase()}`;
    if (!usadas.has(s)) {
      usadas.add(s);
      return s;
    }
  }
  throw new Error(`Sem sigla livre para ${lugar} ${qualidade}`);
}

function gerarDivisoes(): Record<Exclude<Divisao, "A">, ClubeDados[]> {
  const idsDaA = new Set(SERIE_A.map(([nome]) => idDoClube(nome)));
  const nomes = LUGAR.flatMap(([lugar, genero]) =>
    QUALIDADE.map(([masculino, feminino]) => [lugar, genero === "m" ? masculino : feminino] as const),
  ).filter(([lugar, qualidade]) => !idsDaA.has(idDoClube(`${lugar} ${qualidade}`)));
  // Ordem fixa e espalhada, para cada série não sair só com o mesmo "Vale ...".
  nomes.sort((a, b) => hashTexto(a.join(" ")) - hashTexto(b.join(" ")));
  let i = 0;
  const siglas = new Set(SERIE_A.map(([, s]) => s));
  const resultado = {} as Record<Exclude<Divisao, "A">, ClubeDados[]>;
  for (const d of ["B", "C", "D"] as const) {
    const [min, max] = NIVEL[d];
    resultado[d] = Array.from({ length: TAMANHO[d] }, (_, k) => {
      const [lugar, qualidade] = nomes[i]!;
      const prefixo = PREFIXO[hashTexto(lugar + qualidade) % PREFIXO.length]!;
      const nome = `${prefixo} ${lugar} ${qualidade}`;
      const clube: ClubeDados = {
        id: idDoClube(`${lugar} ${qualidade}`),
        nome,
        sigla: sigla(lugar, qualidade, siglas),
        nivel: max - Math.floor((k * (max - min + 1)) / TAMANHO[d]),
      };
      i++;
      return clube;
    });
  }
  return resultado;
}

export function pacoteFicticio(): PacoteDados {
  const serieA: ClubeDados[] = SERIE_A.map(([nome, sigla, nivel]) => ({
    id: idDoClube(nome),
    nome,
    sigla,
    nivel,
  }));
  const { B, C, D } = gerarDivisoes();
  return {
    formato: 1,
    id: "ficticio",
    nome: "Liga fictícia",
    ficticio: true,
    temporada: 2026,
    divisoes: { A: serieA, B, C, D },
    vagasDiretasCopa: [C[0]!.id, C[1]!.id, D[0]!.id, D[1]!.id],
  };
}
