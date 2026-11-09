/**
 * Base financeira inicial 2026 (€ milhões), pela documentação do projeto: valor do elenco (referência de
 * mercado) e orçamento de contratações (estimativa de gameplay). Séries A e B e primeira divisão dos
 * outros 9 países. Godoy Cruz, Alianza Valledupar e Universidad Central não estão nos pacotes.
 */
export interface SeedFinanceiro {
  valorElenco: number;
  orcamento: number;
}

export const FINANCAS_2026: Readonly<Record<string, SeedFinanceiro>> = {
  palmeiras: { valorElenco: 229.48, orcamento: 18.0 }, // Palmeiras
  flamengo: { valorElenco: 213.45, orcamento: 22.0 }, // Flamengo
  cruzeiro: { valorElenco: 174.05, orcamento: 7.0 }, // Cruzeiro
  corinthians: { valorElenco: 150.3, orcamento: 1.5 }, // Corinthians
  botafogo: { valorElenco: 125.05, orcamento: 4.0 }, // Botafogo
  bahia: { valorElenco: 120.6, orcamento: 8.0 }, // Bahia
  fluminense: { valorElenco: 118.03, orcamento: 4.0 }, // Fluminense
  gremio: { valorElenco: 111.35, orcamento: 3.0 }, // Grêmio
  vasco: { valorElenco: 107.4, orcamento: 2.0 }, // Vasco
  santos: { valorElenco: 99.0, orcamento: 2.0 }, // Santos
  bragantino: { valorElenco: 94.55, orcamento: 10.0 }, // RB Bragantino
  "atletico-mg": { valorElenco: 87.1, orcamento: 1.0 }, // Atlético-MG
  "sao-paulo": { valorElenco: 79.5, orcamento: 2.0 }, // São Paulo
  internacional: { valorElenco: 72.4, orcamento: 2.5 }, // Internacional
  "athletico-pr": { valorElenco: 71.48, orcamento: 5.0 }, // Athletico-PR
  vitoria: { valorElenco: 41.73, orcamento: 0.8 }, // Vitória
  coritiba: { valorElenco: 41.6, orcamento: 0.5 }, // Coritiba
  mirassol: { valorElenco: 32.38, orcamento: 2.0 }, // Mirassol
  remo: { valorElenco: 28.08, orcamento: 0.5 }, // Remo
  chapecoense: { valorElenco: 18.93, orcamento: 0.3 }, // Chapecoense
  fortaleza: { valorElenco: 36.0, orcamento: 3.5 }, // Fortaleza
  sport: { valorElenco: 25.3, orcamento: 0.7 }, // Sport
  ceara: { valorElenco: 16.78, orcamento: 2.0 }, // Ceará
  juventude: { valorElenco: 13.23, orcamento: 1.0 }, // Juventude
  novorizontino: { valorElenco: 13.03, orcamento: 1.5 }, // Novorizontino
  goias: { valorElenco: 12.9, orcamento: 2.0 }, // Goiás
  criciuma: { valorElenco: 11.93, orcamento: 0.8 }, // Criciúma
  crb: { valorElenco: 11.85, orcamento: 1.2 }, // CRB
  athletic: { valorElenco: 10.78, orcamento: 0.8 }, // Athletic
  cuiaba: { valorElenco: 10.43, orcamento: 2.0 }, // Cuiabá
  avai: { valorElenco: 9.98, orcamento: 0.5 }, // Avaí
  "vila-nova": { valorElenco: 9.55, orcamento: 0.5 }, // Vila Nova
  "america-mg": { valorElenco: 9.55, orcamento: 1.0 }, // América-MG
  "operario-pr": { valorElenco: 9.18, orcamento: 0.5 }, // Operário-PR
  "atletico-go": { valorElenco: 9.03, orcamento: 1.0 }, // Atlético-GO
  "sao-bernardo": { valorElenco: 8.55, orcamento: 0.4 }, // São Bernardo
  "ponte-preta": { valorElenco: 8.15, orcamento: 0.2 }, // Ponte Preta
  "botafogo-sp": { valorElenco: 6.8, orcamento: 0.3 }, // Botafogo-SP
  nautico: { valorElenco: 6.1, orcamento: 0.2 }, // Náutico
  londrina: { valorElenco: 5.5, orcamento: 0.3 }, // Londrina
  "river-plate": { valorElenco: 109.18, orcamento: 10.0 }, // River Plate
  "boca-juniors": { valorElenco: 100.18, orcamento: 9.0 }, // Boca Juniors
  "racing-club": { valorElenco: 70.0, orcamento: 4.0 }, // Racing Club
  independiente: { valorElenco: 27.9, orcamento: 1.5 }, // Independiente
  "san-lorenzo": { valorElenco: 27.6, orcamento: 0.5 }, // San Lorenzo
  estudiantes: { valorElenco: 30.4, orcamento: 3.0 }, // Estudiantes
  "velez-sarsfield": { valorElenco: 28.9, orcamento: 2.5 }, // Vélez Sarsfield
  talleres: { valorElenco: 22.8, orcamento: 3.5 }, // Talleres
  lanus: { valorElenco: 32.1, orcamento: 2.0 }, // Lanús
  "rosario-central": { valorElenco: 58.0, orcamento: 2.0 }, // Rosario Central
  "newell-s-old-boys": { valorElenco: 23.1, orcamento: 0.7 }, // Newell's Old Boys
  huracan: { valorElenco: 28.4, orcamento: 1.0 }, // Huracán
  "argentinos-juniors": { valorElenco: 50.3, orcamento: 2.5 }, // Argentinos Juniors
  "platense-6658": { valorElenco: 20.6, orcamento: 0.8 }, // Platense
  belgrano: { valorElenco: 18.8, orcamento: 1.2 }, // Belgrano
  "defensa-y-justicia": { valorElenco: 35.8, orcamento: 1.2 }, // Defensa y Justicia
  bolivar: { valorElenco: 9.93, orcamento: 2.0 }, // Bolívar
  "blooming-2381": { valorElenco: 9.03, orcamento: 1.0 }, // Blooming
  "always-ready": { valorElenco: 7.33, orcamento: 1.5 }, // Always Ready
  "the-strongest": { valorElenco: 6.38, orcamento: 1.2 }, // The Strongest
  "san-antonio-bulo-bulo-305479": { valorElenco: 6.08, orcamento: 0.4 }, // San Antonio Bulo Bulo
  "guabira-2382": { valorElenco: 6.07, orcamento: 0.3 }, // Guabirá
  "nacional-potosi-23446": { valorElenco: 5.95, orcamento: 0.5 }, // Nacional Potosí
  "oriente-petrolero-2375": { valorElenco: 5.94, orcamento: 0.5 }, // Oriente Petrolero
  "aurora-2374": { valorElenco: 4.49, orcamento: 0.4 }, // Aurora
  "real-tomayapo-258677": { valorElenco: 4.41, orcamento: 0.3 }, // Real Tomayapo
  "colo-colo": { valorElenco: 14.1, orcamento: 3.5 }, // Colo-Colo
  "universidad-de-chile-2273": { valorElenco: 20.5, orcamento: 3.0 }, // Universidad de Chile
  "univ-catolica": { valorElenco: 16.9, orcamento: 2.5 }, // Universidad Católica
  "coquimbo-unido-2264": { valorElenco: 14.1, orcamento: 1.0 }, // Coquimbo Unido
  "o-higgins-2280": { valorElenco: 13.4, orcamento: 0.8 }, // O'Higgins
  "audax-italiano-2260": { valorElenco: 10.3, orcamento: 0.7 }, // Audax Italiano
  "palestino-2266": { valorElenco: 9.7, orcamento: 0.8 }, // Palestino
  everton: { valorElenco: 9.5, orcamento: 0.7 }, // Everton
  "univ-concepcion-2271": { valorElenco: 8.8, orcamento: 0.5 }, // Universidad de Concepción
  "deportes-limache-212896": { valorElenco: 8.2, orcamento: 0.3 }, // Deportes Limache
  "huachipato-2265": { valorElenco: 7.8, orcamento: 0.8 }, // Huachipato
  "la-serena-2287": { valorElenco: 7.5, orcamento: 0.4 }, // Deportes La Serena
  "nublense-9509": { valorElenco: 7.3, orcamento: 0.5 }, // Ñublense
  "union-la-calera": { valorElenco: 6.9, orcamento: 0.5 }, // Unión La Calera
  "cobresal-2262": { valorElenco: 5.8, orcamento: 0.5 }, // Cobresal
  "deportes-concepcion-2290": { valorElenco: 5.3, orcamento: 0.3 }, // Deportes Concepción
  "atletico-nacional": { valorElenco: 19.0, orcamento: 3.0 }, // Atlético Nacional
  tolima: { valorElenco: 14.2, orcamento: 1.5 }, // Deportes Tolima
  "junior-barranquilla": { valorElenco: 13.6, orcamento: 2.0 }, // Junior
  "america-de-cali": { valorElenco: 12.4, orcamento: 1.5 }, // América de Cali
  "santa-fe-2302": { valorElenco: 10.3, orcamento: 1.2 }, // Santa Fe
  "independiente-medellin": { valorElenco: 10.2, orcamento: 1.2 }, // Independiente Medellín
  "atletico-bucaramanga-2293": { valorElenco: 9.6, orcamento: 0.8 }, // Atlético Bucaramanga
  millonarios: { valorElenco: 9.0, orcamento: 2.0 }, // Millonarios
  "once-caldas-2299": { valorElenco: 8.3, orcamento: 0.7 }, // Once Caldas
  "la-equidad": { valorElenco: 8.2, orcamento: 0.5 }, // Internacional de Bogotá
  "deportivo-cali": { valorElenco: 8.2, orcamento: 0.3 }, // Deportivo Cali
  "fortaleza-fc-68302": { valorElenco: 7.3, orcamento: 0.5 }, // Fortaleza CEIF
  "rionegro-aguilas-28466": { valorElenco: 7.0, orcamento: 0.6 }, // Águilas Doradas
  "deportivo-pasto-2308": { valorElenco: 6.9, orcamento: 0.3 }, // Deportivo Pasto
  "cucuta-deportivo-2311": { valorElenco: 6.3, orcamento: 0.3 }, // Cúcuta Deportivo
  "llaneros-84114": { valorElenco: 6.0, orcamento: 0.3 }, // Llaneros
  "deportivo-pereira": { valorElenco: 4.9, orcamento: 0.4 }, // Deportivo Pereira
  "boyaca-chico-2309": { valorElenco: 4.5, orcamento: 0.2 }, // Boyacá Chicó
  "jaguares-de-cordoba-84113": { valorElenco: 3.6, orcamento: 0.2 }, // Jaguares de Córdoba
  "independiente-del-valle": { valorElenco: 33.48, orcamento: 4.0 }, // Independiente del Valle
  "ldu-quito": { valorElenco: 25.0, orcamento: 2.5 }, // LDU Quito
  "barcelona-sc": { valorElenco: 17.33, orcamento: 2.0 }, // Barcelona SC
  emelec: { valorElenco: 15.0, orcamento: 0.7 }, // Emelec
  "universidad-catolica-13813": { valorElenco: 12.0, orcamento: 1.0 }, // Universidad Católica
  "aucas-2368": { valorElenco: 10.0, orcamento: 0.8 }, // Aucas
  "cerro-porteno": { valorElenco: 29.48, orcamento: 3.0 }, // Cerro Porteño
  olimpia: { valorElenco: 27.75, orcamento: 2.5 }, // Olimpia
  libertad: { valorElenco: 20.0, orcamento: 2.5 }, // Libertad
  "guarani-2329": { valorElenco: 13.5, orcamento: 1.0 }, // Guaraní
  nacional: { valorElenco: 7.65, orcamento: 0.5 }, // Nacional
  "recoleta-2341": { valorElenco: 6.0, orcamento: 0.3 }, // Recoleta
  "sportivo-ameliano-108830": { valorElenco: 5.9, orcamento: 0.4 }, // Sportivo Ameliano
  "sportivo-trinidense-2347": { valorElenco: 5.4, orcamento: 0.3 }, // Trinidense
  "2-de-mayo-9718": { valorElenco: 5.15, orcamento: 0.3 }, // 2 de Mayo
  "rubio-nu-22757": { valorElenco: 4.83, orcamento: 0.3 }, // Rubio Ñú
  "sportivo-luqueno-2335": { valorElenco: 4.7, orcamento: 0.4 }, // Sportivo Luqueño
  "san-lorenzo-2346": { valorElenco: 2.65, orcamento: 0.2 }, // San Lorenzo
  "universitario-2350": { valorElenco: 14.13, orcamento: 1.5 }, // Universitario
  "alianza-lima-2349": { valorElenco: 12.9, orcamento: 1.8 }, // Alianza Lima
  "sporting-cristal": { valorElenco: 12.78, orcamento: 1.5 }, // Sporting Cristal
  "fbc-melgar": { valorElenco: 9.5, orcamento: 0.8 }, // Melgar
  "cienciano-2353": { valorElenco: 7.5, orcamento: 0.5 }, // Cienciano
  penarol: { valorElenco: 42.28, orcamento: 2.5 }, // Peñarol
  "nacional-2393": { valorElenco: 23.0, orcamento: 2.5 }, // Nacional
  "defensor-sporting-2386": { valorElenco: 9.0, orcamento: 0.7 }, // Defensor Sporting
  "liverpool-montevideo": { valorElenco: 8.0, orcamento: 0.8 }, // Liverpool Montevideo
  "boston-river": { valorElenco: 6.0, orcamento: 0.4 }, // Boston River
  "danubio-2388": { valorElenco: 4.5, orcamento: 0.4 }, // Danubio
  "racing-2396": { valorElenco: 4.0, orcamento: 0.4 }, // Racing Montevideo
  "cerro-largo-16153": { valorElenco: 3.5, orcamento: 0.3 }, // Cerro Largo
  "montevideo-wanderers-2390": { valorElenco: 3.0, orcamento: 0.3 }, // Wanderers
  "deportivo-tachira": { valorElenco: 12.0, orcamento: 0.8 }, // Deportivo Táchira
  "caracas-fc": { valorElenco: 11.0, orcamento: 0.8 }, // Caracas FC
  "carabobo-2405": { valorElenco: 9.0, orcamento: 0.6 }, // Carabobo
  "metropolitanos-fc": { valorElenco: 8.0, orcamento: 0.5 }, // Metropolitanos
  "monagas-sc-2408": { valorElenco: 7.0, orcamento: 0.5 }, // Monagas
  "dep-la-guaira-15415": { valorElenco: 6.0, orcamento: 0.5 }, // Deportivo La Guaira
  "portuguesa-fc-13759": { valorElenco: 5.0, orcamento: 0.3 }, // Portuguesa
};
