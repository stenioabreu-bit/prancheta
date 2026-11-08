import type { PacoteDados } from "@prancheta/data";
import { type Clube, type ClubeDados, type Divisao, criarClube, criarRng } from "@prancheta/engine";
import { useEffect, useMemo, useState } from "react";
import { Escudo } from "../componentes/basicos";
import { useLoja } from "../estado/loja";
import {
  type OpcaoDePacote,
  PACOTE_PADRAO,
  carregarPacote,
  importarPasta,
  opcoesDePacote,
  urlsDosEscudos,
} from "../estado/pacotes";

const DIVISOES: Divisao[] = ["A", "B", "C", "D"];

interface Opcao {
  dados: ClubeDados;
  clube: Clube;
  forca: number;
}

/** Mesma regra da diretoria no motor (metaDaTemporada), pela posição de força na série. */
function metaPrevista(divisao: Divisao, rank: number): string {
  if (divisao === "A")
    return rank <= 4
      ? "Brigar pelo G-4"
      : rank <= 8
        ? "Vaga na Libertadores"
        : rank <= 13
          ? "Vaga na Sul-Americana"
          : "Escapar do rebaixamento";
  if (divisao === "B")
    return rank <= 6
      ? "Conquistar o acesso"
      : rank <= 14
        ? "Parte de cima da tabela"
        : "Escapar do rebaixamento";
  if (divisao === "C") return "Classificar entre os 8";
  return "Passar da fase de grupos";
}

function Dossie({ o, divisao, rank, total }: { o: Opcao; divisao: Divisao; rank: number; total: number }) {
  const destaques = o.clube.jogadores
    .slice()
    .sort((a, b) => b.ovr - a.ovr)
    .slice(0, 4);
  return (
    <div className="dossie">
      <div className="dossie-topo">
        <Escudo clube={o.clube} tamanho={88} />
        <div>
          <span className="eyebrow">
            Série {divisao} · {rank}º em força de {total}
          </span>
          <h2 className="dossie-nome">{o.dados.nome}</h2>
          {o.dados.estadio && <span className="muted small">{o.dados.estadio}</span>}
        </div>
      </div>
      <dl className="dossie-ficha">
        <div>
          <dt>Força</dt>
          <dd className="num">{o.forca}</dd>
        </div>
        <div>
          <dt>Esquema</dt>
          <dd>{o.clube.esquema}</dd>
        </div>
        <div>
          <dt>Elenco</dt>
          <dd className="num">{o.clube.jogadores.length}</dd>
        </div>
        <div>
          <dt>Diretoria quer</dt>
          <dd>{metaPrevista(divisao, rank)}</dd>
        </div>
      </dl>
      {o.dados.tecnico && (
        <p className="small muted" style={{ margin: 0 }}>
          Técnico atual: {o.dados.tecnico}
        </p>
      )}
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Principais jogadores</span>
        {destaques.map((j) => (
          <div key={j.id} className="dossie-jog">
            <span className={`pos ${j.pos}`}>{j.pos}</span>
            <span>{j.nome}</span>
            <b className="num">{j.ovr}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NovoJogo() {
  const comecar = useLoja((s) => s.comecar);
  const avisar = useLoja((s) => s.avisar);
  const [opcoes, setOpcoes] = useState<OpcaoDePacote[]>([]);
  const [pacoteId, setPacoteId] = useState(PACOTE_PADRAO);
  const [pacote, setPacote] = useState<PacoteDados | null>(null);
  const [tecnico, setTecnico] = useState("");
  const [divisao, setDivisao] = useState<Divisao>("A");
  const [clubeId, setClubeId] = useState<string | null>(null);
  const [comecando, setComecando] = useState(false);

  useEffect(() => void opcoesDePacote().then(setOpcoes), []);
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

  const clubes = useMemo<Opcao[]>(() => {
    if (!pacote) return [];
    return pacote.divisoes[divisao]
      .map((dados) => {
        const clube = criarClube(dados, criarRng(1));
        return { dados, clube, forca: Math.round(clube.forca) };
      })
      .sort((a, b) => b.forca - a.forca);
  }, [pacote, divisao]);
  const escolhido = clubes.find((c) => c.dados.id === clubeId) ?? null;

  async function importar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    try {
      const p = await importarPasta(arquivos);
      setOpcoes(await opcoesDePacote());
      setPacoteId(p.pacote.id);
    } catch (e) {
      avisar((e as Error).message);
    }
  }

  const pode = tecnico.trim().length > 0 && !!escolhido && !comecando;
  return (
    <div className="carreira-nova">
      <header className="cn-topo">
        <span className="marca">Prancheta</span>
        <span className="cn-passo">Nova carreira · temporada {pacote?.temporada ?? ""}</span>
        <label className="cn-base">
          <span className="small muted">Liga:</span>
          <select value={pacoteId} onChange={(e) => setPacoteId(e.target.value)}>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="cn-importar">
          Importar
          <input
            type="file"
            hidden
            multiple
            {...{ webkitdirectory: "" }}
            onChange={(e) => void importar(e.target.files)}
          />
        </label>
      </header>

      <div className="cn-corpo">
        <section className="cn-lista" aria-label="Clubes">
          <div className="seg" role="group" aria-label="Divisão">
            {DIVISOES.map((d) => (
              <button key={d} type="button" aria-pressed={divisao === d} onClick={() => setDivisao(d)}>
                Série {d}
              </button>
            ))}
          </div>
          <div className="cn-grade">
            {clubes.map((o) => (
              <button
                key={o.dados.id}
                type="button"
                className="cn-clube"
                aria-pressed={clubeId === o.dados.id}
                onClick={() => setClubeId(o.dados.id)}
              >
                <Escudo clube={o.clube} tamanho={40} />
                <span className="cn-clube-nome">{o.dados.nome}</span>
                <span
                  className="cn-forca"
                  style={{ ["--f" as string]: `${Math.max(0, (o.forca - 45) * 2.6)}%` }}
                >
                  <b className="num">{o.forca}</b>
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="cn-lado">
          {escolhido ? (
            <Dossie
              o={escolhido}
              divisao={divisao}
              rank={clubes.indexOf(escolhido) + 1}
              total={clubes.length}
            />
          ) : (
            <div className="dossie vazio-dossie">
              <span className="eyebrow">Nenhum clube escolhido</span>
              <p className="muted">
                Escolha um clube na lista para ver elenco, força e o que a diretoria espera.
              </p>
            </div>
          )}
          <div className="cn-contrato">
            <label htmlFor="tecnico">Nome do técnico</label>
            <input
              id="tecnico"
              className="inp"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              maxLength={40}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn primary big"
              disabled={!pode}
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
              {comecando
                ? "Preparando…"
                : escolhido
                  ? `Assinar com o ${escolhido.dados.nome}`
                  : "Assinar contrato"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
