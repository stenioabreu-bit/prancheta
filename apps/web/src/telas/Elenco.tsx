import {
  ATRIBUTOS,
  type Jogador,
  conversar,
  devolverABase,
  divisaoDo,
  formatarDinheiro,
  indicarVenda,
  opcoesDeConversa,
  salario,
  setorDaPosicao,
  valorDeMercado,
} from "@prancheta/engine";
import { useState } from "react";
import { Atributo, Folha } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";

export const NOME_ATRIBUTO: Record<(typeof ATRIBUTOS)[number], string> = {
  ATQ: "Talento ofensivo",
  FIN: "Finalização",
  CTL: "Controle/drible",
  PAS: "Passe",
  VEL: "Velocidade",
  FIS: "Força",
  RES: "Resistência",
  DEF: "Defesa",
  CAB: "Jogo aéreo",
  GOL: "Goleiro",
};

export const NOME_PERSONALIDADE: Record<Jogador["perso"], string> = {
  profissional: "Profissional",
  temperamental: "Temperamental",
  lider: "Líder",
  jovem: "Jovem",
  veterano: "Veterano",
  tranquilo: "Tranquilo",
};

const SETORES = [
  { id: "TODOS", nome: "Todos" },
  { id: "GOL", nome: "Goleiros" },
  { id: "DEF", nome: "Defesa" },
  { id: "MEIO", nome: "Meio" },
  { id: "ATA", nome: "Ataque" },
] as const;

