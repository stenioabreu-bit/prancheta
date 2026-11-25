/** Propostas, renovação, fim de contrato, seleção e aposentadoria do atleta (mesmo mercado do modo técnico). */
import { publicarNoticia } from "../carreira/efeitos";
import { divisaoDo } from "../competicao/temporada";
import { transferir } from "../mercado/transferencias";
import { arredondar, formatarDinheiro, janelaAberta, salario } from "../mercado/valores";
import { type Rng, limitar, sortearComPeso } from "../rng";
import type { Clube, Jogador } from "../tipos";
import {
  type ContextoAtleta,
  type EfeitoAtleta,
  clubeDoAtleta,
  marcaAtiva,
  mexerVida,
  noFeed,
} from "./motor";
import type { DilemaAtleta, EstadoAtleta } from "./tipos";

/** Salário anual de mercado (€ mi) pelo overall, com a fama pesando. */
export function salarioDeMercado(j: Jogador, fama: number): number {
  return arredondar(((salario(j) * 12) / 1000) * (0.85 + fama / 160));
}

function pesoDoClube(c: Clube): number {
  return c.forca;
}

/** Clubes que poderiam querer o atleta: força parecida ou um pouco acima, mais fama = clubes maiores. */
export function clubesInteressados(c: ContextoAtleta, quantos: number, rng: Rng = c.rng, piso = 0): Clube[] {
  const { estado, j, a } = c;
  const atual = clubeDoAtleta(estado);
  const alcance = j.ovr + (a.vida.fama - 50) / 8 + (a.vida.reputacao - 50) / 12;
  const todos = Object.values(estado.temporada.clubes).filter(
    (x) =>
      x.id !== atual.id &&
      x.jogadores.length >= 16 &&
      x.forca <= alcance + 3 &&
      x.forca >= Math.max(j.ovr - 14, piso),
  );
  const escolhidos: Clube[] = [];
  const pool = [...todos];
  while (escolhidos.length < quantos && pool.length) {
    const x = sortearComPeso(rng, pool, (k) => Math.max(0.2, 12 - Math.abs(pesoDoClube(k) - alcance)));
    escolhidos.push(x);
    pool.splice(pool.indexOf(x), 1);
  }
  return escolhidos;
}

/** Proposta de transferência na janela (dados para o texto e para aceitar). */
export function montarProposta(c: ContextoAtleta): Record<string, string | number> | null {
  const { estado, j, a, rng } = c;
  if (!janelaAberta(estado.temporada.rodada)) return null;
  // Proposta de verdade: clube do mesmo porte ou maior (ou um pouco menor, se o atleta não joga) e salário melhor.
  const reserva = j.temporada.jogos < 5 && a.semana > 15;
  const [clube] = clubesInteressados(c, 1, rng, c.clube.forca - (reserva ? 8 : 3));
  if (!clube) return null;
  const sal = arredondar(
    Math.max(
      a.contrato.salario * (1.1 + rng.proximo() * 0.4),
      salarioDeMercado(j, a.vida.fama) * (1 + (clube.forca - j.ovr) / 40 + rng.proximo() * 0.3),
    ),
  );
  const anos = 2 + Math.floor(rng.proximo() * 3);
  return {
    clubeId0: clube.id,
    clube0: clube.nome,
    sal0: sal,
    salario0: formatarDinheiro(sal),
    anos,
    atual: formatarDinheiro(a.contrato.salario),
  };
}

/** Oferta de renovação no último ano de contrato; sem interesse do clube, marca a saída. */
export function montarRenovacao(c: ContextoAtleta): Record<string, string | number> | null {
  const { estado, j, a, rng } = c;
  const t = estado.temporada;
  if (a.contrato.ate !== t.temporada || t.rodada < 14) return null;
  if (marcaAtiva(a, "renovacao-tratada")) return null;
  const notas = j.notas.length ? j.notas.reduce((s, x) => s + x, 0) / j.notas.length : 6.4;
  const quer = a.vida.tecnico >= 25 && j.ovr >= c.clube.forca - 9 && notas >= 5.8;
  a.marcas["renovacao-tratada"] = a.semana + 60;
  if (!quer) {
    a.marcas["sem-renovacao"] = a.semana + 60;
    noFeed(a, `O ${c.clube.nome} avisou o empresário: não vai renovar o seu contrato.`, "ruim");
    return null;
  }
  const sal = arredondar(
    Math.max(a.contrato.salario, salarioDeMercado(j, a.vida.fama) * (0.95 + rng.proximo() * 0.2)),
  );
  return { sal, salario: formatarDinheiro(sal), anos: 2 + Math.floor(rng.proximo() * 3) };
}

