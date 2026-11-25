import {
  ATRIBUTOS,
  type CampoVida,
  type DilemaAtleta,
  type EstadoJogo,
  type JogoDoAtleta,
  type RitmoAtleta,
  avancarAtleta,
  clubeDoAtleta,
  criarRng,
  dataDoJogo,
  decidirDilema,
  decidirEscalacao,
  escolherLance,
  formatarDinheiro,
  jogadorDoAtleta,
  lancesPendentes,
  mudarRitmo,
  mudarRotina,
  nomeDaCompeticao,
  notaDaTemporada,
  pendenciaDoAtleta,
  propostasDeTecnico,
  salarioSemanal,
  terminarJogoDoAtleta,
  virarTecnico,
} from "@prancheta/engine";
import { useState } from "react";
import { dataDaSemana, dataPorExtenso } from "../componentes/PreJogo";
import { Escudo, Medidor } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";
import { Noticias } from "./Noticias";
import { Tabela } from "./Tabela";

type AbaAtleta = "semana" | "vida" | "carreira" | "tabela" | "noticias";

const ABAS: { id: AbaAtleta; nome: string; dica: string }[] = [
  { id: "semana", nome: "Semana", dica: "Dilemas e jogo" },
  { id: "vida", nome: "Vida", dica: "Rotina e dinheiro" },
  { id: "carreira", nome: "Carreira", dica: "Números e histórico" },
  { id: "tabela", nome: "Comp", dica: "Tabelas" },
  { id: "noticias", nome: "Notícias", dica: "Matérias" },
];

const NOMES_VIDA: Record<CampoVida, string> = {
  moral: "Moral",
  forma: "Forma física",
  fama: "Fama",
  reputacao: "Reputação",
  tecnico: "Técnico",
  elenco: "Elenco",
  torcida: "Torcida",
  imprensa: "Imprensa",
  familia: "Família",
  empresario: "Empresário",
  vicios: "Vícios",
};

const RITMOS: { id: RitmoAtleta; nome: string; botao: string }[] = [
  { id: "jogo", nome: "Jogo a jogo", botao: "Jogar a semana" },
  { id: "decisivos", nome: "Momentos decisivos", botao: "Avançar até o próximo momento decisivo" },
  { id: "temporada", nome: "Temporada", botao: "Simular a temporada" },
];

const ESCALACAO: Record<string, string> = {
  titular: "Titular",
  banco: "Banco",
  fora: "Fora da lista",
  lesionado: "Lesionado",
  suspenso: "Suspenso",
};

function idadeEClube(jogo: EstadoJogo) {
  const a = jogo.atleta!;
  const clube = clubeDoAtleta(jogo);
  const j = jogadorDoAtleta(jogo);
  return { a, clube, j };
}

function TopoAtleta() {
  const jogo = useJogo();
  const { a, clube, j } = idadeEClube(jogo);
  const t = jogo.temporada;
  return (
    <header className="top">
      <div className="crestbox">
        <Escudo clube={clube} tamanho={40} />
      </div>
      <div className="grow">
        <h1>{a.nome}</h1>
        <div className="sub">
          {j.pos} · {a.idade} anos · {clube.nome} · overall {j.ovr} · {t.temporada} ·{" "}
          {dataPorExtenso(dataDaSemana(t.rodada))}
        </div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <Medidor rotulo="Moral" valor={a.vida.moral} />
        <Medidor rotulo="Forma" valor={a.vida.forma} />
        <Medidor rotulo="Técnico" valor={a.vida.tecnico} />
      </div>
    </header>
  );
}

function Dilema({ d }: { d: DilemaAtleta }) {
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  return (
    <article className="panel stack dilema" data-categoria={d.categoria}>
      <span className="eyebrow">
        {d.categoria}
        {d.capital ? " · decisão importante" : ""}
      </span>
      <h3>{d.titulo}</h3>
      <p style={{ margin: 0 }}>{d.texto}</p>
      <div className="stack" style={{ gap: 6 }}>
        {d.opcoes.map((o, i) => (
          <button
            key={o.texto}
            type="button"
            className="btn opcao-dilema"
            onClick={() => {
              const r = mexer((jogo) => decidirDilema(jogo, d.id, i));
              if (r) avisar(r);
            }}
          >
            {o.texto}
            {o.dica && <span className="small muted">{o.dica}</span>}
          </button>
        ))}
      </div>
    </article>
  );
}

