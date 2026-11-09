import {
  type EstadoJogo,
  type Noticia,
  dataDoHorario,
  hashTexto,
  metasDaTemporada,
  nomeDaCompeticao,
  posicaoNaTabela,
} from "@prancheta/engine";
import { useState } from "react";
import { Folha } from "../componentes/basicos";
import { useJogo } from "../estado/loja";

const REPERCUSSAO: Record<Noticia["tipo"], string[]> = {
  bom: [
    "Nos bastidores, o clima é de confiança. Dirigentes ouvidos pela reportagem falam em momento de afirmação.",
    "A torcida repercutiu bem nas redes, e a expectativa para os próximos compromissos cresceu.",
    "Pessoas próximas ao elenco descrevem um vestiário leve, com o grupo comprando a ideia do treinador.",
  ],
  ruim: [
    "O ambiente ficou carregado. Conselheiros já cobram explicações e a pressão deve aumentar nos próximos dias.",
    "Nas redes, a torcida não poupou críticas, e a diretoria evita se pronunciar oficialmente por enquanto.",
    "Internamente, o assunto é tratado com cautela: a ordem é virar a página rápido e focar no próximo jogo.",
  ],
  info: [
    "O assunto segue em pauta e novos desdobramentos são esperados ao longo da semana.",
    "Procurado, o departamento de comunicação disse que vai se manifestar no momento adequado.",
    "Analistas consideram o tema relevante para o planejamento da temporada.",
  ],
};

function data(rodada: number): string {
  const [a, m, d] = dataDoHorario(rodada, false).split("-");
  return `${d}/${m}/${a}`;
}

/** Matéria completa a partir da notícia: lide, contexto do clube na temporada e repercussão. */
function materia(jogo: EstadoJogo, n: Noticia): { titulo: string; paragrafos: string[] } {
  const t = jogo.temporada;
  const frases = n.texto.split(/(?<=[.!?])\s+/);
  const titulo = frases[0]!.replace(/[.!]$/, "");
  const paragrafos = [n.texto];
  const id = jogo.carreira.clubeId;
  const clube = id ? t.clubes[id] : null;
  if (clube && n.texto.includes(clube.nome)) {
    const pos = posicaoNaTabela(t, clube.id);
    const metas = metasDaTemporada(t, jogo.carreira);
    const contexto = metas
      .slice(0, 2)
      .map((x) => `no ${x.nome}, a meta é ${x.texto.toLowerCase()} (${x.situacao.toLowerCase()})`)
      .join("; ");
    paragrafos.push(
      `O ${clube.nome}, comandado por ${jogo.carreira.tecnico}, ${pos ? `ocupa o ${pos}º lugar na ${nomeDaCompeticao(t, t.divisoes.A.clubes.includes(clube.id) ? "A" : "B")}` : "segue a temporada"}${contexto ? `; ${contexto}` : ""}.`,
    );
  }
  const lista = REPERCUSSAO[n.tipo];
  paragrafos.push(lista[hashTexto(n.texto) % lista.length]!);
  return { titulo, paragrafos };
}

export function Noticias() {
  const jogo = useJogo();
  const [aberta, setAberta] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Noticia["tipo"] | "todas">("todas");
  const lista = jogo.carreira.noticias.filter((n) => filtro === "todas" || n.tipo === filtro);
  const n = aberta !== null ? lista[aberta] : null;
  const m = n ? materia(jogo, n) : null;
  return (
    <section className="panel stack">
      <h2>Notícias</h2>
      <div className="filters" role="group" aria-label="Filtro de notícias">
        {(
          [
            ["todas", "Todas"],
            ["bom", "Boas"],
            ["ruim", "Ruins"],
            ["info", "Gerais"],
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            type="button"
            className="chip"
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            {nome}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="vazio">Nada por enquanto.</p>
      ) : (
        <div className="news">
          <ul>
            {lista.map((x, i) => (
              <li key={`${x.rodada}-${i}`} className={x.tipo}>
                <button type="button" className="link" onClick={() => setAberta(i)} style={{ width: "100%" }}>
                  <div className="de">
                    {x.de} · {data(x.rodada)}
                  </div>
                  <div className="small">{x.texto}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {n && m && (
        <Folha titulo={n.de} aoFechar={() => setAberta(null)}>
          <span className="small muted">
            {data(n.rodada)} · rodada {n.rodada + 1}
          </span>
          <h2 style={{ margin: "4px 0 8px" }}>{m.titulo}</h2>
          {m.paragrafos.map((p) => (
            <p key={p} style={{ margin: "0 0 10px", lineHeight: 1.55 }}>
              {p}
            </p>
          ))}
        </Folha>
      )}
    </section>
  );
}
