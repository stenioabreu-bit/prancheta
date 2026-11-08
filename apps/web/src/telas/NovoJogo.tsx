import type { PacoteDados } from "@prancheta/data";
import { type Divisao, criarClube, criarRng } from "@prancheta/engine";
import { useEffect, useMemo, useState } from "react";
import { Escudo } from "../componentes/basicos";
import { useLoja } from "../estado/loja";
import {
  ID_FICTICIO,
  type OpcaoDePacote,
  carregarPacote,
  importarPasta,
  opcoesDePacote,
  urlsDosEscudos,
} from "../estado/pacotes";

const DIVISOES: Divisao[] = ["A", "B", "C", "D"];

export function NovoJogo() {
  const comecar = useLoja((s) => s.comecar);
  const avisar = useLoja((s) => s.avisar);
  const [opcoes, setOpcoes] = useState<OpcaoDePacote[]>([]);
  const [pacoteId, setPacoteId] = useState(ID_FICTICIO);
  const [pacote, setPacote] = useState<PacoteDados | null>(null);
  const [tecnico, setTecnico] = useState("");
  const [divisao, setDivisao] = useState<Divisao>("A");
  const [clubeId, setClubeId] = useState<string | null>(null);
  const [comecando, setComecando] = useState(false);

  useEffect(() => {
    void opcoesDePacote().then(setOpcoes);
  }, []);
  useEffect(() => {
    let ativo = true;
    void carregarPacote(pacoteId).then(({ pacote: p, escudos }) => {
      if (!ativo) return;
      setPacote(p);
      setClubeId(null);
      useLoja.setState({ escudos: urlsDosEscudos(escudos) });
    });
    return () => {
      ativo = false;
    };
  }, [pacoteId]);

  const clubes = useMemo(() => {
    if (!pacote) return [];
    return pacote.divisoes[divisao]
      .map((dados) => {
        const clube = criarClube(dados, criarRng(1));
        return { dados, clube, forca: Math.round(clube.forca) };
      })
      .sort((a, b) => b.forca - a.forca);
  }, [pacote, divisao]);

  async function importar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    try {
      const p = await importarPasta(arquivos);
      setOpcoes(await opcoesDePacote());
      setPacoteId(p.pacote.id);
      avisar(`Pacote "${p.pacote.nome}" importado (${Object.keys(p.escudos).length} escudos).`);
    } catch (e) {
      avisar((e as Error).message);
    }
  }

  const podeComecar = tecnico.trim().length > 0 && !!clubeId && !comecando;
  return (
    <div id="app" style={{ display: "block" }}>
      <main>
        <div className="capa">
          <span className="eyebrow">Jogo de técnico · futebol brasileiro</span>
          <h1>Prancheta</h1>
          <p className="muted">
            Você é só o técnico: escala, treina, conversa e indica reforços. Quem paga é a diretoria.
          </p>
        </div>
        <div className="grade lateral">
          <section className="panel stack">
            <div className="field">
              <label htmlFor="tecnico">Seu nome</label>
              <input
                id="tecnico"
                className="inp"
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                placeholder="Como a imprensa vai te chamar"
                maxLength={40}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="pacote">Pacote de dados</label>
              <select id="pacote" value={pacoteId} onChange={(e) => setPacoteId(e.target.value)}>
                {opcoes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                    {o.escudos ? ` · ${o.escudos} escudos` : ""}
                  </option>
                ))}
              </select>
              <span className="hint">
                Tem seu próprio pacote? Escolha a pasta com o <code>pacote.json</code> (e a pasta{" "}
                <code>escudos/</code>, se tiver). Tudo fica só neste navegador.
              </span>
              <label className="btn" style={{ textAlign: "center" }}>
                Importar pasta do pacote
                <input
                  type="file"
                  hidden
                  multiple
                  // @ts-expect-error atributo não padrão, suportado pelos navegadores
                  webkitdirectory=""
                  onChange={(e) => void importar(e.target.files)}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn primary big"
              disabled={!podeComecar}
              onClick={async () => {
                setComecando(true);
                try {
                  await comecar({ pacoteId, tecnico, clubeId: clubeId! });
                } catch (e) {
                  avisar((e as Error).message);
                  setComecando(false);
                }
              }}
            >
              {comecando ? "Preparando a temporada…" : "Assumir o clube"}
            </button>
            <p className="small muted" style={{ margin: 0 }}>
              Seu clube entra garantido na Copa do Brasil da primeira temporada.
            </p>
          </section>
          <section className="panel stack" aria-label="Escolha do clube">
            <div className="stack" style={{ gap: 8 }}>
              <h3>Escolha o clube</h3>
              <div className="filters" role="group" aria-label="Divisão">
                {DIVISOES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="chip"
                    aria-pressed={divisao === d}
                    onClick={() => setDivisao(d)}
                  >
                    Série {d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {clubes.map(({ dados, clube, forca }) => (
                <button
                  key={dados.id}
                  type="button"
                  className="clube-opcao"
                  aria-pressed={clubeId === dados.id}
                  onClick={() => setClubeId(dados.id)}
                >
                  <Escudo clube={clube} tamanho={26} />
                  <span>{dados.nome}</span>
                  <span className="num muted" title="Força média dos titulares">
                    {forca}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
