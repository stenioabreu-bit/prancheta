/**
 * Constantes de calibração do motor, num lugar só. Mudou algum valor, rode
 * `npm run calibrar` e os testes estatísticos (packages/engine/test/calibracao.test.ts).
 * Para testar sem editar: `npm run calibrar -- --ajustes '{"partida":{"chanceBase":0.2}}'`.
 *
 * Calibrado contra a Série A de 2019 a 2025 (football-data.co.uk). O valor do
 * protótipo original está no comentário de cada campo.
 */
export const AJUSTES = {
  partida: {
    /** Multiplica a chance de lance do mandante e divide a do visitante. Protótipo: 1 (só +2% de posse). */
    vantagemMandante: 1.16,
    /** Chance de lance perigoso por minuto com razão 1. Protótipo: 0,19. */
    chanceBase: 0.215,
    /**
     * Expoente da razão ataque/defesa na chance de lance. Protótipo: 2,1, que fazia
     * a diferença de força decidir demais (campeão com ~94 pontos, 10% de goleadas).
     */
    expoenteRazao: 0.5,
    /**
     * Expoente da mentalidade (ataque do lado com a bola / defesa do outro) na chance de lance.
     * Separado da força para a decisão do técnico continuar pesando. Protótipo: 2,1 (junto com a força).
     */
    expoenteTatica: 2.1,
    /** Quanto a diferença ataque − defesa mexe no xG: xg·(1 + (A − D)/escala). Protótipo: 120. */
    escalaXgPorForca: 600,
    /** Expoente da finalização na probabilidade de gol. Protótipo: 1,6. */
    expoenteFinalizacaoNoGol: 0.7,
    /**
     * Sorteio do finalizador: (peso da posição^expoente + base)·(FIN/60)^expoenteFin.
     * Protótipo: 2; 0,07; 2, que dava ~40% dos gols do time ao centroavante (artilheiro com ~37).
     */
    expoentePesoPosicao: 1,
    basePesoPosicao: 0.1,
    expoenteFinalizador: 1,
    /** Chance de falta por minuto sem lance perigoso (~26 faltas por jogo). Protótipo: 0,13. */
    chanceFalta: 0.27,
    /** Chance de cartão numa falta (antes de temperamento, pressão e desarme). Protótipo: 0,11. */
    chanceCartao: 0.165,
    /** Fração dos cartões que já sai vermelho direto. Protótipo: 0,04. */
    chanceVermelhoDireto: 0.01,
    /** Quem já tem amarelo se cuida: multiplica a chance de cartão dele. Protótipo: 1. */
    cautelaComAmarelo: 0.3,
    /** Posse: 0,5 + (meio do mandante − meio do visitante)/escala. Protótipo: 70. */
    escalaPossePorMeio: 120,
  },
  simulacaoRapida: {
    /** λ = base·e^(±diferença de força/escala). Protótipo: 1,32 / 1,067 / 11. */
    golsMandante: 1.4,
    golsVisitante: 0.99,
    escalaForca: 20,
    /** Peso do artilheiro nas estatísticas rápidas: (FIN/60)^expoente. Protótipo: 1,6. */
    expoenteFinalizador: 1,
  },
};

export type Ajustes = typeof AJUSTES;