function PlacarDoJogo({ g }: { g: JogoDoAtleta }) {
  const jogo = useJogo();
  const { clube } = idadeEClube(jogo);
  const adv = jogo.temporada.clubes[g.adversarioId]!;
  const casa = g.mandante ? clube : adv;
  const fora = g.mandante ? adv : clube;
  const placar = g.placar ? (g.mandante ? g.placar : [g.placar[1], g.placar[0]]) : null;
  return (
    <div className="fixture">
      <div className="stack" style={{ alignItems: "center", gap: 6 }}>
        <Escudo clube={casa} tamanho={40} />
        <span className="tn">{casa.nome}</span>
      </div>
      <span className="vs">{placar ? `${placar[0]} x ${placar[1]}` : "x"}</span>
      <div className="stack" style={{ alignItems: "center", gap: 6 }}>
        <Escudo clube={fora} tamanho={40} />
        <span className="tn">{fora.nome}</span>
      </div>
    </div>
  );
}

/** Lances do atleta já decididos e, do motor, os gols e expulsões do resto do jogo até o minuto `ate`. */
function LinhaDoTempo({ g, ate, comTexto }: { g: JogoDoAtleta; ate: number; comTexto: boolean }) {
  const jogo = useJogo();
  const { clube } = idadeEClube(jogo);
  const adv = jogo.temporada.clubes[g.adversarioId]!;
  const itens = [
    ...g.lances
      .filter((l) => l.escolha && l.resultado)
      .map((l, i) => ({
        min: l.minuto,
        chave: `l${i}`,
        classe: l.bom ? "bom" : "ruim",
        corpo: comTexto ? (
          <>
            <span className="muted">{l.texto}</span> {l.resultado}
          </>
        ) : (
          l.resultado
        ),
      })),
    ...(g.narracao ?? [])
      .filter((n) => n.min <= ate)
      .map((n, i) => ({
        min: n.min,
        chave: `n${i}`,
        classe: "motor",
        corpo: (
          <span className="muted">
            {(n.nosso ? clube : adv).sigla} · {n.texto}
          </span>
        ),
      })),
  ].sort((x, y) => x.min - y.min);
  if (!itens.length) return null;
  return (
    <ol className="lances">
      {itens.map((x) => (
        <li key={x.chave} className={x.classe}>
          <span className="m">{x.min}'</span>
          <span>{x.corpo}</span>
        </li>
      ))}
    </ol>
  );
}

