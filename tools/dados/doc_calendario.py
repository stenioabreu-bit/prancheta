"""Gera docs/calendario-brasileiro-2026.md a partir dos formatos do motor, dos estaduais do pacote e do resumo.
Uso: python -I tools/dados/doc_calendario.py"""
import json, re

fmt = open("packages/engine/src/competicao/formatos2026.ts", encoding="utf-8").read()
copa = open("packages/engine/src/competicao/copa.ts", encoding="utf-8").read()
pacote = json.load(open("packages/data/packs/teste-real/pacote.json", encoding="utf-8"))
resumo = json.load(open("dados/estaduais-2026-resumo.json", encoding="utf-8"))["estaduais"]
br = lambda d: f"{d[8:10]}/{d[5:7]}"


def datas_da_serie(nome):
    i = fmt.index(f'nome: "{nome}"')
    j = fmt.find("export const", i + 1)
    bloco = fmt[i: j if j > 0 else None]
    return re.findall(r'"(2026-\d\d-\d\d)"', bloco)


L = ["# Calendário do futebol brasileiro 2026", "",
     "Fontes: [Calendário oficial da CBF 2026 (PDF, 04/10/2025)](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/Calenda%CC%81rio%20do%20Futebol%20do%20Brasil%202026%20-%20Masculino%20Profissional.pdf) "
     "para Séries A–D e Copa do Brasil; tabelas de cada estadual no oGol (`dados/estaduais-2026-jogos.json`, obtidas em 2026-11-08). "
     "No jogo, cada data vira um horário (semana + meio/fim de semana); semana 0 começa em 05/01/2026.", "",
     "## Calendário geral", "", "| Competição | Início | Término | Datas |", "|---|---|---|---|"]
for nome in ["Série A", "Série B", "Série C", "Série D"]:
    d = datas_da_serie(nome)
    L.append(f"| Brasileirão {nome} | {br(min(d))} | {br(max(d))} | {len(d)} |")
cd = re.findall(r'"(2026-\d\d-\d\d)"', copa)
L.append(f"| Copa do Brasil | {br(min(cd))} | {br(max(cd))} | {len(cd)} |")
ok = [r for r in resumo.values() if r["status"] == "ok"]
L.append(f"| Estaduais ({len(ok)} de 27 com tabela) | {br(min(r['inicio'] for r in ok))} | {br(max(r['fim'] for r in ok))} | ver abaixo |")
L += ["", "Janela oficial dos estaduais (CBF): 11/01 a 08/03, até 11 datas-base para estaduais com clubes da Série A. Estaduais sem clubes da Série A terminam depois (até 05/04 em 2026).",
      "Janelas de registro: 05/01–03/03 e 20/07–11/09. Copa do Mundo: 11/06–19/07 (sem Série A).", ""]

L += ["## Brasileirão", ""]
for nome, formato in [("Série A", "20 clubes, turno e returno, 38 rodadas; rebaixa 4."),
                      ("Série B", "20 clubes, turno e returno, 38 rodadas; sobe 4 e rebaixa 4."),
                      ("Série C", "1ª fase turno único (19 datas) → 2ª fase em 2 quadrangulares ida e volta (6) → final ida e volta (2)."),
                      ("Série D", "96 clubes em 16 grupos de 6, turno e returno (10 datas) → 2ª fase, 3ª fase, oitavas, quartas, semifinal e final em ida e volta; playoffs de acesso entre eliminados das quartas.")]:
    d = datas_da_serie(nome)
    L += [f"### {nome}", "", formato, "", "Datas (ordem das rodadas): " + ", ".join(br(x) for x in d), ""]

L += ["## Copa do Brasil", "", "126 clubes, 9 fases, 14 datas. 1ª, 3ª e 4ª fases e final em jogo único; 2ª fase e 5ª fase até a semifinal em ida e volta. Série A entra na 5ª fase.", "",
      "| Fase | Datas |", "|---|---|"]
for nome, datas in re.findall(r'nome: "([^"]+)", datas: \[([^\]]+)\]', copa):
    L.append(f"| {nome} | {', '.join(br(x) for x in re.findall(r'2026-[0-9-]+', datas))} |")

L += ["", "## Estaduais", "", "1ª fase com os confrontos e datas reais de 2026; mata-matas com as datas reais (confrontos definidos pela campanha no jogo).", ""]
for est in sorted(pacote.get("estaduais", []), key=lambda e: e["formato"]["nome"]):
    f, r = est["formato"], resumo[est["uf"]]
    L += [f"### {f['nome']} ({est['uf']})", "",
          f"{r['clubes']} clubes · 1ª fase: {r['jogos_1a_fase']} jogos de {br(r['inicio'])} a "
          f"{br(max(j['data'] for j in f['fases'][0]['jogos']))} · classificam {f['fases'][0]['avancamPorGrupo']}", ""]
    for m in r["mata_mata"]:
        L.append(f"- {m}")
    if r["fases_nao_modeladas"]:
        L.append(f"- Fases do regulamento não modeladas: {', '.join(r['fases_nao_modeladas'])}")
    L.append("")
for uf, r in resumo.items():
    if r["status"] != "ok":
        L += [f"### {uf} — PENDENTE", "", r["motivo"] + ".", ""]

L += ["## Datas não confirmadas", "",
      "- Mandos e confrontos das Séries A–D: a tabela detalhada oficial não foi importada; o jogo sorteia os confrontos e usa as datas oficiais das rodadas.",
      "- Mato-Grossense e Sul-Mato-Grossense: sem tabela 2026 publicada na fonte consultada.",
      "- Mata-matas dos estaduais: datas reais; confrontos dependem da campanha simulada.",
      "- Datas que precisaram ser reagendadas no jogo constam em `adiadoDe` de cada partida (ver relatório de validação).", ""]
open("docs/calendario-brasileiro-2026.md", "w", encoding="utf-8").write("\n".join(L))
print("ok", len(L))
