import {
  competicaoDoMomento,
  metasDaTemporada,
  candidatar,
  chaveDoLogo,
  dataDoJogo,
  divisaoDo,
  exigencia,
  fimDeTemporada,
  nomeDaCompeticao,
  novaTemporadaDoJogo,
  posicaoNaTabela,
  proximoJogoDoUsuario,
  relatorioDoAdversario,
  seguir,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { Fragment } from "react";
import { LogoCompeticao } from "../componentes/LogoCompeticao";
import { Escudo, Forma, NomeClube } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";
import { Caixa } from "./Clube";

function ProximoJogo() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const setEmPartida = useLoja((s) => s.setEmPartida);
  const t = jogo.temporada;
  const proximo = proximoJogoDoUsuario(jogo);
  const meuId = jogo.carreira.clubeId!;
  if (!proximo) {
    return (
      <section className="panel stack">
        <span className="eyebrow">Rodada {t.rodada + 1}</span>
        <h2>Seu time não joga nesta rodada</h2>
        <p className="muted small" style={{ margin: 0 }}>
          A rodada segue com os outros jogos; o treino e o vestiário continuam na semana.
        </p>
        <button type="button" className="btn primary big" onClick={() => mexer((j) => seguir(j))}>
          Avançar rodada
        </button>
      </section>
    );
  }
  const casa = t.clubes[proximo.casa]!;
  const fora = t.clubes[proximo.visitante]!;
  const adversarioId = proximo.casa === meuId ? proximo.visitante : proximo.casa;
  const scout = relatorioDoAdversario(t, adversarioId, meuId);
  const competicao = nomeDaCompeticao(t, proximo.competicao);
  return (
    <section className="panel stack">
      <span className="eyebrow comp-rotulo">
        <LogoCompeticao competicao={chaveDoLogo(t, proximo.competicao)} tamanho={22} />
        {competicao} · {proximo.fase}
        {proximo.meioDeSemana ? " · meio de semana" : ""} · rodada {t.rodada + 1}
      </span>
      <div className="fixture">
        <div className="stack" style={{ alignItems: "center", gap: 6 }}>
          <Escudo clube={casa} tamanho={48} />
          <span className="tn">{casa.nome}</span>
        </div>
        <span className="vs">{proximo.neutro ? "campo neutro" : "x"}</span>
        <div className="stack" style={{ alignItems: "center", gap: 6 }}>
          <Escudo clube={fora} tamanho={48} />
          <span className="tn">{fora.nome}</span>
        </div>
      </div>
      <dl className="kv">
        <dt>Adversário</dt>
        <dd>
          {scout.forca} · {scout.esquema}
        </dd>
        <dt>Estilo</dt>
        <dd>{scout.estilo}</dd>
        <dt>Perigo</dt>
        <dd>
          {scout.destaque}
          {scout.maisRapido && scout.maisRapido !== scout.destaque
            ? ` e a velocidade de ${scout.maisRapido}`
            : ""}
        </dd>
        <dt>Forma</dt>
        <dd>
          <Forma resultados={scout.forma} />
        </dd>
      </dl>
      <div className="botoes">
        <button type="button" className="btn primary big" onClick={() => setEmPartida(true)}>
          Ir para o jogo
        </button>
        <button type="button" className="btn" onClick={() => mexer((j) => simularPartidaDoUsuario(j))}>
          Simular sem assistir
        </button>
      </div>
    </section>
  );
}

function FimDaTemporada() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const t = jogo.temporada;
  const nome = (id: string | null) => (id ? t.clubes[id]!.nome : "—");
  const meuId = jogo.carreira.clubeId;
  const d = meuId ? divisaoDo(t, meuId) : null;
  const subiu = d && t.divisoes[d].acesso.includes(meuId!);
  const caiu = d && t.divisoes[d].rebaixados.includes(meuId!);
  return (
    <section className="panel stack">
      <span className="eyebrow">Temporada {t.temporada} encerrada</span>
      <h2>{subiu ? "Acesso conquistado!" : caiu ? "Rebaixado." : "Fim de temporada"}</h2>
      <dl className="kv">
        {(["A", "B", "C", "D"] as const)
          .filter((d) => t.divisoes[d].clubes.length > 0)
          .map((d) => (
            <Fragment key={d}>
              <dt className="comp-rotulo">
                <LogoCompeticao competicao={chaveDoLogo(t, d)} tamanho={20} />
                {nomeDaCompeticao(t, d)}
              </dt>
              <dd>{nome(t.divisoes[d].campeao)}</dd>
            </Fragment>
          ))}
        {!t.semCopa && (
          <>
            <dt className="comp-rotulo">
              <LogoCompeticao competicao="copa" tamanho={20} />
              Copa do Brasil
            </dt>
            <dd>{nome(t.copa.campeao)}</dd>
          </>
        )}
      </dl>
      <button type="button" className="btn primary big" onClick={() => mexer((j) => novaTemporadaDoJogo(j))}>
        Começar a temporada {t.temporada + 1}
      </button>
    </section>
  );
}

