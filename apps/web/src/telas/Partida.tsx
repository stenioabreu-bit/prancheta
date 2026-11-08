import {
  type LadoPartida,
  type Partida as PartidaDoMotor,
  type Pergunta,
  TONS,
  type TomDeConversa,
  coletivaAntes,
  coletivaDepois,
  concluirPartida,
  conselhoAntes,
  conselhoIntervalo,
  criarRng,
  ehClassico,
  iniciarPartida,
  passo,
  podeSubstituir,
  posicaoNaTabela,
  prelecao,
  proximoJogoDoUsuario,
  responderColetiva,
  substituir,
} from "@prancheta/engine";
import { useEffect, useReducer, useRef, useState } from "react";
import { Escudo, Folha } from "../componentes/basicos";
import { ALTURA, CampoPixel, LARGURA } from "../componentes/campoPixel";
import { useJogo, useLoja } from "../estado/loja";
import { ControlesTaticos } from "./Tatica";

type Fase = "pre" | "jogo" | "intervalo" | "pos";

/** Escala da duração da animação de cada minuto no campo. */
const VELOCIDADES = [
  { nome: "Lenta", escala: 1.35 },
  { nome: "Normal", escala: 0.85 },
  { nome: "Rápida", escala: 0.45 },
  { nome: "Turbo", escala: 0.12 },
];

function meuLado(m: PartidaDoMotor): LadoPartida {
  return m.casa.ehUsuario ? m.casa : m.visitante;
}

function Prelecao({
  m,
  momento,
  aoFalar,
}: { m: PartidaDoMotor; momento: "pre" | "intervalo" | "pos"; aoFalar: () => void }) {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const [resultado, setResultado] = useState<{ geral: string; reacoes: string[] } | null>(null);
  if (resultado) {
    return (
      <div className="resposta" role="status">
        <b>{resultado.geral}</b> {resultado.reacoes.join(" ")}
      </div>
    );
  }
  return (
    <div className="tones">
      {(Object.keys(TONS) as TomDeConversa[]).map((tom) => (
        <button
          key={tom}
          type="button"
          className="tone"
          onClick={() => {
            const semente = jogo.temporada.rng ^ (m.minuto * 7919);
            setResultado(mexer((j) => prelecao(m, j.carreira, momento, tom, criarRng(semente))));
            aoFalar();
          }}
        >
          <b>{TONS[tom].nome}</b>
          <span>{TONS[tom].fala}</span>
        </button>
      ))}
    </div>
  );
}

