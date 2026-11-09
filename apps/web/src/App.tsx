import { dataDaSemana, dataPorExtenso } from "./componentes/PreJogo";
import { PreJogo } from "./componentes/PreJogo";
import { Acessos, Comemoracao } from "./componentes/Comemoracao";
import { Noticias } from "./telas/Noticias";
import { divisaoDo, motivacaoDoGrupo, nomeDaCompeticao, pendentes } from "@prancheta/engine";
import { useEffect, useState } from "react";
import { Aviso, Escudo, Medidor } from "./componentes/basicos";
import { type Aba, useJogo, useLoja } from "./estado/loja";
import { Base, Carreira, Comissao, Mercado, SituacaoFinanceira, Treino } from "./telas/Clube";
import { Olheiro } from "./telas/Olheiro";
import { Elenco } from "./telas/Elenco";
import { Inicio } from "./telas/Inicio";
import { MenuInicial } from "./telas/MenuInicial";
import { NovoJogo } from "./telas/NovoJogo";
import { Partida } from "./telas/Partida";
import { Tabela } from "./telas/Tabela";
import { Tatica } from "./telas/Tatica";

interface GrupoDoMenu {
  id: string;
  nome: string;
  dica: string;
  /** Subseções (abre um popup para escolher); sem subseções, vai direto. */
  itens: { id: Aba; nome: string; dica: string }[];
}

const MENU: GrupoDoMenu[] = [
  {
    id: "inicio",
    nome: "Início",
    dica: "Caixa e jogos",
    itens: [{ id: "inicio", nome: "Início", dica: "" }],
  },
  {
    id: "mercado",
    nome: "Mercado",
    dica: "Transferências",
    itens: [
      { id: "mercado", nome: "Mercado", dica: "Jogadores, orçamento e indicações" },
      { id: "olheiro", nome: "Olheiro", dica: "Missões e relatórios" },
      { id: "financas", nome: "Situação financeira", dica: "Caixa, dívida, receitas e movimentações" },
    ],
  },
  {
    id: "elenco",
    nome: "Elenco",
    dica: "Time e staff",
    itens: [
      { id: "elenco", nome: "Elenco", dica: "Jogadores, moral e condição" },
      { id: "tatica", nome: "Tática", dica: "Escalação e instruções" },
      { id: "treino", nome: "Treino", dica: "Foco e intensidade da semana" },
      { id: "comissao", nome: "Comissão", dica: "Quem cuida de cada área" },
      { id: "base", nome: "Base", dica: "Garotos e promoções" },
    ],
  },
  { id: "tabela", nome: "Comp", dica: "Tabelas", itens: [{ id: "tabela", nome: "Competições", dica: "" }] },
  {
    id: "noticias",
    nome: "Notícias",
    dica: "Matérias",
    itens: [{ id: "noticias", nome: "Notícias", dica: "" }],
  },
  {
    id: "carreira",
    nome: "Carreira",
    dica: "Histórico",
    itens: [{ id: "carreira", nome: "Carreira", dica: "" }],
  },
];

function Topo() {
  const jogo = useJogo();
  const { carreira, temporada } = jogo;
  const clube = carreira.clubeId ? temporada.clubes[carreira.clubeId] : null;
  const divisao = clube ? divisaoDo(temporada, clube.id) : null;
  return (
    <header className="top">
      <div className="crestbox">
        {clube ? <Escudo clube={clube} tamanho={40} /> : <div className="crest">—</div>}
      </div>
      <div className="grow">
        <h1>{clube ? clube.nome : "Sem clube"}</h1>
        <div className="sub">
          {carreira.tecnico}
          {divisao ? ` · ${nomeDaCompeticao(temporada, divisao)}` : " · desempregado"} · {temporada.temporada}{" "}
          · {dataPorExtenso(dataDaSemana(temporada.rodada))}
        </div>
      </div>
      {clube && (
        <div className="stack" style={{ gap: 6 }}>
          <Medidor rotulo="Diretoria" valor={carreira.diretoria} />
          <Medidor rotulo="Torcida" valor={carreira.torcida} />
          <Medidor rotulo="Grupo" valor={motivacaoDoGrupo(clube)} />
        </div>
      )}
    </header>
  );
}

