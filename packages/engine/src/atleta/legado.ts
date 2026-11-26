/**
 * Legado da carreira para a tela da aposentadoria: patamar (de "Jornada honesta" a "O maior de todos
 * os tempos"), a distância até o topo da história, rótulos da vida (fiel a um clube, polêmico,
 * endividado...), a trajetória por clube, a melhor temporada e uma frase de despedida.
 */
import type { EstadoJogo } from "../carreira/jogo";
import type { EstadoAtleta } from "./tipos";

export type IdPatamar = "goat" | "lenda" | "idolo" | "craque" | "solida" | "honesta";

export interface MetaDaHistoria {
  rotulo: string;
  valor: number;
  meta: number;
}

export interface PassagemPorClube {
  clubeId: string;
  nome: string;
  de: number;
  ate: number;
  jogos: number;
  gols: number;
  titulos: number;
}

export interface LegadoDaCarreira {
  patamar: { id: IdPatamar; nome: string; frase: string };
  /** 0–100: o quanto chegou perto dos maiores da história. */
  pontos: number;
  metas: MetaDaHistoria[];
  rotulos: string[];
  clubes: PassagemPorClube[];
  melhorTemporada: {
    temporada: number;
    clube: string;
    gols: number;
    assist: number;
    nota: number | null;
  } | null;
  numeros: {
    jogos: number;
    gols: number;
    assist: number;
    titulos: number;
    premios: number;
    bolas: number;
    copasDoMundo: number;
    melhorOvr: number;
  };
}

const NOMES: Record<IdPatamar, string> = {
  goat: "O maior de todos os tempos",
  lenda: "Lenda",
  idolo: "Ídolo",
  craque: "Craque",
  solida: "Carreira sólida",
  honesta: "Jornada honesta",
};

/** O topo da história do futebol, em números (gols para quem joga do meio para a frente). */
const METAS = { gols: 800, bolas: 8, titulos: 40, copa: 1, ovr: 94 };
const ATACANTES = ["ATA", "PD", "PE", "MEI"];

function patamar(n: LegadoDaCarreira["numeros"], atacante: boolean): IdPatamar {
  if (
    n.melhorOvr >= 90 &&
    (n.bolas >= 5 || (n.bolas >= 3 && n.titulos >= 25 && (!atacante || n.gols >= 600)))
  )
    return "goat";
  if (n.bolas >= 1 || (n.melhorOvr >= 90 && n.titulos >= 8)) return "lenda";
  if (n.melhorOvr >= 85 || n.titulos >= 6 || n.gols >= 300) return "idolo";
  if (n.melhorOvr >= 80) return "craque";
  if (n.jogos >= 350) return "solida";
  return "honesta";
}

function frase(id: IdPatamar, a: EstadoAtleta, rotulos: string[], clubeDoCoracao: string | null): string {
  const nome = a.nome;
  switch (id) {
    case "goat":
      return `Não existe discussão: ${nome} é o maior que já pisou num gramado. Daqui a cem anos ainda vão comparar os outros com ele.`;
    case "lenda":
      return clubeDoCoracao
        ? `${nome} entrou para a história do futebol mundial, e a torcida do ${clubeDoCoracao} nunca vai deixar ninguém esquecer.`
        : `${nome} entrou para a história do futebol mundial. Poucos chegaram onde ele chegou.`;
    case "idolo":
      return clubeDoCoracao
        ? `No ${clubeDoCoracao}, ${nome} virou estátua, nome de arquibancada e camisa aposentada.`
        : `${nome} foi daqueles que lotavam estádios por onde passavam.`;
    case "craque":
      return rotulos.includes("Polêmico")
        ? `Um craque de verdade, com tanto talento quanto confusão. Faltou pouco para ser gigante.`
        : `Um craque de verdade. Faltou um pouco de sorte, ou de cabeça, para ser gigante.`;
    case "solida":
      return `${nome} foi o jogador que todo técnico queria ter: sério, regular e presente.`;
    default:
      return `Nem todo sonho vira taça, mas ${nome} viveu do futebol e saiu de cabeça erguida.`;
  }
}