function Coletiva({ perguntas }: { perguntas: Pergunta[] }) {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  if (!perguntas.length) return null;
  const clube = jogo.carreira.clubeId ? jogo.temporada.clubes[jogo.carreira.clubeId]! : null;
  return (
    <div className="stack">
      {perguntas.map((p, i) => (
        <div key={p.pergunta} className="stack" style={{ gap: 6 }}>
          <b className="small">{p.pergunta}</b>
          {respostas[i] !== undefined ? (
            <div className="resposta">{respostas[i] || "Resposta registrada."}</div>
          ) : (
            p.opcoes.map((o, k) => (
              <button
                key={o.texto}
                type="button"
                className="btn"
                style={{ textAlign: "left" }}
                disabled={!clube}
                onClick={() => {
                  const r = mexer((j) => responderColetiva(j.carreira, clube, j.temporada.rodada, p, k));
                  setRespostas({ ...respostas, [i]: r.join(" ") });
                }}
              >
                “{o.texto}”
              </button>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function Trocas({ m, aoFechar, aoMudar }: { m: PartidaDoMotor; aoFechar: () => void; aoMudar: () => void }) {
  const lado = meuLado(m);
  const [sai, setSai] = useState<string | null>(null);
  const pode = podeSubstituir(m, lado);
  return (
    <Folha titulo={`Substituições · ${lado.trocas}/5`} aoFechar={aoFechar}>
      <p className="small muted" style={{ margin: 0 }}>
        Até 5 trocas em 3 paradas; o intervalo não conta como parada. Paradas usadas: {lado.paradas}/3.
      </p>
      {!pode && <p className="vazio">Sem trocas disponíveis agora.</p>}
      {pode && !sai && (
        <>
          <h3>Quem sai?</h3>
          <div className="plist">
            {lado.emCampo
              .filter((p) => !p.expulso)
              .map((p) => (
                <button
                  key={p.atual.jogador.id}
                  type="button"
                  className="prow"
                  onClick={() => setSai(p.atual.jogador.id)}
                >
                  <span className={`pos ${p.posto}`}>{p.posto}</span>
                  <span className="nm">{p.atual.jogador.nome}</span>
                  <span className="cond" aria-label={`Condição ${Math.round(p.atual.cond)}%`}>
                    <i
                      style={{
                        width: `${p.atual.cond}%`,
                        background: p.atual.cond < 66 ? "var(--gold)" : undefined,
                      }}
                    />
                  </span>
                  <span className={`rating ${p.atual.nota >= 7 ? "hi" : p.atual.nota < 6 ? "lo" : ""}`}>
                    {p.atual.nota.toFixed(1)}
                  </span>
                </button>
              ))}
          </div>
        </>
      )}
      {pode && sai && (
        <>
          <h3>Quem entra?</h3>
          <div className="plist">
            {lado.banco
              .filter((b) => !b.usado)
              .map((b) => (
                <button
                  key={b.jogador.id}
                  type="button"
                  className="prow"
                  onClick={() => {
                    substituir(m, lado, sai, b.jogador.id);
                    setSai(null);
                    aoMudar();
                  }}
                >
                  <span className={`pos ${b.jogador.pos}`}>{b.jogador.pos}</span>
                  <span className="nm">{b.jogador.nome}</span>
                  <span className="muted small">{Math.round(b.cond)}%</span>
                  <span className="ovr">{b.jogador.ovr}</span>
                </button>
              ))}
          </div>
          <button type="button" className="btn" onClick={() => setSai(null)}>
            Voltar
          </button>
        </>
      )}
    </Folha>
  );
}

function Estatisticas({ m }: { m: PartidaDoMotor }) {
  const total = m.posse.casa + m.posse.visitante;
  const posseCasa = total ? Math.round((100 * m.posse.casa) / total) : 50;
  const linhas: [string, string | number, string | number][] = [
    ["Posse", `${posseCasa}%`, `${100 - posseCasa}%`],
    ["Finalizações", m.casa.est.chutes, m.visitante.est.chutes],
    ["No alvo", m.casa.est.noAlvo, m.visitante.est.noAlvo],
    ["xG", m.casa.est.xg.toFixed(2), m.visitante.est.xg.toFixed(2)],
    [
      "Cartões",
      m.casa.est.amarelos + m.casa.est.vermelhos,
      m.visitante.est.amarelos + m.visitante.est.vermelhos,
    ],
  ];
  return (
    <div className="mstats">
      {linhas.map(([nome, a, b]) => (
        <div key={nome} style={{ display: "contents" }}>
          <span className="l num">{a}</span>
          <span className="c">{nome}</span>
          <span className="num">{b}</span>
        </div>
      ))}
    </div>
  );
}

export function Partida() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const setEmPartida = useLoja((s) => s.setEmPartida);
  const [, redesenhar] = useReducer((x: number) => x + 1, 0);
  const [m] = useState(() => useLoja.getState().mexer((j) => iniciarPartida(j)));
  const [fase, setFase] = useState<Fase>("pre");
  const [rodando, setRodando] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [folha, setFolha] = useState<"trocas" | "prancheta" | null>(null);
  const [falouNoIntervalo, setFalouNoIntervalo] = useState(false);
  const [posJogo, setPosJogo] = useState<Pergunta[] | null>(null);
  const feed = useRef<HTMLDivElement>(null);

  const eu = meuLado(m);
  const adversario = eu === m.casa ? m.visitante : m.casa;
  const t = jogo.temporada;
  // Calculados uma vez, no começo da partida.
  const [conselho] = useState(() =>
    conselhoAntes(jogo.carreira, adversario.clube, criarRng(jogo.temporada.rng)),
  );
  const [perguntasAntes] = useState(() => {
    const classico = ehClassico(jogo.carreira, eu.clube.id, adversario.clube.id);
    return coletivaAntes(
      jogo.carreira,
      eu.clube,
      adversario.clube,
      classico,
      posicaoNaTabela(t, eu.clube.id),
    );
  });
  const [jogoAgendado] = useState(() => proximoJogoDoUsuario(jogo));

  const tela = useRef<HTMLCanvasElement>(null);
  const campo = useRef<CampoPixel | null>(null);
  const escala = useRef(VELOCIDADES[velocidade]!.escala);
  escala.current = VELOCIDADES[velocidade]!.escala;
  useEffect(() => {
    const ctx = tela.current?.getContext("2d");
    if (!ctx) return;
    campo.current = new CampoPixel(m, ctx);
    campo.current.desenhar();
    return () => campo.current?.parar();
  }, [m]);

  // Cada minuto: o motor avança, o campo anima os eventos novos e a narração acompanha.
  useEffect(() => {
    if (!rodando) return;
    let ativo = true;
    void (async () => {
      while (ativo) {
        const antes = m.eventos.length;
        const r = passo(m);
        redesenhar();
        if (r === "intervalo") {
          setRodando(false);
          setFase("intervalo");
          return;
        }
        if (r === "fim" || r === "encerrada") {
          setRodando(false);
          mexer((j) => concluirPartida(j, m));
          setPosJogo(coletivaDepois(useLoja.getState().jogo!.carreira, m));
          setFase("pos");
          return;
        }
        await campo.current?.animar(m.eventos.slice(antes), escala.current);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [rodando, m, mexer]);

  useEffect(() => {
    const f = feed.current;
    if (f) f.scrollTop = f.scrollHeight;
  });

  const relogio =
    fase === "pre"
      ? "Antes do jogo"
      : fase === "intervalo"
        ? "Intervalo"
        : fase === "pos"
          ? "Encerrado"
          : `${m.minuto}'${rodando ? "" : " · pausado"}`;
  const competicao = jogoAgendado
    ? jogoAgendado.competicao === "copa"
      ? `Copa do Brasil · ${jogoAgendado.fase}`
      : `Série ${jogoAgendado.competicao}`
    : "";

  function simularAteOFim() {
    setRodando(false);
    let guarda = 0;
    let r = passo(m);
    while (r !== "fim" && r !== "encerrada" && guarda++ < 200) r = passo(m);
    mexer((j) => concluirPartida(j, m));
    setPosJogo(coletivaDepois(useLoja.getState().jogo!.carreira, m));
    setFase("pos");
  }

  return (
    <div className="match" role="dialog" aria-modal="true" aria-label="Partida">
      <div className="wrap">
        <div className="board">
          <div className="score">
            <div className="t">
              <Escudo clube={m.casa.clube} tamanho={30} />
              {m.casa.clube.nome}
            </div>
            <div className="g num">
              {m.casa.est.gols} – {m.visitante.est.gols}
            </div>
            <div className="t">
              <Escudo clube={m.visitante.clube} tamanho={30} />
              {m.visitante.clube.nome}
            </div>
          </div>
          <div className="clock">
            {competicao} · {relogio}
          </div>
          <Estatisticas m={m} />
        </div>

        <div className="palco">
          <div className="campo-wrap">
            <canvas ref={tela} width={LARGURA} height={ALTURA} aria-label="Campo" />
            <div className="leg">
              <span>{m.casa.clube.sigla} casa</span>
              <span>{m.visitante.clube.sigla} fora</span>
              <small>marcador amarelo: seu time</small>
            </div>
          </div>
          <div className="palco-lado">
            {fase === "pre" && (
              <div className="feed pre-jogo">
                <section className="panel stack">
                  <span className="eyebrow">Conselho de {conselho.de}</span>
                  <p style={{ margin: 0 }}>{conselho.texto}</p>
                </section>
                {perguntasAntes.length > 0 && (
                  <section className="panel stack">
                    <span className="eyebrow">Coletiva antes do jogo</span>
                    <Coletiva perguntas={perguntasAntes} />
                  </section>
                )}
                <section className="panel stack">
                  <span className="eyebrow">Preleção no vestiário</span>
                  <Prelecao m={m} momento="pre" aoFalar={redesenhar} />
                </section>
              </div>
            )}

            {(fase === "jogo" || fase === "intervalo") && (
              <div className="feed" ref={feed} aria-live="polite">
                {m.eventos.map((ev, i) => (
                  <div
                    key={`${ev.min}-${i}`}
                    className={`ev ${ev.tipo}${ev.tipo === "gol" && ev.lado !== eu.lado ? " op" : ""}`}
                  >
                    <span className="m">{ev.min}'</span>
                    <span className="t">{ev.texto}</span>
                  </div>
                ))}
                {fase === "intervalo" && (
                  <section className="panel stack">
                    <span className="eyebrow">Intervalo · {conselhoIntervalo(jogo.carreira, m).de}</span>
                    <p style={{ margin: 0 }}>{conselhoIntervalo(jogo.carreira, m).texto}</p>
                    {!falouNoIntervalo && <span className="eyebrow">Preleção</span>}
                    <Prelecao m={m} momento="intervalo" aoFalar={() => setFalouNoIntervalo(true)} />
                  </section>
                )}
              </div>
            )}

            {fase === "pos" && (
              <div className="feed">
                <section className="panel stack">
                  <span className="eyebrow">Conversa no vestiário</span>
                  <Prelecao m={m} momento="pos" aoFalar={redesenhar} />
                </section>
                {posJogo && posJogo.length > 0 && (
                  <section className="panel stack">
                    <span className="eyebrow">Coletiva</span>
                    <Coletiva perguntas={posJogo} />
                  </section>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ctrl">
          {fase === "pre" && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setFase("jogo");
                setRodando(true);
              }}
            >
              Começar o jogo
            </button>
          )}
          {fase === "jogo" && (
            <>
              <button type="button" className="btn primary" onClick={() => setRodando(!rodando)}>
                {rodando ? "Pausar" : "Continuar"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setVelocidade((velocidade + 1) % VELOCIDADES.length)}
              >
                {VELOCIDADES[velocidade]!.nome}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setRodando(false);
                  setFolha("trocas");
                }}
              >
                Trocas {eu.trocas}/5
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setRodando(false);
                  setFolha("prancheta");
                }}
              >
                Prancheta
              </button>
            </>
          )}
          {fase === "intervalo" && (
            <>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setFase("jogo");
                  setRodando(true);
                }}
              >
                2º tempo
              </button>
              <button type="button" className="btn" onClick={() => setFolha("trocas")}>
                Trocas {eu.trocas}/5
              </button>
              <button type="button" className="btn" onClick={() => setFolha("prancheta")}>
                Prancheta
              </button>
            </>
          )}
          {(fase === "jogo" || fase === "intervalo") && (
            <button type="button" className="btn" onClick={simularAteOFim}>
              Até o fim
            </button>
          )}
          {fase === "pos" && (
            <button type="button" className="btn primary" onClick={() => setEmPartida(false)}>
              Voltar ao clube
            </button>
          )}
        </div>
      </div>
      {folha === "trocas" && <Trocas m={m} aoFechar={() => setFolha(null)} aoMudar={redesenhar} />}
      {folha === "prancheta" && (
        <Folha titulo="Prancheta" aoFechar={() => setFolha(null)}>
          <ControlesTaticos
            tatica={eu.tatica}
            aoMudar={(tatica) => {
              eu.tatica = tatica;
              redesenhar();
            }}
          />
        </Folha>
      )}
    </div>
  );
}