/** Fim de contrato: três clubes oferecem vínculo (sempre há ao menos opções mais modestas). */
export function montarLivre(c: ContextoAtleta): Record<string, string | number> | null {
  const { j, a, estado } = c;
  const atual = clubeDoAtleta(estado);
  const interessados = clubesInteressados(c, 3);
  if (interessados.length < 3) {
    const extras = Object.values(estado.temporada.clubes)
      .filter((x) => x.id !== atual.id && !interessados.includes(x) && x.jogadores.length >= 16)
      .sort((x, y) => Math.abs(x.forca - (j.ovr - 6)) - Math.abs(y.forca - (j.ovr - 6)));
    interessados.push(...extras.slice(0, 3 - interessados.length));
  }
  const dados: Record<string, string | number> = {};
  interessados.slice(0, 3).forEach((clube, i) => {
    const sal = arredondar(salarioDeMercado(j, a.vida.fama) * (0.8 + (clube.forca - j.ovr) / 50));
    dados[`clubeId${i}`] = clube.id;
    dados[`clube${i}`] = clube.nome;
    dados[`sal${i}`] = Math.max(0.02, sal);
    dados[`salario${i}`] = formatarDinheiro(Math.max(0.02, sal));
  });
  dados.anos = 2;
  return interessados.length ? dados : null;
}

function mudarDeClube(c: ContextoAtleta, clubeId: string, sal: number, anos: number): string {
  const { estado, j, a } = c;
  const de = clubeDoAtleta(estado);
  const para = estado.temporada.clubes[clubeId];
  if (!para) return "O negócio não saiu.";
  const aumento = sal / Math.max(0.01, a.contrato.salario);
  transferir(j, de, para);
  a.contrato = { clubeId, salario: sal, ate: estado.temporada.temporada + anos };
  a.vida.tecnico = 55;
  a.vida.elenco = 50;
  a.vida.torcida = 50 + Math.round((a.vida.fama - 50) / 4);
  mexerVida(a, "moral", 8);
  if (aumento >= 1.5) a.marcas["contrato-grande"] = a.semana + 30;
  a.marcas["sem-renovacao"] = -1;
  a.marcas["renovacao-tratada"] = -1;
  const div = divisaoDo(estado.temporada, clubeId);
  publicarNoticia(
    estado.carreira,
    estado.temporada.rodada,
    "Mercado",
    `${a.nome} deixa o ${de.nome} e assina com o ${para.nome}${div ? "" : ", do exterior"} até ${a.contrato.ate}.`,
    "bom",
  );
  return `Você assinou com o ${para.nome} até ${a.contrato.ate}, ganhando ${formatarDinheiro(sal)} por ano.`;
}

