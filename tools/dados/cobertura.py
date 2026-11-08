"""Cruza oGol (elencos 2026) x Transfermarkt Datasets x FC 26 e grava cobertura por competição/clube em JSON.
Uso: python -I cobertura.py <pasta dados> <saida.json>
"""
import collections, csv, gzip, io, json, sys, unicodedata

DADOS, SAIDA = sys.argv[1], sys.argv[2]
ANO = 2026


def tokens(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return {t for t in "".join(c if c.isalnum() else " " for c in s if not unicodedata.combining(c)).split() if len(t) > 2}


def tm(t):
    return list(csv.DictReader(io.TextIOWrapper(gzip.open(f"{DADOS}/transfermarkt/{t}.csv.gz"), encoding="utf-8")))


aud = json.load(open(f"{DADOS}/auditoria-ogol.json", encoding="utf-8"))
jog_tm = [p for p in tm("players") if p["last_season"] >= "2024"]
clubes_tm = {c["club_id"]: c for c in tm("clubs")}
fc = [f for f in csv.DictReader(open(f"{DADOS}/FC26.csv", encoding="utf-8")) if f["league_id"] != "7.0"]

fc_por_dob = collections.defaultdict(list)
for f in fc:
    fc_por_dob[f["dob"]].append(f)
tm_por_clube = collections.defaultdict(list)
for p in jog_tm:
    tm_por_clube[p["current_club_id"]].append(p)
tm_por_token = collections.defaultdict(list)
for p in jog_tm:
    for t in tokens(p["name"]):
        tm_por_token[t].append(p)


def idade(dob):
    a, m, d = (int(x) for x in dob[:10].split("-"))
    return 2026 - a - ((m, d) > (11, 8))


def casa_tm(j):
    """Jogador do oGol -> jogador do TM: nome (todos os tokens do nome curto) + idade igual (±0)."""
    tk = tokens(j["nome"])
    if not tk or not j.get("idade"):
        return None, False
    cands = {p["player_id"]: p for t in tk for p in tm_por_token[t]
             if tk <= tokens(p["name"]) | tokens(p["first_name"] + " " + p["last_name"])
             and p["date_of_birth"] and idade(p["date_of_birth"]) == j["idade"]}
    if len(cands) == 1:
        return next(iter(cands.values())), False
    return None, len(cands) > 1


def casa_fc(p):
    tk = tokens(p["name"]) | tokens(p["first_name"] + " " + p["last_name"])
    c = [f for f in fc_por_dob.get((p["date_of_birth"] or "")[:10], []) if tk & (tokens(f["long_name"]) | tokens(f["short_name"]))]
    return c[0] if len(c) == 1 else None


clubes = {}
for slug, c in aud["clubes"].items():
    jogs = c.get("jogadores", [])
    r = {"nome": c["nome"], "ogol": len(jogs), "com_tm": 0, "com_fc": 0, "ambiguos": 0, "parciais": 0, "clube_tm": None}
    votos = collections.Counter()
    for j in jogs:
        p, amb = casa_tm(j)
        if amb:
            r["ambiguos"] += 1
        if p:
            r["com_tm"] += 1
            votos[p["current_club_id"]] += 1
            if casa_fc(p):
                r["com_fc"] += 1
    r["parciais"] = r["ogol"] - r["com_tm"]
    if votos:
        cid, n = votos.most_common(1)[0]
        if n >= 5 and cid in clubes_tm:
            r["clube_tm"] = clubes_tm[cid]["name"]
            r["tm_elenco"] = len([p for p in tm_por_clube[cid] if p["last_season"] >= "2025"])
    clubes[slug] = r

json.dump({"competicoes": aud["competicoes"], "clubes": clubes}, open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
tot = collections.Counter()
for k, comp in aud["competicoes"].items():
    cs = [clubes[s] for s in comp["clubes"] if s in clubes]
    soma = lambda f: sum(x[f] for x in cs)
    vazios = sum(1 for x in cs if x["ogol"] < 18)
    print(f"{k:28} clubes {len(cs):3} | oGol {soma('ogol'):5} | c/TM {soma('com_tm'):5} | c/FC {soma('com_fc'):4} | elenco<18: {vazios}")
