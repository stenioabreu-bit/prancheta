import {
  type CampoVida,
  type Clube,
  type DilemaAtleta,
  type EstadoJogo,
  type JogoDoAtleta,
  type ResultadoDaDecisao,
  type RitmoAtleta,
  type SituacaoNaCompeticao,
  avancarAtleta,
  clubeDoAtleta,
  competicoesDoClube,
  criarRng,
  dataDoJogo,
  decidirDilema,
  decidirEscalacao,
  dispensarResultado,
  escolherLance,
  formatarDinheiro,
  jogadorDoAtleta,
  lancesPendentes,
  mudarRitmo,
  mudarRotina,
  nomeDaCompeticao,
  notaDaTemporada,
  pendenciaDoAtleta,
  progressoDaTemporada,
  propostasDeTecnico,
  salarioSemanal,
  terminarJogoDoAtleta,
  valorDoAtleta,
  virarTecnico,
} from "@prancheta/engine";
import { useState } from "react";
import { dataDaSemana, dataPorExtenso } from "../componentes/PreJogo";
import { Escudo } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";

type AbaAtleta = "decisao" | "torneios" | "carreira" | "status";

const ABAS: { id: AbaAtleta; nome: string; icone: string }[] = [
  { id: "decisao", nome: "Decisão", icone: "⚡" },
  { id: "torneios", nome: "Torneios", icone: "🏆" },
  { id: "carreira", nome: "Carreira", icone: "☰" },
  { id: "status", nome: "Status", icone: "◎" },
];

const NOMES_VIDA: Record<CampoVida, string> = {
  tecnico: "Confiança do técnico",
  elenco: "Vestiário",
  reputacao: "Reputação",
  fama: "Fama",
  torcida: "Torcida",
  imprensa: "Imprensa",
  empresario: "Agente",
  moral: "Moral",
  forma: "Forma física",
  familia: "Família",
  vicios: "Vícios",
};

/** O que cada indicador muda de verdade no jogo (mesmas regras do motor). */
const EFEITO_VIDA: Record<CampoVida, string> = {
  tecnico:
    "Decide se você é titular, banco ou fica fora da lista, e a chance de entrar no segundo tempo. Muito baixa, você é barrado.",
  elenco: "Pesa para virar capitão e nos convites para ser técnico quando você parar.",
  reputacao:
    "Profissionalismo: abre propostas de clubes maiores e muda seu valor de mercado em até 6% para cima ou para baixo.",
  fama: "Atrai clubes maiores, aumenta salário e valor de mercado e conta para a convocação.",
  torcida: "Sobe com gols e vitórias. Torcida contra pesa nas crises e nas renovações.",
  imprensa: "Define o tom das manchetes e abre a porta da TV no pós-carreira.",
  empresario: "Aumenta a chance de arrancar mais dinheiro em propostas e renovações.",
  moral: "Pesa na escalação e na nota dos jogos. Em baixa, você rende menos.",
  forma:
    "Abaixo de 40, o técnico tira você mais cedo e o risco de lesão dobra. Treino intenso puxa para cima, noitadas puxam para baixo.",
  familia: "Equilíbrio fora de campo: segura a moral nas fases ruins.",
  vicios:
    "Quanto mais alto, menos você evolui na virada da temporada e pior fica a forma. Baixa devagar com vida regrada.",
};

const ORDEM_STATUS: CampoVida[] = [
  "tecnico",
  "elenco",
  "reputacao",
  "fama",
  "torcida",
  "empresario",
  "imprensa",
  "moral",
  "forma",
  "familia",
  "vicios",
];

const RITMOS: { id: RitmoAtleta; nome: string; botao: string; dica: string }[] = [
  { id: "jogo", nome: "Jogo a jogo", botao: "Jogar a semana", dica: "Você decide cada lance e cada dilema." },
  {
    id: "decisivos",
    nome: "Momentos decisivos",
    botao: "Avançar até a próxima decisão",
    dica: "O jogo anda sozinho e para nos lances decisivos e nas decisões grandes.",
  },
  {
    id: "temporada",
    nome: "Temporada",
    botao: "Simular a temporada",
    dica: "Só para nas decisões que mudam a carreira e na virada do ano.",
  },
];

