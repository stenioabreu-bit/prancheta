"""Gera um pacote jogável por liga estrangeira a partir de dados/elencos-2026.json (auditoria oGol × TM × FC 26).
Uma divisão (A) em pontos corridos, sem acesso/rebaixamento e sem Copa do Brasil.
Uso: python -I tools/dados/gerar_pacotes_exterior.py dados/elencos-2026.json packages/data/packs
"""
import json, os, re, sys, unicodedata

ORIGEM, DESTINO = sys.argv[1], sys.argv[2]
LIGAS = {
    "ARG": ("argentina-2026", "Liga Profesional 2026 (Argentina)"),
    "BOL": ("bolivia-2026", "División Profesional 2026 (Bolívia)"),
    "CHI": ("chile-2026", "Primera División 2026 (Chile)"),
    "COL": ("colombia-2026", "Primera A 2026 (Colômbia)"),
    "EQU": ("equador-2026", "LigaPro 2026 (Equador)"),
    "PAR": ("paraguai-2026", "División de Honor 2026 (Paraguai)"),
    "PER": ("peru-2026", "Liga 1 2026 (Peru)"),
    "URU": ("uruguai-2026", "Liga AUF 2026 (Uruguai)"),
    "VEN": ("venezuela-2026", "Liga FUTVE 2026 (Venezuela)"),
}
MAX_ELENCO = 30
ID_COMPETICAO = {'ARG': 'primera-division-argentina', 'BOL': 'division-profesional-bolivia', 'CHI': 'primera-division-chile', 'COL': 'primera-a-colombia', 'EQU': 'serie-a-equador', 'PAR': 'primera-division-paraguai', 'PER': 'liga-1-peru', 'URU': 'primera-division-uruguai', 'VEN': 'primera-division-venezuela'}


def sigla(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
    palavras = [p for p in re.findall(r"[A-Z]+", s) if p not in {"CLUB", "CA", "CD", "FC", "DE", "LA", "EL", "SC", "CS", "Y"}]
    return (palavras[0][:3] if palavras else s[:3]).ljust(3, "X")


def elenco(jogadores):
    ordem = sorted(jogadores, key=lambda j: -(j["overall"] or 0))
    goleiros = [j for j in ordem if j["posicao"] == "GOL"][:3]
    linha = [j for j in ordem if j["posicao"] != "GOL"][: MAX_ELENCO - len(goleiros)]
    return [[j["nome"], j["posicao"], int(j["overall"] or 60)] for j in goleiros + linha]


dados = json.load(open(ORIGEM, encoding="utf-8"))["clubes"]
for sigla_liga, (pid, nome) in LIGAS.items():
    chave = f"Exterior|{sigla_liga}"
    clubes = [c for c in dados.values() if chave in c["competicoes"]]
    vistos, lista = set(), []
    for c in sorted(clubes, key=lambda c: -sum(sorted((j["overall"] or 0 for j in c["elenco"]), reverse=True)[:16])):
        cid = c.get("pacote_id") or c["ogol"].replace("/", "-")
        if cid in vistos:
            continue
        vistos.add(cid)
        lista.append({"id": cid, "nome": c["nome"], "sigla": sigla(c["nome"]), "elenco": elenco(c["elenco"])})
    n = len(lista)
    turnos = 2 if 2 * (n - 1) <= 38 else 1
    pacote = {
        "formato": 1, "id": pid, "nome": nome, "ficticio": False, "temporada": 2026,
        "divisoes": {"A": lista, "B": [], "C": [], "D": []},
        "vagasDiretasCopa": [], "classicos": [], "semCopa": True,
        "formatos": {"A": {"divisao": "A", "id": ID_COMPETICAO[sigla_liga], "nome": nome.split(" (")[0], "clubes": n,
                           "fases": [{"tipo": "liga", "nome": "Pontos corridos", "grupos": 1, "distribuicao": "unico",
                                      "turnos": turnos, "avancamPorGrupo": 0}],
                           "acesso": [], "rebaixamento": []}},
    }
    os.makedirs(os.path.join(DESTINO, pid), exist_ok=True)
    json.dump(pacote, open(os.path.join(DESTINO, pid, "pacote.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(pid, n, "clubes", turnos, "turno(s)", sum(len(c["elenco"]) for c in lista), "jogadores")