/** Executa as ações especiais das opções (transferência, renovação, seleção, aposentadoria). */
export function executarAcao(c: ContextoAtleta, ef: EfeitoAtleta, dilema: DilemaAtleta): string | null {
  const { a, estado, rng } = c;
  const d = dilema.dados ?? {};
  const anos = Number(d.anos ?? 2);
  switch (ef.acao) {
    case "aceitarProposta":
      return mudarDeClube(c, String(d.clubeId0), Number(d.sal0), anos);
    case "pedirMais": {
      const p = 0.25 + a.vida.empresario / 200 + a.vida.fama / 400;
      if (rng.proximo() < p) {
        return `O empresário apertou e eles cederam. ${mudarDeClube(c, String(d.clubeId0), arredondar(Number(d.sal0) * 1.2), anos)}`;
      }
      mexerVida(a, "empresario", -4);
      return `O ${d.clube0} achou demais e retirou a proposta.`;
    }
    case "renovar":
      a.contrato.salario = Number(d.sal);
      a.contrato.ate += anos;
      mexerVida(a, "torcida", 4);
      return `Renovado até ${a.contrato.ate}, com salário de ${formatarDinheiro(a.contrato.salario)} por ano.`;
    case "pedirAumento":
      if (rng.proximo() < 0.3 + a.vida.empresario / 250 + a.vida.fama / 500) {
        a.contrato.salario = arredondar(Number(d.sal) * 1.15);
        a.contrato.ate += anos;
        return `A diretoria topou: renovado até ${a.contrato.ate} por ${formatarDinheiro(a.contrato.salario)} por ano.`;
      }
      a.marcas["sem-renovacao"] = a.semana + 60;
      mexerVida(a, "torcida", -4);
      return "A diretoria encerrou a conversa. Você sai no fim do contrato.";
    case "recusarRenovacao":
      a.marcas["sem-renovacao"] = a.semana + 60;
      return "Você recusou. Fica até o fim do contrato e depois escolhe o próximo destino.";
    case "assinarLivre": {
      const i = ef.indice ?? 0;
      return mudarDeClube(c, String(d[`clubeId${i}`]), Number(d[`sal${i}`]), anos);
    }
    case "convocacao":
      a.convocacoes++;
      return `Convocado pela ${a.convocacoes}ª vez. A família assistiu ao anúncio na TV.`;
    case "aposentar":
      aposentar(c);
      return a.posCarreira ?? "Fim de carreira.";
    case "adiarAposentadoria":
      a.marcas["adiou-aposentadoria"] = a.semana + 40;
      return "Mais uma temporada. O corpo que aguente.";
    case "reconciliar":
      if (rng.proximo() < 0.45 + a.vida.familia / 300)
        return "Vocês decidiram tentar de novo, com terapia de casal.";
      a.relacionamento = "solteiro";
      mexerVida(a, "moral", -10);
      return "Não teve volta. Cada um seguiu o seu caminho.";
    default:
      return null;
  }
}

/** Encerra a carreira e escreve o pós-carreira pelo que o atleta construiu. */
export function aposentar(c: ContextoAtleta): void {
  const { a, estado } = c;
  a.aposentado = true;
  a.dilemas = [];
  a.jogo = null;
  const jogos = a.historico.reduce((s, h) => s + h.jogos, 0);
  const gols = a.historico.reduce((s, h) => s + h.gols, 0);
  const titulos = a.historico.flatMap((h) => h.titulos).length;
  const v = a.vida;
  const destino =
    v.reputacao >= 65 && v.elenco >= 55
      ? "Virou técnico: começou nas categorias de base e diz que um dia volta ao profissional."
      : v.fama >= 65 && v.imprensa >= 50
        ? "Virou comentarista de TV, com o estilo direto que tinha em campo."
        : v.empresario >= 60 && a.dinheiro > 5
          ? "Abriu uma agência de jogadores com o antigo empresário."
          : a.dinheiro <= 0
            ? "Saiu do futebol endividado e voltou a morar com a família enquanto reorganiza a vida."
            : v.familia >= 60
              ? "Foi cuidar da família e de uma escolinha de futebol na cidade natal."
              : "Saiu de cena discretamente; aparece de vez em quando em jogos festivos.";
  a.posCarreira = `${a.nome} pendurou as chuteiras aos ${a.idade} anos: ${jogos} jogos, ${gols} gols e ${titulos} título${titulos === 1 ? "" : "s"}, com patrimônio de ${formatarDinheiro(a.dinheiro)}. ${destino}`;
  publicarNoticia(estado.carreira, estado.temporada.rodada, "Imprensa", a.posCarreira, "info");
  noFeed(a, a.posCarreira, "info");
}

/** Condição base de jogo para o atleta jogar na seleção (evento de convocação). */
export function podeSerConvocado(a: EstadoAtleta, j: Jogador): boolean {
  const nota = j.notas.length ? j.notas.reduce((s, x) => s + x, 0) / j.notas.length : 6;
  return j.ovr >= 74 && a.vida.fama >= 50 && nota >= 6.6 && limitar(a.vida.forma, 0, 100) >= 45;
}