function Desempregado() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const { mercado, carreira, temporada: t } = jogo;
  return (
    <section className="panel stack">
      <span className="eyebrow">Sem clube</span>
      <h2>Você está desempregado</h2>
      <p className="muted small" style={{ margin: 0 }}>
        Reputação {Math.round(carreira.reputacao)}. Candidate-se às vagas abertas ou espere uma sondagem na
        caixa de mensagens.
      </p>
      {mercado.vagas.length === 0 && <p className="vazio">Nenhuma vaga aberta agora.</p>}
      <ul className="lista-limpa">
        {mercado.vagas.map((v) => {
          const clube = t.clubes[v.clubeId]!;
          const req = exigencia(jogo, v.clubeId);
          return (
            <li key={v.clubeId} className="linha-entre msg">
              <span>
                <NomeClube clube={clube} />{" "}
                <span className="muted small">
                  · Série {divisaoDo(t, v.clubeId)} · exige {req}
                </span>
              </span>
              <button
                type="button"
                className="btn"
                onClick={() => avisar(mexer((j) => candidatar(j, v.clubeId)))}
              >
                Candidatar
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn primary big" onClick={() => mexer((j) => seguir(j))}>
        Avançar rodada
      </button>
    </section>
  );
}

function Situacao() {
  const jogo = useJogo();
  const { carreira, temporada: t } = jogo;
  if (!carreira.clubeId) return null;
  const metas = metasDaTemporada(t, carreira);
  const agora = competicaoDoMomento(t, carreira);
  const ordenadas = [
    ...metas.filter((x) => x.competicao === agora),
    ...metas.filter((x) => x.competicao !== agora),
  ];
  return (
    <section className="panel stack">
      <span className="eyebrow">Temporada {t.temporada}</span>
      <dl className="kv">
        {ordenadas.map((x) => (
          <Fragment key={x.competicao}>
            <dt>
              {x.nome}
              {x.competicao === agora ? <span className="small muted"> · agora</span> : null}
            </dt>
            <dd>
              {x.texto}
              <span className="small muted" style={{ display: "block" }}>
                {x.situacao}{" "}
                {x.ok !== null && (
                  <span className={x.ok ? "badge" : "muted"}>{x.ok ? "dentro da meta" : "fora da meta"}</span>
                )}
              </span>
            </dd>
          </Fragment>
        ))}
        <dt>Últimos</dt>
        <dd>
          <Forma
            resultados={carreira.historico
              .slice(-5)
              .map((h) => (h.golsPro > h.golsContra ? "V" : h.golsPro === h.golsContra ? "E" : "D"))}
          />
        </dd>
      </dl>
    </section>
  );
}

function Noticias() {
  const jogo = useJogo();
  // No Portal ficam só as das duas últimas rodadas; a aba Notícias guarda todas.
  const noticias = jogo.carreira.noticias.filter((n) => n.rodada >= jogo.temporada.rodada - 2).slice(0, 12);
  return (
    <section className="panel stack">
      <h3>Notícias</h3>
      {noticias.length === 0 ? (
        <p className="vazio">Nada por enquanto.</p>
      ) : (
        <div className="news">
          <ul>
            {noticias.map((n, i) => (
              <li key={`${n.rodada}-${i}`} className={n.tipo}>
                <div>
                  <div className="de">
                    {n.de} · rodada {n.rodada + 1}
                  </div>
                  <div className="small">{n.texto}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Próximos jogos do clube (calendário de duas semanas do Portal). */
function Calendario() {
  const jogo = useJogo();
  const t = jogo.temporada;
  const meu = jogo.carreira.clubeId;
  if (!meu) return null;
  const proximos = Object.values(t.jogos)
    .filter((j) => !j.placar && (j.casa === meu || j.visitante === meu))
    .sort((a, b) => a.rodada - b.rodada || Number(b.meioDeSemana) - Number(a.meioDeSemana))
    .slice(0, 4);
  return (
    <section className="panel stack">
      <h3>Calendário</h3>
      {proximos.length === 0 && <p className="vazio">Sem jogos marcados.</p>}
      <ul className="lista-limpa">
        {proximos.map((j) => {
          const adv = t.clubes[j.casa === meu ? j.visitante : j.casa]!;
          return (
            <li key={j.id} className="cal-item">
              <span className="cal-rod num">
                {dataDoJogo(j).slice(8, 10)}/{dataDoJogo(j).slice(5, 7)}
              </span>
              <NomeClube clube={adv} tamanho={20} />
              <span className="small muted comp-rotulo">
                <LogoCompeticao competicao={chaveDoLogo(t, j.competicao)} tamanho={16} />
                {j.casa === meu ? "casa" : "fora"} · {nomeDaCompeticao(t, j.competicao)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Inicio() {
  const jogo = useJogo();
  const principal = fimDeTemporada(jogo) ? (
    <FimDaTemporada />
  ) : !jogo.carreira.clubeId ? (
    <Desempregado />
  ) : (
    <ProximoJogo />
  );
  return (
    <div className="grade lateral portal">
      <div className="grade">
        {principal}
        <div className="grade duas">
          <Calendario />
          <Situacao />
        </div>
        <Noticias />
      </div>
      <Caixa />
    </div>
  );
}
