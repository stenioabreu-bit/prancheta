"""Gera o pacote de ligas do mundo do modo jogador a partir de dados/FC26.csv (EA FC 26).
Cada liga vira um campeonato de pontos corridos jogado em paralelo ao pacote base, sem acesso/rebaixamento.
Uso: python -I tools/dados/gerar_mundo.py dados/FC26.csv packages/data/packs/mundo/mundo.json
"""
import csv, json, os, re, sys, unicodedata
from collections import defaultdict

ORIGEM, DESTINO = sys.argv[1], sys.argv[2]

# league_id do FC 26 → (código, nome, país, nível)
LIGAS = {
    "13": ("ENG", "Premier League", "Inglaterra", 1),
    "14": ("ENG2", "Championship", "Inglaterra", 2),
    "53": ("ESP", "La Liga", "Espanha", 1),
    "54": ("ESP2", "La Liga 2", "Espanha", 2),
    "31": ("ITA", "Serie A", "Itália", 1),
    "32": ("ITA2", "Serie B", "Itália", 2),
    "19": ("GER", "Bundesliga", "Alemanha", 1),
    "20": ("GER2", "2. Bundesliga", "Alemanha", 2),
    "16": ("FRA", "Ligue 1", "França", 1),
    "17": ("FRA2", "Ligue 2", "França", 2),
    "308": ("POR", "Liga Portugal", "Portugal", 1),
    "10": ("NED", "Eredivisie", "Países Baixos", 1),
    "4": ("BEL", "Pro League", "Bélgica", 1),
    "68": ("TUR", "Süper Lig", "Turquia", 1),
    "50": ("SCO", "Premiership", "Escócia", 1),
    "350": ("SAU", "Saudi Pro League", "Arábia Saudita", 1),
    "39": ("EUA", "MLS", "Estados Unidos", 1),
    "353": ("ARG", "Liga Profesional", "Argentina", 1),
}

POSICAO = {
    "GK": "GOL", "CB": "ZAG", "LB": "LE", "LWB": "LE", "RB": "LD", "RWB": "LD", "CDM": "VOL", "CM": "MC",
    "CAM": "MEI", "LM": "PE", "LW": "PE", "RM": "PD", "RW": "PD", "ST": "ATA", "CF": "ATA",
}
MAX_ELENCO = 26
IGNORAR_SIGLA = {"CLUB", "CA", "CD", "FC", "AFC", "SC", "CF", "SV", "AC", "AS", "SS", "US", "RC", "RCD", "UD", "SD",
                 "DE", "LA", "EL", "THE", "OF", "Y", "VFB", "VFL", "TSG", "FSV", "BSC", "SSC", "OGC", "STADE", "REAL"}


def slug(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def sigla(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
    palavras = [p for p in re.findall(r"[A-Z]+", s) if p not in IGNORAR_SIGLA and len(p) > 1]
    return (palavras[0][:3] if palavras else s.replace(" ", "")[:3]).ljust(3, "X")


def numero(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None


linhas = list(csv.DictReader(open(ORIGEM, encoding="utf-8")))
por_clube = defaultdict(list)
for j in linhas:
    lid = str(numero(j["league_id"]) or "")
    if lid in LIGAS and j["club_name"]:
        por_clube[(lid, j["club_name"])].append(j)


def elenco(jogadores):
    ordem = sorted(jogadores, key=lambda j: -(numero(j["overall"]) or 0))
    def pos(j):
        return POSICAO.get(j["player_positions"].split(",")[0].strip(), "MC")
    goleiros = [j for j in ordem if pos(j) == "GOL"][:3]
    linha = [j for j in ordem if pos(j) != "GOL"][: MAX_ELENCO - len(goleiros)]
    saida = []
    for j in goleiros + linha:
        extras = {}
        if numero(j["age"]):
            extras["idade"] = numero(j["age"])
        if j["nationality_name"]:
            extras["nac"] = j["nationality_name"]
        saida.append([j["short_name"], pos(j), numero(j["overall"]) or 60, extras])
    return saida


ligas = []
for lid, (codigo, nome, pais, nivel) in LIGAS.items():
    clubes = []
    for (l, clube), jogs in por_clube.items():
        if l != lid or len(jogs) < 16:
            continue
        el = elenco(jogs)
        forca = sum(sorted((p[2] for p in el), reverse=True)[:16]) / 16
        clubes.append((forca, {"id": f"m-{slug(clube)}", "nome": clube, "sigla": sigla(clube), "elenco": el}))
    clubes.sort(key=lambda x: -x[0])
    ligas.append({"id": f"mundo-{codigo.lower()}", "codigo": codigo, "nome": nome, "pais": pais, "nivel": nivel,
                  "clubes": [c for _, c in clubes]})
    print(codigo, nome, len(clubes), "clubes", sum(len(c["elenco"]) for _, c in clubes), "jogadores")

os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
json.dump({"formato": 1, "fonte": "EA SPORTS FC 26 (atualização de 2025-09)", "ligas": ligas},
          open(DESTINO, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(DESTINO, os.path.getsize(DESTINO) // 1024, "KB")
