/**
 * Catálogo das competições do universo 2026, com IDs permanentes.
 * O ID é a chave usada nos logos (`apps/web/public/assets/logos/competicoes/manifest.json`) e, quando as
 * competições novas forem implementadas, nos formatos do motor. Não renomear um ID existente.
 */
export type CategoriaCompeticao = "brasil-nacional" | "brasil-estadual" | "america-do-sul" | "continental";

export interface CompeticaoCatalogo {
  id: string;
  /** Denominação institucional (sem patrocinador). */
  nomeOficial: string;
  /** Nome curto para a interface. */
  nomeCurto: string;
  categoria: CategoriaCompeticao;
  /** Sigla do país (ISO 3166-1 alfa-3) ou "CONMEBOL". */
  pais: string;
  /** UF, só para estaduais. */
  uf?: string;
  /** Já existe no motor de simulação. */
  noMotor: boolean;
}

const nacional = (id: string, nomeOficial: string, nomeCurto: string): CompeticaoCatalogo => ({
  id,
  nomeOficial,
  nomeCurto,
  categoria: "brasil-nacional",
  pais: "BRA",
  noMotor: true,
});
const estadual = (uf: string, id: string, nomeOficial: string, nomeCurto: string): CompeticaoCatalogo => ({
  id,
  nomeOficial,
  nomeCurto,
  categoria: "brasil-estadual",
  pais: "BRA",
  uf,
  noMotor: false,
});
const exterior = (pais: string, id: string, nomeOficial: string, nomeCurto: string): CompeticaoCatalogo => ({
  id,
  nomeOficial,
  nomeCurto,
  categoria: "america-do-sul",
  pais,
  noMotor: false,
});

export const COMPETICOES: readonly CompeticaoCatalogo[] = [
  nacional("brasileirao-serie-a", "Campeonato Brasileiro Série A", "Série A"),
  nacional("brasileirao-serie-b", "Campeonato Brasileiro Série B", "Série B"),
  nacional("brasileirao-serie-c", "Campeonato Brasileiro Série C", "Série C"),
  nacional("brasileirao-serie-d", "Campeonato Brasileiro Série D", "Série D"),
  nacional("copa-do-brasil", "Copa do Brasil", "Copa do Brasil"),
  estadual("SP", "campeonato-paulista", "Campeonato Paulista Série A1", "Paulistão"),
  estadual("RJ", "campeonato-carioca", "Campeonato Carioca", "Carioca"),
  estadual("MG", "campeonato-mineiro", "Campeonato Mineiro Módulo I", "Mineiro"),
  estadual("RS", "campeonato-gaucho", "Campeonato Gaúcho Série A", "Gauchão"),
  estadual("PR", "campeonato-paranaense", "Campeonato Paranaense", "Paranaense"),
  estadual("SC", "campeonato-catarinense", "Campeonato Catarinense Série A", "Catarinense"),
  estadual("BA", "campeonato-baiano", "Campeonato Baiano", "Baiano"),
  estadual("PE", "campeonato-pernambucano", "Campeonato Pernambucano", "Pernambucano"),
  estadual("CE", "campeonato-cearense", "Campeonato Cearense", "Cearense"),
  estadual("GO", "campeonato-goiano", "Campeonato Goiano", "Goiano"),
  estadual("AL", "campeonato-alagoano", "Campeonato Alagoano", "Alagoano"),
  estadual("RN", "campeonato-potiguar", "Campeonato Potiguar", "Potiguar"),
  estadual("PB", "campeonato-paraibano", "Campeonato Paraibano", "Paraibano"),
  estadual("SE", "campeonato-sergipano", "Campeonato Sergipano", "Sergipano"),
  estadual("MA", "campeonato-maranhense", "Campeonato Maranhense", "Maranhense"),
  estadual("PI", "campeonato-piauiense", "Campeonato Piauiense", "Piauiense"),
  estadual("PA", "campeonato-paraense", "Campeonato Paraense", "Parazão"),
  estadual("AM", "campeonato-amazonense", "Campeonato Amazonense", "Barezão"),
  estadual("RO", "campeonato-rondoniense", "Campeonato Rondoniense", "Rondoniense"),
  estadual("AC", "campeonato-acriano", "Campeonato Acriano", "Acriano"),
  estadual("AP", "campeonato-amapaense", "Campeonato Amapaense", "Amapaense"),
  estadual("TO", "campeonato-tocantinense", "Campeonato Tocantinense", "Tocantinense"),
  estadual("MS", "campeonato-sul-mato-grossense", "Campeonato Sul-Mato-Grossense", "Sul-Mato-Grossense"),
  estadual("MT", "campeonato-mato-grossense", "Campeonato Mato-Grossense", "Mato-Grossense"),
  estadual("DF", "campeonato-brasiliense", "Campeonato Brasiliense", "Candangão"),
  estadual("ES", "campeonato-capixaba", "Campeonato Capixaba", "Capixaba"),
  estadual("RR", "campeonato-roraimense", "Campeonato Roraimense", "Roraimense"),
  exterior(
    "ARG",
    "primera-division-argentina",
    "Liga Profesional de Fútbol (Primera División)",
    "Liga Profesional",
  ),
  exterior(
    "BOL",
    "division-profesional-bolivia",
    "División Profesional del Fútbol Boliviano",
    "División Profesional",
  ),
  exterior("CHL", "primera-division-chile", "Campeonato Nacional de Primera División", "Primera División"),
  exterior("COL", "primera-a-colombia", "Categoría Primera A (Liga DIMAYOR)", "Primera A"),
  exterior("ECU", "serie-a-equador", "LigaPro Serie A", "LigaPro"),
  exterior("PRY", "primera-division-paraguai", "División de Honor (Primera División)", "Primera División"),
  exterior("PER", "liga-1-peru", "Liga 1", "Liga 1"),
  exterior("URY", "primera-division-uruguai", "Liga AUF Uruguaya (Primera División)", "Liga AUF"),
  exterior("VEN", "primera-division-venezuela", "Liga FUTVE (Primera División)", "Liga FUTVE"),
  {
    id: "libertadores",
    nomeOficial: "CONMEBOL Libertadores",
    nomeCurto: "Libertadores",
    categoria: "continental",
    pais: "CONMEBOL",
    noMotor: false,
  },
  {
    id: "sul-americana",
    nomeOficial: "CONMEBOL Sudamericana",
    nomeCurto: "Sul-Americana",
    categoria: "continental",
    pais: "CONMEBOL",
    noMotor: false,
  },
];

/** A Pré-Libertadores é a fase preliminar da Libertadores e usa a mesma identidade. */
export const ALIAS_DE_COMPETICAO: Readonly<Record<string, string>> = { "pre-libertadores": "libertadores" };

/** Competições do motor atual ("A".."D" e "copa") para o ID permanente. */
export const ID_DA_COMPETICAO_DO_MOTOR = {
  A: "brasileirao-serie-a",
  B: "brasileirao-serie-b",
  C: "brasileirao-serie-c",
  D: "brasileirao-serie-d",
  copa: "copa-do-brasil",
} as const satisfies Record<"A" | "B" | "C" | "D" | "copa", string>;