/** Monta o legado a partir do histórico, das conquistas e das escolhas do atleta. */
export function legadoDaCarreira(estado: EstadoJogo): LegadoDaCarreira {
  const a = estado.atleta!;
  const t = estado.temporada;
  const conquistas = a.conquistas ?? [];
  const numeros = {
    jogos: a.historico.reduce((s, h) => s + h.jogos, 0),
    gols: a.historico.reduce((s, h) => s + h.gols, 0),
    assist: a.historico.reduce((s, h) => s + h.assist, 0),
    titulos: conquistas.length
      ? conquistas.filter((x) => x.tipo === "titulo").length
      : a.historico.flatMap((h) => h.titulos).length,
    premios: conquistas.filter((x) => x.tipo === "premio").length,
    bolas: conquistas.filter((x) => x.chave === "bola-de-ouro").length,
    copasDoMundo: conquistas.filter((x) => x.chave === "copa-do-mundo").length,
    melhorOvr: Math.max(0, ...a.historico.map((h) => h.ovr)),
  };
  const atacante = ATACANTES.includes(a.pos);

  // Trajetória: passagens seguidas pelo mesmo clube viram uma linha.
  const clubes: PassagemPorClube[] = [];
  for (const h of a.historico) {
    const ultima = clubes.at(-1);
    if (ultima && ultima.clubeId === h.clubeId) {
      ultima.ate = h.temporada;
      ultima.jogos += h.jogos;
      ultima.gols += h.gols;
      ultima.titulos += h.titulos.length;
    } else {
      clubes.push({
        clubeId: h.clubeId,
        nome: t.clubes[h.clubeId]?.nome ?? h.clubeId,
        de: h.temporada,
        ate: h.temporada,
        jogos: h.jogos,
        gols: h.gols,
        titulos: h.titulos.length,
      });
    }
  }
  const porClube = new Map<string, { nome: string; jogos: number; titulos: number }>();
  for (const c of clubes) {
    const x = porClube.get(c.clubeId) ?? { nome: c.nome, jogos: 0, titulos: 0 };
    x.jogos += c.jogos;
    x.titulos += c.titulos;
    porClube.set(c.clubeId, x);
  }
  const casa = [...porClube.values()].sort(
    (x, y) => y.jogos + y.titulos * 20 - (x.jogos + x.titulos * 20),
  )[0];
  const clubeDoCoracao = casa && casa.jogos >= Math.max(150, numeros.jogos * 0.35) ? casa.nome : null;

  // Rótulos da vida: o que a carreira e as escolhas deixaram.
  const vezes = a.vezes ?? {};
  const escandalos =
    (vezes["operacao-policial"] ?? 0) +
    (vezes.antidoping ?? 0) +
    (vezes["vestiario-descobre"] ?? 0) +
    (vezes["confusao-na-boate"] ?? 0) +
    (vezes["blitz-da-lei-seca"] ?? 0);
  const rotulos: string[] = [];
  if (clubeDoCoracao) rotulos.push(`Ídolo do ${clubeDoCoracao}`);
  if (porClube.size >= 8) rotulos.push("Rodou o mundo");
  if (porClube.size <= 2 && numeros.jogos >= 300) rotulos.push("Fiel às origens");
  if (numeros.copasDoMundo)
    rotulos.push(numeros.copasDoMundo > 1 ? `${numeros.copasDoMundo}× campeão do mundo` : "Campeão do mundo");
  if ((a.selecao?.jogos ?? 0) >= 80) rotulos.push("Pilar da seleção");
  if (a.hatTricks && a.hatTricks >= 10) rotulos.push(`${a.hatTricks} hat-tricks`);
  if (escandalos >= 2 || a.vida.reputacao < 35) rotulos.push("Polêmico");
  if (a.vida.vicios >= 45) rotulos.push("Bad boy");
  if (a.filhos >= 2 && a.vida.familia >= 60) rotulos.push("Pai de família");
  if (a.dinheiro <= 0) rotulos.push("Terminou endividado");
  else if (a.dinheiro >= (a.contrato.salario || 1) * 12) rotulos.push("Milionário");
  if (a.vida.torcida >= 80) rotulos.push("Amado pela torcida");
  if (a.idade >= 39) rotulos.push("Jogou até os 40");

  const melhor = [...a.historico].sort(
    (x, y) => y.gols + y.assist * 0.6 + (y.nota ?? 6) * 3 - (x.gols + x.assist * 0.6 + (x.nota ?? 6) * 3),
  )[0];
  const melhorTemporada = melhor
    ? {
        temporada: melhor.temporada,
        clube: t.clubes[melhor.clubeId]?.nome ?? melhor.clubeId,
        gols: melhor.gols,
        assist: melhor.assist,
        nota: melhor.nota,
      }
    : null;

  const metas: MetaDaHistoria[] = [
    atacante
      ? { rotulo: "Gols", valor: numeros.gols, meta: METAS.gols }
      : { rotulo: "Jogos", valor: numeros.jogos, meta: 1000 },
    { rotulo: "Bolas de Ouro", valor: numeros.bolas, meta: METAS.bolas },
    { rotulo: "Títulos", valor: numeros.titulos, meta: METAS.titulos },
    { rotulo: "Copa do Mundo", valor: numeros.copasDoMundo, meta: METAS.copa },
    { rotulo: "Melhor overall", valor: numeros.melhorOvr, meta: METAS.ovr },
  ];
  const fracao = (m: MetaDaHistoria) =>
    m.rotulo === "Melhor overall"
      ? Math.max(0, Math.min(1, (m.valor - 70) / (m.meta - 70)))
      : Math.min(1, m.valor / m.meta);
  const pontos = Math.round((metas.reduce((s, m) => s + fracao(m), 0) / metas.length) * 100);
  const id = patamar(numeros, atacante);
  return {
    patamar: { id, nome: NOMES[id], frase: frase(id, a, rotulos, clubeDoCoracao) },
    pontos,
    metas,
    rotulos,
    clubes,
    melhorTemporada,
    numeros,
  };
}
