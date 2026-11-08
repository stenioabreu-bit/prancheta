"""Importador dos elencos reais de 2026 (sem requisições: usa só o que está em dados/).

Elenco e posição (grupo) vêm das páginas de clube do oGol em cache; overall, potencial e posição detalhada vêm do
EA FC 26 quando a correspondência é segura. O que faltar vai para docs/pendencias/.

Correspondência com o FC 26 (nunca só por nome):
  - confirmado: oGol -> Transfermarkt (nome + idade, único) -> FC 26 (data de nascimento + nome, único);
  - provavel: oGol -> FC 26 por nome + idade + nacionalidade, único.
Ambíguo ou sem resultado: overall pendente.

Uso (na raiz do projeto): python -I tools/importar-elencos/importar.py
Saídas: dados/elencos-2026.json, docs/pendencias/jogadores.csv, docs/pendencias/clubes.csv
"""
import collections, csv, gzip, hashlib, html, io, json, os, re, sys, unicodedata

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DADOS = os.path.join(RAIZ, "dados")
PENDENCIAS = os.path.join(RAIZ, "docs", "pendencias")
HOJE = (2026, 11, 8)
GRUPOS = {"Goleiro": "GOL", "Defensor": "DEF", "Meia": "MEI", "Atacante": "ATA"}
POSICAO_FC = {"GK": "GOL", "CB": "ZAG", "RB": "LD", "RWB": "LD", "LB": "LE", "LWB": "LE", "CDM": "VOL", "CM": "MC",
              "CAM": "MEI", "RM": "PD", "RW": "PD", "LM": "PE", "LW": "PE", "ST": "ATA", "CF": "ATA"}
PAISES = {"brasil": "brazil", "uruguai": "uruguay", "paraguai": "paraguay", "colombia": "colombia", "equador": "ecuador",
          "bolivia": "bolivia", "espanha": "spain", "italia": "italy", "franca": "france", "estados unidos": "united states",
          "mexico": "mexico", "japao": "japan", "alemanha": "germany", "inglaterra": "england", "holanda": "netherlands",
          "paises baixos": "netherlands", "panama": "panama", "nigeria": "nigeria", "gana": "ghana", "camaroes": "cameroon",
          "costa do marfim": "cote d ivoire", "belgica": "belgium", "suica": "switzerland", "croacia": "croatia",
          "servia": "serbia", "escocia": "scotland", "pais de gales": "wales", "irlanda": "republic of ireland",
          "grecia": "greece", "turquia": "turkiye", "russia": "russia", "ucrania": "ukraine", "polonia": "poland",
          "suecia": "sweden", "noruega": "norway", "dinamarca": "denmark", "austria": "austria", "hungria": "hungary",
          "republica checa": "czechia", "eslovaquia": "slovakia", "eslovenia": "slovenia", "romenia": "romania",
          "bulgaria": "bulgaria", "marrocos": "morocco", "argelia": "algeria", "tunisia": "tunisia", "egito": "egypt",
          "africa do sul": "south africa", "coreia do sul": "korea republic", "china": "china pr", "australia": "australia",
          "canada": "canada", "jamaica": "jamaica", "haiti": "haiti", "honduras": "honduras", "guatemala": "guatemala",
          "el salvador": "el salvador", "costa rica": "costa rica", "cuba": "cuba", "republica dominicana": "dominican republic",
          "trinidad e tobago": "trinidad and tobago", "curacau": "curacao", "suriname": "suriname", "guiana": "guyana",
          "angola": "angola", "mocambique": "mozambique", "cabo verde": "cape verde islands", "guine bissau": "guinea bissau",
          "senegal": "senegal", "mali": "mali", "guine": "guinea", "congo": "congo", "rd congo": "congo dr"}


