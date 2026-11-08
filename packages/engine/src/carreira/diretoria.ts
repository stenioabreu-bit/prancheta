import { classificacaoDoGrupo } from "../competicao/fases";
import { type EstadoTemporada, divisaoDo } from "../competicao/temporada";
import type { Divisao } from "../competicao/tipos";
import { limitar } from "../rng";
import { enviarMensagem, publicarNoticia } from "./efeitos";
import type { EstadoCarreira, Meta } from "./tipos";

export function ehClassico(carreira: EstadoCarreira, a: string, b: string): boolean {
  return carreira.classicos.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Posição do clube no grupo da fase de liga em andamento (ou da última disputada). */
export function posicaoNaTabela(estado: EstadoTemporada, clubeId: string): number | null {
  const d = divisaoDo(estado, clubeId);
  if (!d) return null;
  const fases = estado.divisoes[d].fases.filter((f) => f.tipo === "liga");
  for (let i = fases.length - 1; i >= 0; i--) {
    const f = fases[i]!;
    if (f.tipo !== "liga") continue;
    const g = f.grupos.findIndex((grupo) => grupo.includes(clubeId));
    if (g >= 0) return classificacaoDoGrupo(f, g).indexOf(clubeId) + 1;
  }
  return null;
}

/** Meta da diretoria pela força do clube dentro da divisão (regras do protótipo). */
export function metaDaTemporada(estado: EstadoTemporada, clubeId: string): Meta {
  const d: Divisao = divisaoDo(estado, clubeId) ?? "D";
  const ids = estado.divisoes[d].clubes;
  const ranking = ids.slice().sort((a, b) => estado.clubes[b]!.forca - estado.clubes[a]!.forca);
  const r = ranking.indexOf(clubeId) + 1;
  if (d === "A") {
    if (r <= 4) return { texto: "Brigar pelo G-4", posicao: 4 };
    if (r <= 8) return { texto: "Classificar para a Libertadores (G-6)", posicao: 6 };
    if (r <= 13) return { texto: "Terminar entre os 12 primeiros (Sul-Americana)", posicao: 12 };
    return { texto: "Escapar do rebaixamento", posicao: 16 };
  }
  if (d === "B") {
    if (r <= 6) return { texto: "Conquistar o acesso (G-4)", posicao: 4 };
    if (r <= 14) return { texto: "Brigar na parte de cima da tabela", posicao: 8 };
    return { texto: "Escapar do rebaixamento", posicao: 16 };
  }
  if (d === "C") return { texto: "Classificar para a segunda fase (G-8)", posicao: 8 };
  return { texto: "Passar da fase de grupos (top 4 do grupo)", posicao: 4 };
}

/** Pontos esperados pela diferença de força e pelo mando. */
export function pontosEsperados(forcaPropria: number, forcaAdversario: number, mandante: boolean): number {
  const g = forcaPropria - forcaAdversario + (mandante ? 1.5 : -1.5);
  const vitoria = limitar(0.38 + g * 0.035, 0.08, 0.8);
  return 3 * vitoria + 0.27;
}

/**
 * Reação da diretoria e da torcida a um jogo de liga do usuário: resultado contra
 * a expectativa, posição contra a meta (a partir da 6ª rodada) e peso extra no clássico.
 * Diretoria em 12 ou menos a partir da 6ª rodada = demissão.
 */
export function reagirAoJogoDaLiga(
  carreira: EstadoCarreira,
  estado: EstadoTemporada,
  adversarioId: string,
  mandante: boolean,
  golsPro: number,
  golsContra: number,
): void {
  const clubeId = carreira.clubeId!;
  const rodada = estado.rodada;
  const pontos = golsPro > golsContra ? 3 : golsPro === golsContra ? 1 : 0;
  const esperado = pontosEsperados(
    estado.clubes[clubeId]!.forca,
    estado.clubes[adversarioId]!.forca,
    mandante,
  );
  let delta = (pontos - esperado) * 4.2;
  const posicao = posicaoNaTabela(estado, clubeId);
  if (rodada >= 5 && posicao !== null) delta += (carreira.meta.posicao - posicao) * 0.35;
  const classico = ehClassico(carreira, clubeId, adversarioId);
  if (classico) delta *= 1.5;
  carreira.diretoria = limitar(Math.round(carreira.diretoria + delta), 0, 100);
  const bonusClassico = classico ? (pontos === 3 ? 6 : pontos === 0 ? -6 : 0) : 0;
  carreira.torcida = limitar(Math.round(carreira.torcida + (pontos - esperado) * 5 + bonusClassico), 0, 100);
  const nomeAdv = estado.clubes[adversarioId]!.nome;
  if (classico && pontos === 3) {
    publicarNoticia(
      carreira,
      rodada,
      "Torcida",
      `Festa da torcida depois da vitória no clássico contra o ${nomeAdv}.`,
      "bom",
    );
  }
  if (classico && pontos === 0) {
    publicarNoticia(
      carreira,
      rodada,
      "Torcida",
      `Derrota no clássico para o ${nomeAdv} revolta a torcida. Protesto marcado para o próximo treino.`,
      "ruim",
    );
  }
  if (carreira.diretoria < 30 && !carreira.avisoDeRisco) {
    carreira.avisoDeRisco = true;
    publicarNoticia(
      carreira,
      rodada,
      "Diretoria",
      "O presidente deixou claro em reunião: o cargo está em risco se os resultados não mudarem logo.",
      "ruim",
    );
  }
  if (carreira.diretoria >= 45) carreira.avisoDeRisco = false;
  if (carreira.diretoria <= 12 && rodada >= 5) demitir(carreira, rodada);
}

export function demitir(carreira: EstadoCarreira, rodada: number): void {
  carreira.clubeId = null;
  publicarNoticia(
    carreira,
    rodada,
    "Diretoria",
    "Você foi demitido. A diretoria agradece os serviços prestados.",
    "ruim",
  );
}

/** Reação ao fim de um confronto de Copa do usuário. */
export function reagirAoConfrontoDaCopa(
  carreira: EstadoCarreira,
  estado: EstadoTemporada,
  indiceDaFase: number,
  adversarioId: string,
  passou: boolean,
  placar: string,
  campeao: boolean,
): void {
  const rodada = estado.rodada;
  const clube = estado.clubes[carreira.clubeId!]!;
  const adv = estado.clubes[adversarioId]!;
  if (passou) {
    carreira.diretoria = limitar(carreira.diretoria + 2 + indiceDaFase, 0, 100);
    carreira.torcida = limitar(carreira.torcida + 2 + indiceDaFase, 0, 100);
    carreira.reputacao = limitar(carreira.reputacao + 0.5 + indiceDaFase * 0.4, 0, 100);
    if (campeao) {
      carreira.diretoria = limitar(carreira.diretoria + 20, 0, 100);
      carreira.torcida = 100;
      carreira.reputacao = limitar(carreira.reputacao + 12, 0, 100);
      publicarNoticia(
        carreira,
        rodada,
        "Copa do Brasil",
        `${clube.nome} é campeão da Copa do Brasil ${estado.temporada}!`,
        "bom",
      );
      enviarMensagem(carreira, rodada, {
        de: "Presidência",
        assunto: "Campeões da Copa do Brasil!",
        texto: "Título histórico, vaga na Libertadores e premiação no caixa. Obrigado, professor.",
      });
    } else {
      publicarNoticia(
        carreira,
        rodada,
        "Copa do Brasil",
        `${clube.nome} elimina o ${adv.nome} (${placar}) e avança.`,
        "bom",
      );
    }
    return;
  }
  const ordem: Record<Divisao, number> = { A: 0, B: 1, C: 2, D: 3 };
  const zebra = ordem[divisaoDo(estado, adversarioId) ?? "D"] > ordem[divisaoDo(estado, clube.id) ?? "D"];
  const perda = zebra ? 8 : 3;
  carreira.diretoria = limitar(carreira.diretoria - perda, 0, 100);
  carreira.torcida = limitar(carreira.torcida - perda, 0, 100);
  publicarNoticia(
    carreira,
    rodada,
    "Copa do Brasil",
    `${clube.nome} cai para o ${adv.nome} (${placar}).${zebra ? " Eliminação para time de divisão inferior irrita a torcida." : ""}`,
    "ruim",
  );
}
