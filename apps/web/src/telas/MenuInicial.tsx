import { semanasDaTemporada } from "@prancheta/engine";
import { useLoja } from "../estado/loja";
import logo from "../imagens/logo.webp";

export function MenuInicial() {
  const jogo = useLoja((s) => s.jogo);
  const irParaTela = useLoja((s) => s.irParaTela);
  const clube = jogo?.carreira.clubeId ? jogo.temporada.clubes[jogo.carreira.clubeId] : null;
  return (
    <div className="menu-inicial">
      <img className="menu-logo" src={logo} alt="" width={260} height={260} />
      <h1 className="menu-titulo">Projeto Prancheta 2027</h1>
      <nav className="menu-opcoes" aria-label="Menu inicial">
        {jogo && (
          <button type="button" className="btn primary big" onClick={() => irParaTela("jogo")}>
            Continuar
            <span className="menu-save">
              {jogo.carreira.tecnico} · {clube?.nome ?? "sem clube"} · {jogo.temporada.temporada}, rodada{" "}
              {Math.min(jogo.temporada.rodada + 1, semanasDaTemporada(jogo.temporada))}
            </span>
          </button>
        )}
        <button
          type="button"
          className={jogo ? "btn big" : "btn primary big"}
          onClick={() => irParaTela("novo")}
        >
          Novo jogo
        </button>
        {jogo && <p className="small muted menu-aviso">Começar um jogo novo substitui o save atual.</p>}
      </nav>
    </div>
  );
}
