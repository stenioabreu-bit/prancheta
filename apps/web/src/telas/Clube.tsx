import {
  type Divisao,
  FOCOS,
  FUNCOES_COMISSAO,
  type FocoTreino,
  NOME_ATRIBUTO_COMISSAO,
  type SetorDoMercado,
  avaliarPotencial,
  buscarNoMercado,
  candidatar,
  criarRng,
  definirFuncao,
  divisaoDo,
  exigencia,
  formatarDinheiro,
  hashTexto,
  indicar,
  janelaAberta,
  pedirDemissao,
  promover,
  proximaJanela,
  responder,
} from "@prancheta/engine";
import { useState } from "react";
import { Folha, NomeClube } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";
import { LinhaJogador } from "./Elenco";

type Secao = "mercado" | "treino" | "comissao" | "base" | "carreira";

type FiltroCaixa = "todas" | "novas" | "tarefas" | "naoLidas";
const FILTROS: { id: FiltroCaixa; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "novas", nome: "Novas" },
  { id: "tarefas", nome: "Tarefas" },
  { id: "naoLidas", nome: "Não lidas" },
];

/** Caixa do Portal (padrão FM26): filtros, lista enxuta e o cartão da mensagem ao clicar. */
export function Caixa() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const [filtro, setFiltro] = useState<FiltroCaixa>("todas");
  const [aberta, setAberta] = useState<string | null>(null);
  const [reacoes, setReacoes] = useState<string[]>([]);
  const rodada = jogo.temporada.rodada;
  const lista = jogo.carreira.caixa.filter((m) => {
    if (filtro === "novas") return m.rodada >= rodada - 1;
    if (filtro === "tarefas") return !!m.opcoes && m.resposta === undefined;
    if (filtro === "naoLidas") return !m.lida;
    return true;
  });
  const m = jogo.carreira.caixa.find((x) => x.id === aberta);
  return (
    <section className="panel stack">
      <div className="linha-entre" style={{ flexWrap: "wrap" }}>
        <h3>Caixa</h3>
        <div className="filters" role="group" aria-label="Filtro da caixa">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>
      {lista.length === 0 && <p className="vazio">Nada aqui.</p>}
      <ul className="lista-limpa">
        {lista.slice(0, 30).map((x) => {
          const tarefa = !!x.opcoes && x.resposta === undefined;
          return (
            <li key={x.id}>
              <button
                type="button"
                className={x.lida ? "item-caixa" : "item-caixa nova"}
                onClick={() => {
                  setAberta(x.id);
                  setReacoes([]);
                  if (!x.lida && !x.opcoes)
                    mexer(() => {
                      x.lida = true;
                    });
                }}
              >
                <span className="assunto">
                  {!x.lida && <span className="ponto" aria-label="não lida" />}
                  {x.assunto}
                </span>
                <span className="de">
                  {x.de} · rodada {x.rodada + 1}
                </span>
                {tarefa && <span className="tag sus">Responder</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {m && (
        <Folha titulo={m.assunto} aoFechar={() => setAberta(null)}>
          <span className="de small muted">
            {m.de} · rodada {m.rodada + 1}
          </span>
          <p style={{ margin: 0 }}>{m.texto}</p>
          {m.opcoes && m.resposta === undefined && (
            <div className="stack" style={{ gap: 6 }}>
              {m.opcoes.map((o, i) => (
                <button
                  key={o.texto}
                  type="button"
                  className="btn"
                  style={{ textAlign: "left" }}
                  onClick={() => setReacoes(mexer((j) => responder(j, m.id, i)))}
                >
                  {o.texto}
                </button>
              ))}
            </div>
          )}
          {m.resposta !== undefined && (
            <div className="resposta">
              Você respondeu: <b>{m.opcoes?.[m.resposta]?.texto}</b> {reacoes.join(" ")}
            </div>
          )}
        </Folha>
      )}
    </section>
  );
}

const SETORES: { id: SetorDoMercado | "TODOS"; nome: string }[] = [
  { id: "TODOS", nome: "Todos" },
  { id: "GOL", nome: "Goleiros" },
  { id: "DEF", nome: "Defesa" },
  { id: "MEIO", nome: "Meio" },
  { id: "ATA", nome: "Ataque" },
];

function Mercado() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const [setor, setSetor] = useState<SetorDoMercado | "TODOS">("TODOS");
  const [divisao, setDivisao] = useState<Divisao | "TODAS">("TODAS");
  const [teto, setTeto] = useState<number | null>(null);
  const { mercado, temporada: t } = jogo;
  const f = mercado.financas;
  const aberta = janelaAberta(t.rodada);
  const proxima = proximaJanela(t.rodada);
  const itens = buscarNoMercado(jogo, {
    ...(setor !== "TODOS" ? { setor } : {}),
    ...(divisao !== "TODAS" ? { divisao } : {}),
    ...(teto !== null ? { valorMaximo: teto } : {}),
    limite: 40,
  });
  return (
    <div className="grade lateral">
      <section className="panel stack">
        <div className="linha-entre" style={{ flexWrap: "wrap" }}>
          <h2>Mercado</h2>
          <span className="small muted">
            {aberta
              ? "Janela aberta"
              : `Janela fechada${proxima !== null ? ` · abre na rodada ${proxima + 1}` : ""}`}
          </span>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Você indica; a diretoria decide com base no orçamento e responde na janela.
        </p>
        <div className="filters" role="group" aria-label="Setor">
          {SETORES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              aria-pressed={setor === s.id}
              onClick={() => setSetor(s.id)}
            >
              {s.nome}
            </button>
          ))}
        </div>
        <div className="row">
          <select
            aria-label="Divisão"
            value={divisao}
            onChange={(e) => setDivisao(e.target.value as Divisao | "TODAS")}
          >
            <option value="TODAS">Todas as séries</option>
            {(["A", "B", "C", "D"] as Divisao[]).map((d) => (
              <option key={d} value={d}>
                Série {d}
              </option>
            ))}
          </select>
          <select
            aria-label="Valor máximo"
            value={teto ?? ""}
            onChange={(e) => setTeto(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Qualquer valor</option>
            {[0.5, 1, 2, 5, 10].map((v) => (
              <option key={v} value={v}>
                até {formatarDinheiro(v)}
              </option>
            ))}
          </select>
        </div>
        <div className="plist">
          {itens.map(({ jogador, clube, divisao: d, valor }) => (
            <div key={jogador.id} className="prow" style={{ gridTemplateColumns: "38px 1fr auto auto" }}>
              <span className={`pos ${jogador.pos}`}>{jogador.pos}</span>
              <span style={{ minWidth: 0 }}>
                <div className="nm">{jogador.nome}</div>
                <div className="meta">
                  <NomeClube clube={clube} tamanho={13} /> · Série {d} · {formatarDinheiro(valor)}
                </div>
              </span>
              <span className="ovr">{jogador.ovr}</span>
              <button
                type="button"
                className="btn"
                onClick={() => avisar(mexer((j) => indicar(j, jogador.id)))}
              >
                Indicar
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="panel stack">
        <h3>Finanças</h3>
        <dl className="kv">
          <dt>Orçamento</dt>
          <dd>{formatarDinheiro(f.orcamento)}</dd>
          <dt>Dívida</dt>
          <dd>{f.divida}</dd>
          <dt>Presidente</dt>
          <dd>{f.perfil === "economico" ? "econômico" : "normal"}</dd>
          <dt>Ouve o técnico</dt>
          <dd>{f.ouvir}%</dd>
        </dl>
        <h3>Suas indicações</h3>
        {mercado.indicacoes.length === 0 && <p className="vazio">Nenhuma ainda.</p>}
        <ul className="lista-limpa">
          {mercado.indicacoes.map((i) => (
            <li key={i.jogadorId} className="stat-linha">
              <span>
                {i.nome} <span className="muted">· {t.clubes[i.clubeId]?.nome}</span>
              </span>
              <span className={i.status === "contratado" ? "badge" : "muted"}>{i.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Treino() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const c = jogo.carreira;
  const clube = jogo.temporada.clubes[c.clubeId!]!;
  return (
    <section className="panel stack">
      <h2>Treino da semana</h2>
      <div className="tones">
        {(Object.keys(FOCOS) as FocoTreino[]).map((f) => (
          <button
            key={f}
            type="button"
            className="tone"
            aria-pressed={c.treino.foco === f}
            style={
              c.treino.foco === f
                ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }
                : undefined
            }
            onClick={() =>
              mexer(() => {
                c.treino.foco = f;
              })
            }
          >
            <b>{FOCOS[f].nome}</b>
            <span>{FOCOS[f].descricao}</span>
          </button>
        ))}
      </div>
      <div className="field">
        <span className="small" style={{ fontWeight: 600 }}>
          Intensidade
        </span>
        <div className="seg" role="group" aria-label="Intensidade">
          {["Leve", "Normal", "Forte"].map((nome, i) => (
            <button
              key={nome}
              type="button"
              aria-pressed={c.treino.intensidade === i}
              onClick={() =>
                mexer(() => {
                  c.treino.intensidade = i as 0 | 1 | 2;
                })
              }
            >
              {nome}
            </button>
          ))}
        </div>
        <span className="hint">Forte evolui mais e cansa, com mais risco de lesão; leve recupera.</span>
      </div>
      <dl className="kv">
        <dt>Entrosamento</dt>
        <dd>
          {Math.round(c.entrosamento[clube.esquema] ?? 45)}% no {clube.esquema}
        </dd>
      </dl>
    </section>
  );
}

function Comissao() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const c = jogo.carreira;
  const membros = c.comissao.membros;
  return (
    <div className="grade duas">
      <section className="panel stack">
        <h2>Funções</h2>
        {FUNCOES_COMISSAO.map((f) => (
          <div key={f.funcao} className="field">
            <label htmlFor={`f-${f.funcao}`}>{f.nome}</label>
            <select
              id={`f-${f.funcao}`}
              value={c.comissao.funcoes[f.funcao]}
              onChange={(e) => mexer(() => definirFuncao(c, f.funcao, e.target.value))}
            >
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} · {NOME_ATRIBUTO_COMISSAO[f.atributo]} {m.at[f.atributo]}
                </option>
              ))}
            </select>
            <span className="hint">{f.descricao}</span>
          </div>
        ))}
      </section>
      <section className="panel stack">
        <h2>Profissionais</h2>
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th />
                {Object.values(NOME_ATRIBUTO_COMISSAO).map((n) => (
                  <th key={n} title={n}>
                    {n.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td />
                  {(Object.keys(NOME_ATRIBUTO_COMISSAO) as (keyof typeof NOME_ATRIBUTO_COMISSAO)[]).map(
                    (a) => (
                      <td
                        key={a}
                        style={m.at[a] >= 13 ? { fontWeight: 700, color: "var(--good)" } : undefined}
                      >
                        {m.at[a]}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Base() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const c = jogo.carreira;
  const clube = jogo.temporada.clubes[c.clubeId!]!;
  return (
    <section className="panel stack">
      <h2>Base · sub-20</h2>
      <p className="small muted" style={{ margin: 0 }}>
        A avaliação é do coordenador da base: quanto melhor ele, mais certeira. Novos garotos sobem a cada 10
        rodadas.
      </p>
      {c.base.length === 0 && <p className="vazio">Ninguém na base agora.</p>}
      <div className="plist">
        {c.base.map((j) => {
          const avaliacao = avaliarPotencial(c, j, criarRng(hashTexto(j.id)));
          return (
            <div key={j.id} className="stack" style={{ gap: 4 }}>
              <LinhaJogador
                j={j}
                titular={false}
                aoClicar={() => {}}
                extra={`${j.idade} anos · ${avaliacao}`}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const p = mexer(() => promover(c, clube, j.id));
                  if (p) avisar(`${p.nome} foi promovido ao profissional.`);
                }}
              >
                Promover {j.nome.split(" ")[0]}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Carreira() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const abandonar = useLoja((s) => s.abandonar);
  const [confirmando, setConfirmando] = useState<"demissao" | "novo" | null>(null);
  const { carreira: c, mercado: m, temporada: t } = jogo;
  return (
    <div className="grade duas">
      <section className="panel stack">
        <h2>Carreira</h2>
        <dl className="kv">
          <dt>Técnico</dt>
          <dd>{c.tecnico}</dd>
          <dt>Reputação</dt>
          <dd className="num">{Math.round(c.reputacao)}</dd>
          <dt>Jogos</dt>
          <dd>
            {c.historico.length} · {c.historico.filter((h) => h.golsPro > h.golsContra).length} vitórias
          </dd>
        </dl>
        <h3>Passagens</h3>
        <ul className="lista-limpa">
          {m.passagens.map((p) => (
            <li key={`${p.clubeId}${p.temporada}${p.rodada}`} className="stat-linha">
              <NomeClube clube={t.clubes[p.clubeId]!} />
              <span className="muted">
                desde {p.temporada}, rodada {p.rodada + 1}
              </span>
            </li>
          ))}
        </ul>
        <div className="botoes">
          {c.clubeId && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (confirmando === "demissao") mexer((j) => pedirDemissao(j));
                setConfirmando(confirmando === "demissao" ? null : "demissao");
              }}
            >
              {confirmando === "demissao" ? "Confirmar: pedir demissão (reputação cai)" : "Pedir demissão"}
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (confirmando === "novo") void abandonar();
              else setConfirmando("novo");
            }}
          >
            {confirmando === "novo" ? "Confirmar: apagar o save e começar outro" : "Novo jogo"}
          </button>
        </div>
      </section>
      <section className="panel stack">
        <h2>Vagas abertas</h2>
        {m.vagas.length === 0 && <p className="vazio">Nenhum clube sem técnico agora.</p>}
        <ul className="lista-limpa">
          {m.vagas.map((v) => (
            <li key={v.clubeId} className="linha-entre msg">
              <span>
                <NomeClube clube={t.clubes[v.clubeId]!} />{" "}
                <span className="muted small">
                  · Série {divisaoDo(t, v.clubeId)} · exige {exigencia(jogo, v.clubeId)}
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
          ))}
        </ul>
      </section>
    </div>
  );
}

const SECOES: { id: Secao; nome: string; precisaDeClube: boolean }[] = [
  { id: "mercado", nome: "Mercado", precisaDeClube: true },
  { id: "treino", nome: "Treino", precisaDeClube: true },
  { id: "comissao", nome: "Comissão", precisaDeClube: true },
  { id: "base", nome: "Base", precisaDeClube: true },
  { id: "carreira", nome: "Carreira", precisaDeClube: false },
];

export function Clube() {
  const jogo = useJogo();
  const [secao, setSecao] = useState<Secao>("mercado");
  const temClube = !!jogo.carreira.clubeId;
  const disponiveis = SECOES.filter((s) => temClube || !s.precisaDeClube);
  const atual = disponiveis.some((s) => s.id === secao) ? secao : "carreira";
  return (
    <>
      <div className="subabas" role="group" aria-label="Seções do clube">
        {disponiveis.map((s) => (
          <button
            key={s.id}
            type="button"
            className="chip"
            aria-pressed={atual === s.id}
            onClick={() => setSecao(s.id)}
          >
            {s.nome}
          </button>
        ))}
      </div>
      {atual === "mercado" && <Mercado />}
      {atual === "treino" && <Treino />}
      {atual === "comissao" && <Comissao />}
      {atual === "base" && <Base />}
      {atual === "carreira" && <Carreira />}
    </>
  );
}
