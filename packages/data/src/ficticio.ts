import type { ClubeDados } from "@prancheta/engine";
import { type PacoteDados, idDoClube } from "./pacote";

/**
 * Série A fictícia: nomes inventados, elencos gerados pelo motor a partir do
 * nível. A faixa de níveis imita a da Série A real (força ~66 a ~80).
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

export function pacoteFicticio(): PacoteDados {
  const clubes: ClubeDados[] = SERIE_A.map(([nome, sigla, nivel]) => ({
    id: idDoClube(nome),
    nome,
    sigla,
    nivel,
  }));
  return {
    formato: 1,
    id: "ficticio",
    nome: "Liga fictícia",
    ficticio: true,
    temporada: 2027,
    divisoes: { A: clubes },
  };
}