const ESCALACAO: Record<string, string> = {
  titular: "Titular",
  banco: "Banco",
  fora: "Fora da lista",
  lesionado: "Lesionado",
  suspenso: "Suspenso",
};

const CATEGORIA: Record<string, string> = {
  treino: "Treino",
  familia: "Família",
  festa: "Noite",
  relacionamento: "Relacionamento",
  dinheiro: "Dinheiro",
  imprensa: "Imprensa",
  empresario: "Agente",
  vestiario: "Vestiário",
  saude: "Saúde",
  carreira: "Carreira",
};

function dados(jogo: EstadoJogo) {
  const a = jogo.atleta!;
  const clube = clubeDoAtleta(jogo);
  const j = jogadorDoAtleta(jogo);
  return { a, clube, j };
}

function corDoTexto(fundo: string): string {
  const h = fundo.replace("#", "");
  if (h.length < 6) return "#111";
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? "#111" : "#fff";
}

function totaisDaCarreira(jogo: EstadoJogo) {
  const a = jogo.atleta!;
  return a.historico.reduce(
    (s, h) => ({
      jogos: s.jogos + h.jogos,
      gols: s.gols + h.gols,
      assist: s.assist + h.assist,
      titulos: s.titulos + h.titulos.length,
    }),
    { jogos: a.numeros.jogos, gols: a.numeros.gols, assist: a.numeros.assist, titulos: 0 },
  );
}