function JogoEmAndamento({ g }: { g: JogoDoAtleta }) {
  const mexer = useLoja((s) => s.mexer);
  const jogo = useJogo();
  const a = jogo.atleta!;
  const pendentes = lancesPendentes(g);
  const proximo = pendentes[0];
  const indice = proximo ? g.lances.indexOf(proximo) : -1;
  return (
    <section className="panel stack" aria-label="Jogo">
      <span className="eyebrow">
        {g.nomeCompeticao}
        {g.decisivo ? " · jogo decisivo" : ""} · {ESCALACAO[g.escalacao]}
        {g.entrou ? ` (entra aos ${g.entrou}')` : ""}
      </span>
      <PlacarDoJogo g={g} />
      {g.minutos === 0 && (
        <p className="muted" style={{ margin: 0 }}>
          {g.escalacao === "banco"
            ? "Você ficou no banco o jogo inteiro."
            : g.escalacao === "fora"
              ? "O técnico deixou você fora da lista."
              : `Você está ${ESCALACAO[g.escalacao]!.toLowerCase()}.`}
        </p>
      )}
      <LinhaDoTempo g={g} ate={proximo ? proximo.minuto : 90} comTexto />
      {proximo && (
        <div className="lance-atual stack">
          <span className="eyebrow">
            {proximo.minuto}'{proximo.decisivo ? " · lance decisivo" : ""}
          </span>
          <p style={{ margin: 0 }}>{proximo.texto}</p>
          <div className="opcoes-lance">
            {proximo.opcoes.map((o) => (
              <button
                key={o.id}
                type="button"
                className="btn"
                onClick={() => mexer((j) => escolherLance(j, indice, o.id))}
              >
                {o.texto}
                <span className="small muted num">{Math.round(o.chance * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        className="btn primary big"
        onClick={() =>
          mexer((j) => {
            if (pendentes.length) terminarJogoDoAtleta(j);
            avancarAtleta(j);
          })
        }
      >
        {pendentes.length ? "Deixar o jogo seguir" : "Fim de jogo"}
      </button>
      {a.ritmo !== "jogo" && (
        <p className="small muted" style={{ margin: 0 }}>
          Os lances menores deste jogo foram decididos sozinhos.
        </p>
      )}
    </section>
  );
}

function proximoJogoDoClube(jogo: EstadoJogo, clubeId: string) {
  const t = jogo.temporada;
  return (
    Object.values(t.jogos)
      .filter((x) => !x.placar && x.rodada >= t.rodada && (x.casa === clubeId || x.visitante === clubeId))
      .sort((x, y) => dataDoJogo(x).localeCompare(dataDoJogo(y)))[0] ?? null
  );
}

function ProximoCompromisso() {
  const jogo = useJogo();
  const { a, clube, j } = idadeEClube(jogo);
  const t = jogo.temporada;
  const proximo = proximoJogoDoClube(jogo, clube.id);
  const provavel = decidirEscalacao({ estado: jogo, a, j, clube, rng: criarRng(1) });
  if (!proximo) {
    return (
      <section className="panel stack">
        <span className="eyebrow">Semana de {dataPorExtenso(dataDaSemana(t.rodada))}</span>
        <p className="muted" style={{ margin: 0 }}>
          Sem jogo marcado para o {clube.nome}. Treinos e vida seguem.
        </p>
      </section>
    );
  }
  const adv = t.clubes[proximo.casa === clube.id ? proximo.visitante : proximo.casa]!;
  return (
    <section className="panel stack">
      <span className="eyebrow">
        Próximo jogo · {nomeDaCompeticao(t, proximo.competicao)} · {dataPorExtenso(dataDoJogo(proximo))}
      </span>
      <div className="row">
        <Escudo clube={adv} tamanho={28} />
        <b>
          {proximo.casa === clube.id ? "x" : "@"} {adv.nome}
        </b>
        <span className="grow" />
        <span className={`tag${provavel === "titular" ? " xi" : ""}`}>
          {provavel === "titular" ? "Provável titular" : ESCALACAO[provavel]}
        </span>
      </div>
    </section>
  );
}

function UltimoJogo() {
  const jogo = useJogo();
  const { a, clube } = idadeEClube(jogo);
  const g = a.ultimosJogos[0];
  if (!g) return null;
  return (
    <section className="panel stack" aria-label="Último jogo">
      <span className="eyebrow">
        Último jogo · {g.nomeCompeticao} · {ESCALACAO[g.escalacao]}
        {g.nota !== undefined ? ` · nota ${g.nota.toFixed(1)}` : ""}
      </span>
      <PlacarDoJogo g={g} />
      <LinhaDoTempo g={g} ate={90} comTexto={false} />
      {g.posse !== undefined && (
        <p className="small muted" style={{ margin: 0 }}>
          Posse de bola do {clube.sigla}: {g.posse}%
        </p>
      )}
    </section>
  );
}

function PropostasDeTecnico() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const propostas = propostasDeTecnico(jogo);
  if (!propostas.length) return null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <h3 style={{ margin: 0 }}>Convites para ser técnico</h3>
      <p className="small muted" style={{ margin: 0 }}>
        Aceite um e a carreira continua no mesmo mundo, agora na beira do campo.
      </p>
      {propostas.map((p) => {
        const clube = jogo.temporada.clubes[p.clubeId]!;
        return (
          <button
            key={p.clubeId}
            type="button"
            className="btn opcao-dilema"
            onClick={() => {
              if (mexer((j) => virarTecnico(j, p.clubeId))) avisar(`Você é o novo técnico do ${p.nome}.`);
            }}
          >
            <span className="row" style={{ gap: 8 }}>
              <Escudo clube={clube} tamanho={22} />
              <b>{p.nome}</b>
            </span>
            <span className="small muted">{p.motivo}</span>
          </button>
        );
      })}
    </div>
  );
}

function Semana() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const abandonar = useLoja((s) => s.abandonar);
  const a = jogo.atleta!;
  const pend = pendenciaDoAtleta(jogo);
  if (a.aposentado) {
    return (
      <section className="panel stack">
        <span className="eyebrow">Pós-carreira</span>
        <h2>Fim de carreira</h2>
        <p style={{ margin: 0 }}>{a.posCarreira}</p>
        <PropostasDeTecnico />
        <button type="button" className="btn big" onClick={() => void abandonar()}>
          Começar outro jogo
        </button>
      </section>
    );
  }
  const ritmo = RITMOS.find((r) => r.id === a.ritmo)!;
  return (
    <div className="stack">
      <div className="seg" role="group" aria-label="Ritmo">
        {RITMOS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={a.ritmo === r.id}
            onClick={() => mexer((j) => mudarRitmo(j, r.id))}
          >
            {r.nome}
          </button>
        ))}
      </div>
      {a.jogo ? <JogoEmAndamento g={a.jogo} /> : <ProximoCompromisso />}
      {a.dilemas.map((d) => (
        <Dilema key={d.id} d={d} />
      ))}
      {!a.jogo && (
        <button
          type="button"
          className="btn primary big"
          disabled={pend === "dilemas"}
          onClick={() => {
            const antes = jogo.temporada.temporada;
            const r = mexer((j) => avancarAtleta(j));
            if (r === "temporada" || jogo.temporada.temporada !== antes) {
              const h = a.historico.at(-1);
              if (h)
                avisar(
                  `Temporada ${h.temporada}: ${h.jogos} jogos, ${h.gols} gols, ${h.assist} assistências${h.nota ? `, nota ${h.nota.toFixed(2)}` : ""}${h.titulos.length ? ` · ${h.titulos.join(", ")}` : ""}`,
                );
            }
          }}
        >
          {pend === "dilemas" ? "Responda os dilemas para seguir" : ritmo.botao}
        </button>
      )}
      <UltimoJogo />
      <section className="panel stack" aria-label="Acontecimentos">
        <span className="eyebrow">Acontecimentos</span>
        <ul className="lista-limpa feed-atleta">
          {a.feed.slice(0, 20).map((f, i) => (
            <li key={`${f.semana}-${i}`} className={f.tipo}>
              {f.texto}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Nivel3({
  rotulo,
  valor,
  nomes,
  onChange,
}: {
  rotulo: string;
  valor: number;
  nomes: [string, string, string];
  onChange: (v: 0 | 1 | 2) => void;
}) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <span className="small muted">{rotulo}</span>
      <div className="seg" role="group" aria-label={rotulo}>
        {nomes.map((n, i) => (
          <button key={n} type="button" aria-pressed={valor === i} onClick={() => onChange(i as 0 | 1 | 2)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Vida() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const { a, clube } = idadeEClube(jogo);
  const sal = salarioSemanal(a);
  const fixos = a.gastosFixos.reduce((s, g) => s + g.porSemana, 0);
  return (
    <div className="stack">
      <section className="panel stack">
        <span className="eyebrow">Rotina</span>
        <Nivel3
          rotulo="Treino"
          valor={a.rotina.treino}
          nomes={["Leve", "Normal", "Intenso"]}
          onChange={(v) => mexer((j) => mudarRotina(j, { treino: v }))}
        />
        <Nivel3
          rotulo="Padrão de vida"
          valor={a.rotina.padrao}
          nomes={["Simples", "Confortável", "Ostentação"]}
          onChange={(v) => mexer((j) => mudarRotina(j, { padrao: v }))}
        />
        <p className="small muted" style={{ margin: 0 }}>
          Treino intenso acelera a evolução e a forma, mas cansa, afasta da família e machuca mais. Ostentação
          dá moral e fama, custa caro e puxa os vícios.
        </p>
      </section>
      <section className="panel stack">
        <span className="eyebrow">Como você está</span>
        <div className="grade-vida">
          {(Object.keys(NOMES_VIDA) as CampoVida[]).map((k) => (
            <Medidor
              key={k}
              rotulo={k === "vicios" ? "Vida limpa" : NOMES_VIDA[k]}
              valor={k === "vicios" ? 100 - a.vida[k] : a.vida[k]}
            />
          ))}
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Vida limpa é o inverso dos vícios (álcool, remédios, noitadas): hoje {Math.round(a.vida.vicios)} de
          100 em vícios.
        </p>
      </section>
      <section className="panel stack">
        <span className="eyebrow">Dinheiro e contrato</span>
        <dl className="kv">
          <dt>Patrimônio</dt>
          <dd className={a.dinheiro < 0 ? "neg" : undefined}>{formatarDinheiro(a.dinheiro)}</dd>
          <dt>Salário</dt>
          <dd>
            {formatarDinheiro(a.contrato.salario)} por ano ({formatarDinheiro(sal)} por semana)
          </dd>
          <dt>Contrato</dt>
          <dd>
            {clube.nome}, até {a.contrato.ate}
          </dd>
          <dt>Gastos fixos</dt>
          <dd>
            {a.gastosFixos.length
              ? a.gastosFixos.map((g) => `${g.motivo} (${formatarDinheiro(g.porSemana)}/sem.)`).join(" · ")
              : "nenhum"}
          </dd>
          <dt>Saldo semanal</dt>
          <dd>{formatarDinheiro(sal - sal * [0.25, 0.5, 0.95][a.rotina.padrao]! - fixos)}</dd>
        </dl>
      </section>
      <section className="panel stack">
        <span className="eyebrow">Família</span>
        <dl className="kv">
          <dt>Relacionamento</dt>
          <dd>{{ solteiro: "Solteiro", namorando: "Namorando", casado: "Casado" }[a.relacionamento]}</dd>
          <dt>Filhos</dt>
          <dd>{a.filhos || "nenhum"}</dd>
        </dl>
      </section>
    </div>
  );
}

function CarreiraAtleta() {
  const jogo = useJogo();
  const { a, j } = idadeEClube(jogo);
  const t = jogo.temporada;
  const nota = notaDaTemporada(a);
  const total = a.historico.reduce(
    (s, h) => ({ jogos: s.jogos + h.jogos, gols: s.gols + h.gols, titulos: s.titulos + h.titulos.length }),
    { jogos: a.numeros.jogos, gols: a.numeros.gols, titulos: 0 },
  );
  return (
    <div className="stack">
      <section className="panel stack">
        <span className="eyebrow">Jogador</span>
        <dl className="kv">
          <dt>Overall</dt>
          <dd className="num">
            {j.ovr} <span className="muted small">(potencial estimado {a.potencial})</span>
          </dd>
          <dt>Atributos</dt>
          <dd className="num small">{ATRIBUTOS.map((x) => `${x} ${j.at[x]}`).join(" · ")}</dd>
          <dt>Temporada {t.temporada}</dt>
          <dd>
            {a.numeros.jogos} jogos, {a.numeros.gols} gols, {a.numeros.assist} assistências
            {nota ? `, nota ${nota.toFixed(2)}` : ""}
          </dd>
          <dt>Carreira</dt>
          <dd>
            {total.jogos} jogos, {total.gols} gols, {total.titulos} título{total.titulos === 1 ? "" : "s"},{" "}
            {a.convocacoes} convocaç{a.convocacoes === 1 ? "ão" : "ões"}
          </dd>
        </dl>
      </section>
      {a.historico.length > 0 && (
        <section className="panel stack">
          <span className="eyebrow">Temporadas</span>
          <table className="tabela-simples">
            <thead>
              <tr>
                <th>Ano</th>
                <th>Clube</th>
                <th>Ida.</th>
                <th>OVR</th>
                <th>J</th>
                <th>G</th>
                <th>A</th>
                <th>Nota</th>
                <th>Títulos</th>
              </tr>
            </thead>
            <tbody>
              {a.historico.map((h) => (
                <tr key={h.temporada}>
                  <td className="num">{h.temporada}</td>
                  <td>{t.clubes[h.clubeId]?.sigla ?? h.clubeId}</td>
                  <td className="num">{h.idade}</td>
                  <td className="num">{h.ovr}</td>
                  <td className="num">{h.jogos}</td>
                  <td className="num">{h.gols}</td>
                  <td className="num">{h.assist}</td>
                  <td className="num">{h.nota?.toFixed(2) ?? "—"}</td>
                  <td className="small">{h.titulos.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <section className="panel stack">
        <span className="eyebrow">Decisões que marcaram</span>
        <ul className="lista-limpa feed-atleta">
          {a.escolhas
            .filter((e) => e.capital)
            .slice(0, 25)
            .map((e) => (
              <li key={`${e.semana}-${e.titulo}`}>
                <b>
                  {e.temporada} · {e.titulo}:
                </b>{" "}
                {e.escolha}. <span className="muted">{e.resultado}</span>
              </li>
            ))}
        </ul>
        {!a.escolhas.some((e) => e.capital) && <p className="muted small">Nenhuma ainda.</p>}
      </section>
    </div>
  );
}

export function AppAtleta() {
  const [aba, setAba] = useState<AbaAtleta>("semana");
  const jogo = useJogo();
  const a = jogo.atleta!;
  const avisos = a.dilemas.length;
  return (
    <div id="app">
      <TopoAtleta />
      <nav className="tabs" aria-label="Seções">
        <div className="in">
          {ABAS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-current={aba === x.id ? "page" : undefined}
              onClick={() => {
                setAba(x.id);
                window.scrollTo({ top: 0 });
              }}
            >
              <b>{x.nome}</b>
              <span>
                {x.id === "semana" && avisos > 0 ? (
                  <span className="contador" aria-label={`${avisos} dilemas`}>
                    {avisos}
                  </span>
                ) : (
                  x.dica
                )}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <main>
        {aba === "semana" && <Semana />}
        {aba === "vida" && <Vida />}
        {aba === "carreira" && <CarreiraAtleta />}
        {aba === "tabela" && <Tabela />}
        {aba === "noticias" && <Noticias />}
      </main>
    </div>
  );
}