const ORDEM_POSICAO = ["GOL", "LD", "ZAG", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"];

export function LinhaJogador({
  j,
  titular,
  aoClicar,
  extra,
}: { j: Jogador; titular: boolean; aoClicar: () => void; extra?: string }) {
  return (
    <button type="button" className="prow" onClick={aoClicar}>
      <span className={`pos ${j.pos}`}>{j.pos}</span>
      <span style={{ minWidth: 0 }}>
        <div className="nm">
          {j.nome} {titular && <span className="tag xi">XI</span>}{" "}
          {j.lesao > 0 && (
            <span className="tag les" title={`Lesionado por ${j.lesao} rodada(s)`}>
              ✚ {j.lesao}
            </span>
          )}{" "}
          {j.susp > 0 && <span className="cartao-susp" title={`Suspenso por ${j.susp} jogo(s)`} />}
        </div>
        <div className="meta">
          {extra ??
            `${j.idade ? `${j.idade} anos · ` : ""}${NOME_PERSONALIDADE[j.perso]} · moral ${j.moral} · ${j.temporada.jogos} j · ${j.temporada.gols} g`}
        </div>
      </span>
      <span className="cond" title={`Condição ${j.cond}%`} aria-label={`Condição ${j.cond}%`}>
        <i style={{ width: `${j.cond}%`, background: j.cond < 70 ? "var(--gold)" : undefined }} />
      </span>
      <span className="ovr">{j.ovr}</span>
    </button>
  );
}

function FichaDoJogador({ jogadorId, aoFechar }: { jogadorId: string; aoFechar: () => void }) {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const [reacoes, setReacoes] = useState<string[]>([]);
  const clube = jogo.temporada.clubes[jogo.carreira.clubeId!]!;
  const j = clube.jogadores.find((x) => x.id === jogadorId);
  if (!j) return null;
  const media = j.temporada.qtdNotas ? (j.temporada.somaNotas / j.temporada.qtdNotas).toFixed(2) : "—";
  const promessa = jogo.carreira.promessas.find((p) => p.jogadorId === j.id && p.status === "aberta");
  const valor = valorDeMercado(j, divisaoDo(jogo.temporada, clube.id));
  return (
    <Folha titulo={j.nome} aoFechar={aoFechar}>
      <div className="row small muted" style={{ flexWrap: "wrap" }}>
        <span className={`pos ${j.pos}`} style={{ padding: "3px 6px" }}>
          {j.pos}
        </span>
        {j.alt.length > 0 && <span>também {j.alt.join(", ")}</span>}
        <span>· {NOME_PERSONALIDADE[j.perso]}</span>
        {j.idade && <span>· {j.idade} anos</span>}
        <span>
          · overall <b className="num">{j.ovr}</b>
        </span>
      </div>
      <dl className="kv">
        <dt>Moral</dt>
        <dd className="num">{j.moral}</dd>
        <dt>Condição</dt>
        <dd className="num">{j.cond}%</dd>
        <dt>Temporada</dt>
        <dd>
          {j.temporada.jogos} jogos · {j.temporada.gols} gols · {j.temporada.assist} assist. · nota {media}
        </dd>
        <dt>Mercado</dt>
        <dd>
          {formatarDinheiro(valor)} · salário R$ {salario(j)} mil
        </dd>
        {promessa && (
          <>
            <dt>Promessa</dt>
            <dd>
              {promessa.tipo === "minutos" ? "minutos" : "titularidade"}: {promessa.feitos}/{promessa.meta}{" "}
              até a rodada {promessa.ate}
            </dd>
          </>
        )}
      </dl>
      <div className="stack" style={{ gap: 6 }}>
        {ATRIBUTOS.filter((a) => j.pos === "GOL" || a !== "GOL").map((a) => (
          <Atributo key={a} nome={NOME_ATRIBUTO[a]} valor={j.at[a]} />
        ))}
      </div>
      <h3>Conversar</h3>
      <div className="stack" style={{ gap: 6 }}>
        {opcoesDeConversa(clube, j).map((o) => (
          <button
            key={o.assunto}
            type="button"
            className="btn"
            style={{ textAlign: "left" }}
            onClick={() =>
              setReacoes(mexer((jg) => conversar(jg.carreira, clube, jg.temporada.rodada, j.id, o.assunto)))
            }
          >
            {o.texto}
          </button>
        ))}
        {reacoes.length > 0 && (
          <div className="resposta" role="status">
            {reacoes.join(" ")}
          </div>
        )}
      </div>
      <button type="button" className="btn" onClick={() => avisar(mexer((jg) => indicarVenda(jg, j.id)))}>
        Indicar venda à diretoria
      </button>
      {j.daBase && !clube.titulares.includes(j.id) && (
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (mexer((jg) => devolverABase(jg.carreira, clube, j.id))) {
              avisar(`${j.nome} voltou para a base.`);
              aoFechar();
            }
          }}
        >
          Devolver para a base
        </button>
      )}
    </Folha>
  );
}

export function Elenco() {
  const jogo = useJogo();
  const [setor, setSetor] = useState<(typeof SETORES)[number]["id"]>("TODOS");
  const [aberto, setAberto] = useState<string | null>(null);
  const clubeId = jogo.carreira.clubeId;
  if (!clubeId) return <p className="vazio">Sem clube, sem elenco.</p>;
  const clube = jogo.temporada.clubes[clubeId]!;
  const lista = clube.jogadores
    .filter((j) => setor === "TODOS" || setorDaPosicao(j.pos) === setor)
    .sort((a, b) => ORDEM_POSICAO.indexOf(a.pos) - ORDEM_POSICAO.indexOf(b.pos) || b.ovr - a.ovr);
  return (
    <section className="panel stack">
      <div className="linha-entre" style={{ flexWrap: "wrap" }}>
        <h2>Elenco · {clube.jogadores.length}</h2>
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
      </div>
      <div className="plist">
        {lista.map((j) => (
          <LinhaJogador
            key={j.id}
            j={j}
            titular={clube.titulares.includes(j.id)}
            aoClicar={() => setAberto(j.id)}
          />
        ))}
      </div>
      {aberto && <FichaDoJogador jogadorId={aberto} aoFechar={() => setAberto(null)} />}
    </section>
  );
}