function sinal(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/* ---------- topo ---------- */

function CartaDoAtleta() {
  const jogo = useJogo();
  const { a, clube, j } = dados(jogo);
  const total = totaisDaCarreira(jogo);
  const fundo = clube.cores.principal;
  return (
    <header className="at-carta" style={{ background: fundo, color: corDoTexto(fundo) }}>
      <b className="at-ovr num">{j.ovr}</b>
      <Escudo clube={clube} tamanho={34} />
      <div className="at-id grow">
        <b>{clube.nome}</b>
        <span>
          {a.nome} · #{a.numero ?? 10} {j.pos}
        </span>
      </div>
      <dl className="at-totais">
        <div>
          <dd className="num">{total.jogos}</dd>
          <dt>Jogos</dt>
        </div>
        <div>
          <dd className="num">{total.gols}</dd>
          <dt>Gols</dt>
        </div>
        <div>
          <dd className="num">{total.assist}</dd>
          <dt>Assist.</dt>
        </div>
      </dl>
    </header>
  );
}

function BarraDaTemporada() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const irParaTela = useLoja((s) => s.irParaTela);
  const [aberto, setAberto] = useState(false);
  const { a } = dados(jogo);
  const { semana, total } = progressoDaTemporada(jogo);
  return (
    <div className="at-barra">
      <button
        type="button"
        className="at-icone at-menu"
        aria-label="Menu inicial"
        onClick={() => irParaTela("menu")}
      >
        ☰
      </button>
      <b className="at-temporada">
        Temporada {a.historico.length + 1} · {a.idade} anos
      </b>
      <span className="at-progresso" role="img" aria-label={`Semana ${semana} de ${total}`}>
        <i style={{ width: `${Math.round((100 * semana) / total)}%` }} />
      </span>
      <button
        type="button"
        className="at-icone"
        aria-label="Ritmo da simulação"
        aria-expanded={aberto}
        onClick={() => setAberto((x) => !x)}
      >
        ⚙
      </button>
      {aberto && (
        <div className="at-ritmos">
          {RITMOS.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={a.ritmo === r.id}
              onClick={() => {
                mexer((j) => mudarRitmo(j, r.id));
                setAberto(false);
              }}
            >
              <b>{r.nome}</b>
              <span className="small muted">{r.dica}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FaixaDeCompeticoes() {
  const jogo = useJogo();
  const { a, clube } = dados(jogo);
  if (a.aposentado) return null;
  const comps = competicoesDoClube(jogo, clube.id);
  if (!comps.length) return null;
  return (
    <div className="at-faixa">
      {comps.map((c) => (
        <span key={c.id} className={c.campeao ? "campeao" : c.eliminado ? "fora" : undefined}>
          {c.nome} <b>{c.resumo}</b>
        </span>
      ))}
    </div>
  );
}

/* ---------- decisões ---------- */

function BarraDeChance({ chance }: { chance: number }) {
  const p = Math.round(chance * 100);
  return (
    <span className="at-chance" role="img" aria-label={`${p}% de chance de dar certo`}>
      <i className="sim" style={{ flexGrow: Math.max(p, 22) }}>
        {p}%
      </i>
      <i className="nao" style={{ flexGrow: Math.max(100 - p, 22) }}>
        {100 - p}%
      </i>
    </span>
  );
}

function CartaoDoDilema({ d, restantes }: { d: DilemaAtleta; restantes: number }) {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  return (
    <article className="at-historia" data-categoria={d.categoria}>
      <div className="at-historia-topo">
        <span className="at-tag">{dataPorExtenso(dataDaSemana(jogo.temporada.rodada))}</span>
        <span className="small">
          {CATEGORIA[d.categoria] ?? d.categoria}
          {d.capital ? " · decisão importante" : ""}
        </span>
        {restantes > 1 && <span className="small muted at-direita">1 de {restantes}</span>}
      </div>
      <h2>{d.titulo}</h2>
      <p>{d.texto}</p>
      <div className="at-opcoes">
        {d.opcoes.map((o, i) => {
          const chance = o.chance ?? 1;
          return (
            <button
              key={o.texto}
              type="button"
              className="at-opcao"
              onClick={() => mexer((j) => decidirDilema(j, d.id, i))}
            >
              <span className="at-opcao-texto">
                <b>{o.texto}</b>
                <span className="small muted">
                  {Math.round(chance * 100)}%
                  {o.dica ? `: ${o.dica}` : chance < 1 ? ": pode não sair como você quer" : ""}
                </span>
              </span>
              <BarraDeChance chance={chance} />
            </button>
          );
        })}
      </div>
    </article>
  );
}

function CartaoDoResultado({ r }: { r: ResultadoDaDecisao }) {
  const mexer = useLoja((s) => s.mexer);
  const jogo = useJogo();
  const mudancas = Object.entries(r.mudancas) as [CampoVida, number][];
  const novoClube = r.contrato ? jogo.temporada.clubes[r.contrato.clubeId] : null;
  return (
    <article className={`at-resultado ${r.certo ? "certo" : "errado"}`}>
      <span className="small at-resultado-titulo">{r.titulo}</span>
      <h2>{r.certo ? "A escolha deu certo" : "A escolha deu errado"}</h2>
      <span className="small at-escolha">{r.escolha}</span>
      <span className="eyebrow">Resultado da história</span>
      <p>{r.texto}</p>
      {(mudancas.length > 0 || r.dinheiro !== 0 || r.contrato) && (
        <ul className="lista-limpa at-efeitos">
          {mudancas.map(([k, v]) => (
            <li key={k}>
              {NOMES_VIDA[k]} <b className={(k === "vicios" ? -v : v) > 0 ? "sobe" : "desce"}>{sinal(v)}</b>
            </li>
          ))}
          {r.dinheiro !== 0 && (
            <li>
              Patrimônio{" "}
              <b className={r.dinheiro > 0 ? "sobe" : "desce"}>
                {r.dinheiro > 0 ? "+" : "−"}
                {formatarDinheiro(Math.abs(r.dinheiro))}
              </b>
            </li>
          )}
          {r.contrato && (
            <li>
              Novo contrato{" "}
              <b>
                {novoClube ? `${novoClube.nome} · ` : ""}
                {formatarDinheiro(r.contrato.salario)}/ano · até {r.contrato.ate}
              </b>
            </li>
          )}
        </ul>
      )}
      {r.futuro && <span className="small at-futuro">A história futura mudou</span>}
      <button type="button" className="at-continuar" onClick={() => mexer((j) => dispensarResultado(j))}>
        Toque para continuar ▸
      </button>
    </article>
  );
}

/* ---------- jogo ---------- */

function PlacarDoJogo({ g }: { g: JogoDoAtleta }) {
  const jogo = useJogo();
  const { clube } = dados(jogo);
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
  const { clube } = dados(jogo);
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
    <section className="at-historia" aria-label="Jogo">
      <div className="at-historia-topo">
        <span className="at-tag">{g.nomeCompeticao}</span>
        <span className="small">
          {g.decisivo ? "Jogo decisivo · " : ""}
          {ESCALACAO[g.escalacao]}
          {g.entrou ? ` (entra aos ${g.entrou}')` : ""}
        </span>
      </div>
      <PlacarDoJogo g={g} />
      {g.minutos === 0 && (
        <p className="muted">
          {g.escalacao === "banco"
            ? "Você ficou no banco o jogo inteiro."
            : g.escalacao === "fora"
              ? "O técnico deixou você fora da lista."
              : `Você está ${ESCALACAO[g.escalacao]!.toLowerCase()}.`}
        </p>
      )}
      <LinhaDoTempo g={g} ate={proximo ? proximo.minuto : 90} comTexto />
      {proximo && (
        <>
          <span className="eyebrow">
            {proximo.minuto}'{proximo.decisivo ? " · lance decisivo" : ""}
          </span>
          <h2>{proximo.texto}</h2>
          <div className="at-opcoes">
            {proximo.opcoes.map((o) => (
              <button
                key={o.id}
                type="button"
                className="at-opcao"
                onClick={() => mexer((j) => escolherLance(j, indice, o.id))}
              >
                <span className="at-opcao-texto">
                  <b>{o.texto}</b>
                </span>
                <BarraDeChance chance={o.chance} />
              </button>
            ))}
          </div>
        </>
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
        <p className="small muted">Os lances menores deste jogo foram decididos sozinhos.</p>
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
  const { a, clube, j } = dados(jogo);
  const t = jogo.temporada;
  const proximo = proximoJogoDoClube(jogo, clube.id);
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
  const provavel = decidirEscalacao({ estado: jogo, a, j, clube, rng: criarRng(1) });
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
  const { a, clube } = dados(jogo);
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

function veredito(melhorOvr: number, gols: number, titulos: number, jogos: number): string {
  if (melhorOvr >= 88 || (melhorOvr >= 85 && titulos >= 8)) return "Lenda";
  if (melhorOvr >= 82 || titulos >= 6) return "Ídolo";
  if (melhorOvr >= 76 || gols >= 150 || jogos >= 450) return "Carreira sólida";
  return "Jornada honesta";
}

function PosCarreira() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const abandonar = useLoja((s) => s.abandonar);
  const a = jogo.atleta!;
  const total = totaisDaCarreira(jogo);
  const melhor = Math.max(0, ...a.historico.map((h) => h.ovr));
  const propostas = propostasDeTecnico(jogo);
  return (
    <section className="at-historia">
      <span className="eyebrow">Relatório da aposentadoria</span>
      <h2 className="at-veredito">{veredito(melhor, total.gols, total.titulos, total.jogos)}</h2>
      <dl className="at-numeros">
        <div>
          <dd className="num">{melhor}</dd>
          <dt>Melhor OVR</dt>
        </div>
        <div>
          <dd className="num">{total.jogos}</dd>
          <dt>Jogos</dt>
        </div>
        <div>
          <dd className="num">{total.gols}</dd>
          <dt>Gols</dt>
        </div>
        <div>
          <dd className="num">{total.assist}</dd>
          <dt>Assist.</dt>
        </div>
        <div>
          <dd className="num">{total.titulos}</dd>
          <dt>Títulos</dt>
        </div>
        <div>
          <dd className="num">{a.convocacoes}</dd>
          <dt>Seleção</dt>
        </div>
      </dl>
      <p>{a.posCarreira}</p>
      {propostas.length > 0 && (
        <>
          <h3>Convites para ser técnico</h3>
          <p className="small muted">
            Aceite um e a carreira continua no mesmo mundo, agora na beira do campo.
          </p>
          <div className="at-opcoes">
            {propostas.map((p) => {
              const clube = jogo.temporada.clubes[p.clubeId]!;
              return (
                <button
                  key={p.clubeId}
                  type="button"
                  className="at-opcao"
                  onClick={() => {
                    if (mexer((j) => virarTecnico(j, p.clubeId)))
                      avisar(`Você é o novo técnico do ${p.nome}.`);
                  }}
                >
                  <span className="row" style={{ gap: 8 }}>
                    <Escudo clube={clube} tamanho={22} />
                    <span className="at-opcao-texto">
                      <b>{p.nome}</b>
                      <span className="small muted">{p.motivo}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <button type="button" className="btn big" onClick={() => void abandonar()}>
        Começar outro jogo
      </button>
    </section>
  );
}

function Decisao() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const a = jogo.atleta!;
  if (a.aposentado) return <PosCarreira />;
  if (a.ultimoResultado) return <CartaoDoResultado r={a.ultimoResultado} />;
  const pend = pendenciaDoAtleta(jogo);
  const ritmo = RITMOS.find((r) => r.id === a.ritmo)!;
  const dilema = a.dilemas[0];
  return (
    <div className="stack">
      {a.jogo ? (
        <JogoEmAndamento g={a.jogo} />
      ) : dilema ? (
        <CartaoDoDilema d={dilema} restantes={a.dilemas.length} />
      ) : (
        <ProximoCompromisso />
      )}
      {!a.jogo && pend !== "dilemas" && (
        <button
          type="button"
          className="btn primary big"
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
          {dilema ? "Seguir e deixar o jogo decidir" : `${ritmo.botao} ⏩`}
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

/* ---------- torneios ---------- */

function TabelaResumida({ s, clube }: { s: SituacaoNaCompeticao; clube: Clube }) {
  const jogo = useJogo();
  const [tudo, setTudo] = useState(false);
  const linhas = s.tabela ?? [];
  const minha = linhas.find((l) => l.clubeId === clube.id);
  const visiveis = tudo
    ? linhas
    : linhas.filter((l) => l.posicao <= 4 || (minha && Math.abs(l.posicao - minha.posicao) <= 1));
  return (
    <>
      <ol className="lista-limpa at-tabela">
        {visiveis.map((l, i) => {
          const c = jogo.temporada.clubes[l.clubeId]!;
          const salto = i > 0 && l.posicao - visiveis[i - 1]!.posicao > 1;
          return (
            <li key={l.clubeId} className={`${l.clubeId === clube.id ? "eu" : ""}${salto ? " salto" : ""}`}>
              <span className="num muted">{l.posicao}</span>
              <Escudo clube={c} tamanho={18} />
              <span className="grow">{c.nome}</span>
              <span className="num muted small">{l.j}j</span>
              <b className="num">{l.pts}</b>
            </li>
          );
        })}
      </ol>
      {(linhas.length > visiveis.length || tudo) && (
        <button type="button" className="btn at-link" onClick={() => setTudo((x) => !x)}>
          {tudo ? "Ver resumo" : "Ver tabela completa"}
        </button>
      )}
    </>
  );
}

function Torneios() {
  const jogo = useJogo();
  const { clube } = dados(jogo);
  const comps = competicoesDoClube(jogo, clube.id);
  if (!comps.length) return <p className="muted">O {clube.nome} não tem competições nesta temporada.</p>;
  return (
    <div className="stack">
      {comps.map((s) => (
        <section key={s.id} className="panel stack">
          <div className="row">
            <h3 className="grow" style={{ margin: 0 }}>
              {s.nome}
            </h3>
            <b className={s.campeao ? "at-campeao" : s.eliminado ? "muted" : undefined}>{s.resumo}</b>
          </div>
          {s.tabela ? (
            <TabelaResumida s={s} clube={clube} />
          ) : (
            <p className="small muted" style={{ margin: 0 }}>
              {s.eliminado ? "Fora da competição." : s.fase ? `Fase atual: ${s.fase}` : "Ainda não estreou."}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

/* ---------- carreira ---------- */

function Carreira() {
  const jogo = useJogo();
  const { a, clube, j } = dados(jogo);
  const t = jogo.temporada;
  const nota = notaDaTemporada(a);
  const inicio = a.historico[0]?.idade ?? a.idade;
  const idades = Array.from({ length: Math.max(0, 40 - inicio + 1) }, (_, k) => inicio + k);
  return (
    <div className="stack">
      <section className="panel" aria-label="Temporadas">
        <table className="at-carreira">
          <thead>
            <tr>
              <th>Idade</th>
              <th>Clube</th>
              <th>OVR</th>
              <th>J</th>
              <th>G</th>
              <th>A</th>
            </tr>
          </thead>
          <tbody>
            {idades.map((idade) => {
              const h = a.historico.find((x) => x.idade === idade);
              if (h) {
                const c = t.clubes[h.clubeId];
                return (
                  <tr key={idade}>
                    <td className="num">{idade}</td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        {c && <Escudo clube={c} tamanho={18} />}
                        <span>
                          {c?.nome ?? h.clubeId}
                          {h.titulos.length > 0 && (
                            <span className="at-trofeus" title={h.titulos.join(", ")}>
                              {" "}
                              🏆 {h.titulos.length}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="at-badge num">{h.ovr}</span>
                    </td>
                    <td className="num">{h.jogos}</td>
                    <td className="num">{h.gols}</td>
                    <td className="num">{h.assist}</td>
                  </tr>
                );
              }
              if (idade === a.idade && !a.aposentado) {
                return (
                  <tr key={idade} className="atual">
                    <td className="num">{idade}</td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        <Escudo clube={clube} tamanho={18} />
                        <span>
                          {clube.nome} <span className="small muted">· em andamento</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="at-badge num">{j.ovr}</span>
                    </td>
                    <td className="num">{a.numeros.jogos}</td>
                    <td className="num">{a.numeros.gols}</td>
                    <td className="num">{a.numeros.assist}</td>
                  </tr>
                );
              }
              return (
                <tr key={idade} className="futuro">
                  <td className="num">{idade}</td>
                  <td>—</td>
                  <td>–</td>
                  <td>–</td>
                  <td>–</td>
                  <td>–</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {nota !== null && (
          <p className="small muted" style={{ margin: "8px 0 0" }}>
            Nota média na temporada: {nota.toFixed(2)} · potencial estimado {a.potencial}
          </p>
        )}
      </section>
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

/* ---------- status ---------- */

function nivelDoValor(campo: CampoVida, v: number): string {
  if (campo === "vicios") return v < 20 ? "Baixo" : v < 45 ? "Atenção" : "Alto";
  return v < 35 ? "Baixo" : v < 65 ? "Normal" : "Alto";
}

function Indicador({ campo }: { campo: CampoVida }) {
  const a = useJogo().atleta!;
  const v = Math.round(a.vida[campo]);
  const ultima = a.ultimaMudanca?.[campo];
  const ruim = campo === "vicios" ? v >= 45 : v < 35;
  return (
    <div className="at-indicador">
      <div className="row">
        <b className="grow">{NOMES_VIDA[campo]}</b>
        {ultima ? (
          <span className={`small ${(campo === "vicios" ? -ultima : ultima) > 0 ? "sobe" : "desce"}`}>
            {ultima > 0 ? "▲" : "▼"} {sinal(ultima)}
          </span>
        ) : (
          <span className="small muted">—</span>
        )}
        <b className="num at-valor">{v}</b>
        <span className="small muted at-nivel-txt">{nivelDoValor(campo, v)}</span>
      </div>
      <span className={`at-medidor${ruim ? " ruim" : ""}`}>
        <i style={{ width: `${v}%` }} />
      </span>
      <p className="small muted">{EFEITO_VIDA[campo]}</p>
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

function Status() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const { a, clube } = dados(jogo);
  const sal = salarioSemanal(a);
  const fixos = a.gastosFixos.reduce((s, g) => s + g.porSemana, 0);
  const titulos = a.historico.flatMap((h) => h.titulos.map((t) => `${t} ${h.temporada}`));
  return (
    <div className="stack">
      <section className="panel stack">
        <dl className="kv">
          <dt>Idade</dt>
          <dd className="num">{a.idade}</dd>
          <dt>Valor</dt>
          <dd className="num">{formatarDinheiro(valorDoAtleta(jogo))}</dd>
          <dt>Contrato</dt>
          <dd>
            {formatarDinheiro(sal)}/sem · até {a.contrato.ate} ({clube.nome})
          </dd>
          <dt>Patrimônio</dt>
          <dd className={a.dinheiro < 0 ? "neg" : undefined}>{formatarDinheiro(a.dinheiro)}</dd>
        </dl>
        <div className="at-galeria">
          {titulos.length ? (
            titulos.map((t) => (
              <span key={t} className="at-trofeu">
                🏆 {t}
              </span>
            ))
          ) : (
            <span className="small muted">GALERIA VAZIA</span>
          )}
        </div>
      </section>
      <section className="panel stack">
        <h2 style={{ margin: 0 }}>Status da carreira</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Suas escolhas mexem nesses valores, e eles mudam seus jogos e suas histórias.
        </p>
        {ORDEM_STATUS.map((c) => (
          <Indicador key={c} campo={c} />
        ))}
      </section>
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
      <section className="panel">
        <dl className="kv">
          <dt>Salário</dt>
          <dd>{formatarDinheiro(a.contrato.salario)} por ano</dd>
          <dt>Gastos fixos</dt>
          <dd>
            {a.gastosFixos.length
              ? a.gastosFixos.map((g) => `${g.motivo} (${formatarDinheiro(g.porSemana)}/sem.)`).join(" · ")
              : "nenhum"}
          </dd>
          <dt>Saldo semanal</dt>
          <dd>{formatarDinheiro(sal - sal * [0.25, 0.5, 0.95][a.rotina.padrao]! - fixos)}</dd>
          <dt>Relacionamento</dt>
          <dd>{{ solteiro: "Solteiro", namorando: "Namorando", casado: "Casado" }[a.relacionamento]}</dd>
          <dt>Filhos</dt>
          <dd>{a.filhos || "nenhum"}</dd>
          <dt>Pé dominante</dt>
          <dd>{a.pe === "esquerdo" ? "Esquerdo" : "Direito"}</dd>
        </dl>
      </section>
    </div>
  );
}

export function AppAtleta() {
  const [aba, setAba] = useState<AbaAtleta>("decisao");
  const a = useJogo().atleta!;
  const avisos = a.dilemas.length + (a.ultimoResultado ? 1 : 0);
  return (
    <div id="app" className="app-atleta">
      <div className="at-topo">
        <CartaDoAtleta />
        <BarraDaTemporada />
      </div>
      <main>
        <FaixaDeCompeticoes />
        {aba === "decisao" && <Decisao />}
        {aba === "torneios" && <Torneios />}
        {aba === "carreira" && <Carreira />}
        {aba === "status" && <Status />}
      </main>
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
              <span aria-hidden="true">{x.icone}</span>
              <b>{x.nome}</b>
              {x.id === "decisao" && avisos > 0 && (
                <span className="contador" aria-label={`${avisos} pendentes`}>
                  {avisos}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
