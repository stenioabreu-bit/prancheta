"""Grava os elencos reais de 2026 (dados/elencos-2026.json) nos clubes das Séries A–D do pacote teste-real.

- Jogador: ["Nome", POS, OVR, extras]; extras guarda id permanente (og<ID oGol>), nacionalidade, idade, potencial,
  origem do overall e, com FC 26, os 10 atributos convertidos para a escala do jogo.
- Jogador que já estava no pacote (mesmo nome no mesmo clube) mantém posição, alternativas e personalidade; o overall
  dele só muda quando há FC 26 (o estimado não sobrepõe o curado).
- Titulares: os preferidos antigos que continuam no elenco; o motor completa o resto (`escalarAutomatico`).
- Clube com menos de MINIMO jogadores reais (ou sem goleiro) não recebe elenco: segue com `nivel` e vai para pendências.
Faz backup do pacote antes (o pacote fica fora do git).

Uso (na raiz): python -I tools/importar-elencos/levar-para-pacote.py
"""
import csv, json, os, shutil, unicodedata

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PACOTE = os.path.join(RAIZ, "packages", "data", "packs", "teste-real", "pacote.json")
MINIMO = 16


def normal(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return " ".join("".join(c if c.isalnum() else " " for c in s if not unicodedata.combining(c)).split())


def media(f, *campos):
    v = [float(f[c]) for c in campos if f.get(c) not in (None, "")]
    return round(sum(v) / len(v)) if v else None


def atributos(f):
    """EA FC 26 → atributos do jogo (ATQ FIN CTL PAS VEL FIS RES DEF CAB GOL), mesma escala 1–99."""
    a = {"ATQ": media(f, "mentality_positioning", "skill_dribbling", "movement_agility"),
         "FIN": media(f, "attacking_finishing", "attacking_finishing", "power_shot_power", "power_long_shots"),
         "CTL": media(f, "skill_ball_control", "mentality_composure"),
         "PAS": media(f, "attacking_short_passing", "skill_long_passing", "mentality_vision"),
         "VEL": media(f, "movement_acceleration", "movement_sprint_speed"),
         "FIS": media(f, "power_strength", "power_jumping"),
         "RES": media(f, "power_stamina"),
         "DEF": media(f, "defending_marking_awareness", "defending_standing_tackle", "defending_sliding_tackle",
                      "mentality_interceptions"),
         "CAB": media(f, "attacking_heading_accuracy", "power_jumping"),
         "GOL": media(f, "goalkeeping_diving", "goalkeeping_handling", "goalkeeping_positioning", "goalkeeping_reflexes")}
    return {k: max(20, min(95, v)) for k, v in a.items() if v is not None}


elencos = json.load(open(os.path.join(RAIZ, "dados", "elencos-2026.json"), encoding="utf-8"))["clubes"]
fc = {int(f["player_id"]): f for f in csv.DictReader(open(os.path.join(RAIZ, "dados", "FC26.csv"), encoding="utf-8"))}
pacote = json.load(open(PACOTE, encoding="utf-8"))
backup = PACOTE.replace(".json", ".antes-elencos-2026.json")
if not os.path.exists(backup):
    shutil.copyfile(PACOTE, backup)

por_id = {c["pacote_id"]: c for c in elencos.values() if c["pacote_id"]}
gravados, sem_elenco, mantidos = 0, [], 0
for div, clubes in pacote["divisoes"].items():
    for clube in clubes:
        real = por_id.get(clube["id"])
        if not real or len(real["elenco"]) < MINIMO or not any(j["grupo"] == "GOL" for j in real["elenco"]):
            sem_elenco.append((div, clube["id"], clube["nome"], len(real["elenco"]) if real else 0))
            continue
        antigos = {normal(j[0]): j for j in clube.get("elenco", [])}
        novo = []
        for j in sorted(real["elenco"], key=lambda j: -j["overall"]):
            extras = {"id": j["id"], "nac": j["nacionalidade"], "idade": j["idade"], "fonte": j["overall_fonte"]}
            pos, ovr = j["posicao"], j["overall"]
            if j["fc_id"]:
                extras.update(atributos(fc[j["fc_id"]]), pot=j["potencial"])
            velho = antigos.get(normal(j["nome"]))
            if velho:
                mantidos += 1
                pos = velho[1] if j.get("posicao_estimada") or not j["fc_id"] else pos
                if j["overall_fonte"] != "fc26":
                    ovr = velho[2]
                    extras.update({k: v for k, v in (velho[3] if len(velho) > 3 else {}).items() if k not in extras})
                    extras["fonte"] = "pacote"
                elif len(velho) > 3:
                    extras.update({k: velho[3][k] for k in ("alt", "perso") if k in velho[3]})
            novo.append([j["nome"], pos, ovr, {k: v for k, v in extras.items() if v is not None}])
        nomes = {normal(j[0]) for j in novo}
        clube["titulares"] = [t for t in clube.get("titulares", []) if normal(t) in nomes]
        clube["elenco"] = novo
        clube["ogol"] = real["ogol"]
        gravados += 1

json.dump(pacote, open(PACOTE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open(os.path.join(RAIZ, "docs", "pendencias", "clubes-sem-elenco-no-pacote.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["divisao", "id", "nome", "jogadores_reais"])
    w.writerows(sem_elenco)
print(f"clubes com elenco real {gravados} | sem elenco (seguem com nivel) {len(sem_elenco)} | jogadores do pacote mantidos {mantidos}")
print("backup:", backup)