function Menu() {
  const aba = useLoja((s) => s.aba);
  const irPara = useLoja((s) => s.irPara);
  const jogo = useJogo();
  const naoLidas = pendentes(jogo.carreira);
  const [aberto, setAberto] = useState<GrupoDoMenu | null>(null);
  return (
    <>
      <nav className="tabs" aria-label="Seções">
        <div className="in">
          {MENU.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-current={g.itens.some((x) => x.id === aba) ? "page" : undefined}
              aria-haspopup={g.itens.length > 1 ? "dialog" : undefined}
              onClick={() => (g.itens.length > 1 ? setAberto(g) : irPara(g.itens[0]!.id))}
            >
              <b>{g.nome}</b>
              <span>
                {g.id === "inicio" && naoLidas > 0 ? (
                  <span className="contador" aria-label={`${naoLidas} pendentes`}>
                    {naoLidas}
                  </span>
                ) : (
                  g.dica
                )}
              </span>
            </button>
          ))}
        </div>
      </nav>
      {aberto && (
        <div
          className="modal-desfocado"
          role="dialog"
          aria-modal="true"
          aria-label={aberto.nome}
          onClick={(e) => e.target === e.currentTarget && setAberto(null)}
        >
          <div className="modal-simulacao submenu">
            <button
              type="button"
              className="fechar-x canto"
              aria-label="Fechar"
              onClick={() => setAberto(null)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h2>{aberto.nome}</h2>
            {aberto.itens.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`btn big opcao-sim${aba === x.id ? " primary" : ""}`}
                onClick={() => {
                  irPara(x.id);
                  setAberto(null);
                }}
              >
                {x.nome}
                <span className="small muted">{x.dica}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Tela() {
  const aba = useLoja((s) => s.aba);
  const semClube = !useJogo().carreira.clubeId;
  if (semClube && ["mercado", "olheiro", "financas", "treino", "comissao", "base"].includes(aba))
    return <Carreira />;
  if (aba === "mercado") return <Mercado />;
  if (aba === "olheiro") return <Olheiro />;
  if (aba === "financas") return <SituacaoFinanceira />;
  if (aba === "treino") return <Treino />;
  if (aba === "comissao") return <Comissao />;
  if (aba === "base") return <Base />;
  if (aba === "elenco") return <Elenco />;
  if (aba === "tatica") return <Tatica />;
  if (aba === "tabela") return <Tabela />;
  if (aba === "noticias") return <Noticias />;
  if (aba === "carreira") return <Carreira />;
  return <Inicio />;
}

export function App() {
  const pronto = useLoja((s) => s.pronto);
  const temJogo = useLoja((s) => !!s.jogo);
  const tela = useLoja((s) => s.tela);
  const emPartida = useLoja((s) => s.emPartida);
  const preJogo = useLoja((s) => s.preJogo);
  const iniciar = useLoja((s) => s.iniciar);
  useEffect(() => {
    void iniciar();
  }, [iniciar]);

  if (!pronto)
    return (
      <p className="vazio" style={{ padding: 24 }}>
        Carregando…
      </p>
    );
  if (tela === "menu") {
    return (
      <>
        <MenuInicial />
        <Aviso />
      </>
    );
  }
  if (!temJogo || tela === "novo") {
    return (
      <>
        <NovoJogo />
        <Aviso />
      </>
    );
  }
  return (
    <>
      <div id="app">
        <Topo />
        <Menu />
        <main>
          {!emPartida && preJogo && <PreJogo />}
          <Tela />
        </main>
      </div>
      {emPartida && <Partida />}
      {!emPartida && <Comemoracao />}
      {!emPartida && <Acessos />}
      <Aviso />
    </>
  );
}