def normal(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return " ".join("".join(c if c.isalnum() else " " for c in s if not unicodedata.combining(c)).split())


def tokens(s):
    return {t for t in normal(s).split() if len(t) > 2}


def idade(dob):
    a, m, d = (int(x) for x in dob[:10].split("-"))
    return HOJE[0] - a - ((m, d) > HOJE[1:])


def pagina(caminho):
    arq = os.path.join(DADOS, "ogol-cache", hashlib.sha1(caminho.encode()).hexdigest() + ".html")
    return open(arq, encoding="utf-8", errors="ignore").read() if os.path.exists(arq) else ""


def elenco(slug, epoca):
    s = pagina(f"/equipe/{slug}?epoca_id={epoca}")
    i = s.find('id="team_squad"')
    if i < 0:
        return []
    s = s[i:]
    jogadores, grupo = [], None
    for m in re.finditer(r'<div class="section">([^<]+)</div>|<div class="staff">(.*?)</span></div></div>', s, re.S):
        if m.group(1):
            grupo = GRUPOS.get(m.group(1).strip())
            if m.group(1).strip() in ("Técnico", "Treinador", "Outros Técnicos"):
                break
            continue
        if not grupo:
            continue
        b = m.group(2)
        j = re.search(r'href="/jogador/([^/"]+)/(\d+)\?epoca_id=\d+">([^<]+)</a>', b)
        if not j:
            continue
        nac = re.search(r'<a title="([^"]+)" href="/pais/', b)
        anos = re.search(r"<span>(\d+) anos", b)
        num = re.search(r'class="number">([^<]*)<', b)
        val = re.search(r"anos - ([\d.]+) (mil|M) &euro;", b)
        jogadores.append({"ogol_id": int(j.group(2)), "nome": html.unescape(j.group(3)).strip(), "grupo": grupo,
                          "nacionalidade": nac and html.unescape(nac.group(1)), "idade": anos and int(anos.group(1)),
                          "numero": num and num.group(1).strip() not in ("", "-") and num.group(1).strip() or None,
                          "valor_eur": val and round(float(val.group(1)) * (1e3 if val.group(2) == "mil" else 1e6))})
    return jogadores


def tm(tabela):
    return list(csv.DictReader(io.TextIOWrapper(gzip.open(os.path.join(DADOS, "transfermarkt", tabela + ".csv.gz")), encoding="utf-8")))


aud = json.load(open(os.path.join(DADOS, "auditoria-ogol.json"), encoding="utf-8"))
pacote = json.load(open(os.path.join(RAIZ, "packages", "data", "packs", "teste-real", "pacote.json"), encoding="utf-8"))
fc = [f for f in csv.DictReader(open(os.path.join(DADOS, "FC26.csv"), encoding="utf-8")) if f["league_id"] != "7.0"]
jog_tm = [p for p in tm("players") if p["last_season"] >= "2024" and p["date_of_birth"]]

fc_dob = collections.defaultdict(list)
fc_tok = collections.defaultdict(list)
for f in fc:
    fc_dob[f["dob"]].append(f)
    for t in tokens(f["short_name"]) | tokens(f["long_name"]):
        fc_tok[t].append(f)
tm_tok = collections.defaultdict(list)
for p in jog_tm:
    for t in tokens(p["name"]):
        tm_tok[t].append(p)


def casa_fc(j):
    tk = tokens(j["nome"])
    if not tk or not j["idade"]:
        return None, "sem nome/idade"
    tms = {p["player_id"]: p for t in tk for p in tm_tok[t]
           if tk <= tokens(p["name"]) | tokens(p["first_name"] + " " + p["last_name"]) and idade(p["date_of_birth"]) == j["idade"]}
    if len(tms) == 1:
        p = next(iter(tms.values()))
        tkp = tokens(p["name"]) | tokens(p["first_name"] + " " + p["last_name"])
        c = [f for f in fc_dob.get(p["date_of_birth"][:10], []) if tkp & (tokens(f["long_name"]) | tokens(f["short_name"]))]
        if len(c) == 1:
            return (c[0], "confirmado", p), None
    nac = normal(j["nacionalidade"])
    nac = PAISES.get(nac, nac)
    c = {f["player_id"]: f for t in tk for f in fc_tok[t]
         if tk <= tokens(f["short_name"]) | tokens(f["long_name"]) and f["dob"] and idade(f["dob"]) == j["idade"]
         and normal(f["nationality_name"]) == nac}
    if len(c) == 1:
        return (next(iter(c.values())), "provavel", None), None
    return None, "ambiguo" if len(c) > 1 else "sem correspondencia"


# Clubes do oGol -> IDs do pacote (Séries A-D)
DIV = {"BRA|Série A": "A", "BRA|Série B": "B", "BRA|Série C": "C", "BRA|Série D": "D"}
# Conferidos à mão (nome do oGol diferente do pacote; mesma cidade/UF).
MANUAIS = {"aguia/3087": "aguia-de-maraba", "gazin-porto-velho-ec/234449": "porto-velho",
           "atletico-cearense/3519": "atletico-ce", "ceov-operario/36613": "operario-vg", "ge-brasil/3157": "brasil-de-pelotas"}
vinculo, sem_vinculo = {}, []
for comp, div in DIV.items():
    livres = {c["id"]: c for c in pacote["divisoes"][div]}
    for slug in aud["competicoes"][comp]["clubes"]:
        nome = aud["clubes"][slug]["nome"]
        raiz = slug.split("/")[0]
        cand = [MANUAIS[slug]] if MANUAIS.get(slug) in livres else \
            [i for i, c in livres.items() if normal(c["nome"]) == normal(nome)] \
            or [i for i in livres if normal(i) == normal(raiz)] \
            or [i for i, c in livres.items() if tokens(c["nome"]) and tokens(c["nome"]) <= tokens(nome + " " + raiz)]
        if len(cand) == 1:
            vinculo[slug] = cand[0]
            livres.pop(cand[0])
        else:
            sem_vinculo.append((div, slug, nome, "|".join(cand)))
    for i, c in livres.items():
        sem_vinculo.append((div, "", c["nome"], f"pacote:{i} sem clube no oGol"))

# Prioridade quando um jogador aparece em dois clubes: divisões nacionais antes de estaduais.
ordem = list(DIV) + [k for k in aud["competicoes"] if k not in DIV]
competicoes_do_clube = collections.defaultdict(list)
for k in ordem:
    for slug in aud["competicoes"][k]["clubes"]:
        competicoes_do_clube[slug].append(k)

clubes, dono, repetidos, pend = {}, {}, [], []
contagem = collections.Counter()
for k in ordem:
    for slug in aud["competicoes"][k]["clubes"]:
        if slug in clubes:
            continue
        c = aud["clubes"][slug]
        saida = []
        for j in elenco(slug, c["epoca"]):
            if j["ogol_id"] in dono:
                repetidos.append((j["ogol_id"], j["nome"], dono[j["ogol_id"]], slug))
                continue
            dono[j["ogol_id"]] = slug
            achado, motivo = casa_fc(j)
            reg = {"id": f"og{j['ogol_id']}", **j, "posicao": None, "overall": None, "potencial": None,
                   "fc_id": None, "tm_id": None, "correspondencia": None}
            if achado:
                f, tipo, p = achado
                pos = [POSICAO_FC.get(x.strip()) for x in f["player_positions"].split(",")]
                reg.update(posicao=next((x for x in pos if x), None), overall=int(f["overall"]),
                           potencial=int(f["potential"]), fc_id=int(f["player_id"]), correspondencia=tipo,
                           tm_id=p and int(p["player_id"]))
                contagem[tipo] += 1
            else:
                contagem["pendente"] += 1
            faltam = ["nascimento", "pe", "altura"] + (["overall", "posicao"] if not achado else [])
            pend.append((reg["id"], j["nome"], slug, c["nome"], j["grupo"], j["nacionalidade"], j["idade"],
                         ";".join(faltam), motivo or ""))
            saida.append(reg)
        clubes[slug] = {"ogol": slug, "nome": c["nome"], "pacote_id": vinculo.get(slug),
                        "competicoes": competicoes_do_clube[slug], "elenco": saida}

json.dump({"temporada": 2026, "gerado_em": "2026-11-08",
           "fontes": {"elenco": "oGol (cache de 2026-11-08)", "overall": "EA FC 26 update 4", "nascimento": "Transfermarkt Datasets"},
           "clubes": clubes}, open(os.path.join(DADOS, "elencos-2026.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(PENDENCIAS, exist_ok=True)
with open(os.path.join(PENDENCIAS, "jogadores.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id", "nome", "clube_ogol", "clube", "grupo", "nacionalidade", "idade", "faltam", "motivo"])
    w.writerows(pend)
with open(os.path.join(PENDENCIAS, "clubes.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["tipo", "divisao", "clube_ogol", "nome", "detalhe"])
    w.writerows([("sem vinculo com o pacote", *x) for x in sem_vinculo])
    w.writerows([("elenco < 18", "", s, c["nome"], len(c["elenco"])) for s, c in clubes.items() if len(c["elenco"]) < 18])
    w.writerows([("jogador em dois clubes", "", novo, nome, f"og{i} ficou em {velho}") for i, nome, velho, novo in repetidos])

total = sum(len(c["elenco"]) for c in clubes.values())
print(f"clubes {len(clubes)} | jogadores {total} | confirmado {contagem['confirmado']} | provavel {contagem['provavel']}"
      f" | overall pendente {contagem['pendente']} | repetidos {len(repetidos)} | clubes sem vinculo {len(sem_vinculo)}")
