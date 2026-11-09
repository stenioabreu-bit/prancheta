import { dataDaSemana, dataPorExtenso } from "./componentes/PreJogo";
import { PreJogo } from "./componentes/PreJogo";
import { Acessos, Comemoracao } from "./componentes/Comemoracao";
import { Noticias } from "./telas/Noticias";
import { divisaoDo, motivacaoDoGrupo, nomeDaCompeticao, pendentes } from "@prancheta/engine";
import { useEffect } from "react";
import { Aviso, Escudo, Medidor } from "./componentes/basicos";
import { type Aba, useJogo, useLoja } from "./estado/loja";
import { Carreira, Clube } from "./telas/Clube";
import { Elenco } from "./telas/Elenco";
import { Inicio } from "./telas/Inicio";
import { MenuInicial } from "./telas/MenuInicial";
import { NovoJogo } from "./telas/NovoJogo";
import { Partida } from "./telas/Partida";
import { Tabela } from "./telas/Tabela";
import { Tatica } from "./telas/Tatica";

const ABAS: { id: Aba; nome: string; dica: string }[] = [
  { id: "inicio", nome: "Portal", dica: "Caixa e jogos" },
  { id: "clube", nome: "Clube", dica: "Mercado e equipe" },
  { id: "elenco", nome: "Elenco", dica: "Jogadores" },
  { id: "tatica", nome: "Tática", dica: "Escalação" },
  { id: "tabela", nome: "Competições", dica: "Tabelas" },
  { id: "noticias", nome: "Notícias", dica: "Matérias" },
  { id: "carreira", nome: "Carreira", dica: "Histórico" },
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
  return (
    <nav className="tabs" aria-label="Seções">
      <div className="in">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-current={aba === a.id ? "page" : undefined}
            onClick={() => irPara(a.id)}
          >
            <b>{a.nome}</b>
            <span>
              {a.id === "clube" && naoLidas > 0 ? (
                <span className="contador" aria-label={`${naoLidas} pendentes`}>
                  {naoLidas}
                </span>
              ) : (
                a.dica
              )}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function Tela() {
  const aba = useLoja((s) => s.aba);
  if (aba === "clube") return <Clube />;
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
