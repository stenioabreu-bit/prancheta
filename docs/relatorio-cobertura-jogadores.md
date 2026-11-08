# Relatório de cobertura de jogadores — temporada 2026

Gerado em 2026-11-08. Dados brutos em `dados/auditoria-ogol.json` e `dados/cobertura.json` (fora do git). Origem e licença de cada dataset em `dados/METADADOS.md`.

## Resumo
- 438 clubes no escopo (Séries A–D, 27 estaduais, 9 primeiras divisões estrangeiras, Libertadores com as 3 fases preliminares e Sul-Americana), com **12.905 jogadores únicos** no elenco 2026 do oGol.
- Todos os 438 clubes têm elenco 2026 identificado. Nenhum país ou liga ficou sem jogadores reais.
- Lacuna real: **clubes pequenos de estadual e Série D com menos de 18 jogadores listados** (contagem por competição na tabela; lista completa abaixo). Não completar com fictícios.
- Atributos: o FC 26 cobre bem Argentina, Colômbia e os clubes estrangeiros licenciados; no Brasil quase nada (os 14 clubes brasileiros do FC 26 têm jogadores fictícios e foram descartados).

## Como ler
- **Jogadores (oGol)**: elenco 2026 da página do clube no oGol (nome, nacionalidade, idade). Um jogador pode contar em mais de uma competição (ex.: estadual + Série A).
- **c/ nascimento (TM)**: casou com o Transfermarkt Datasets por nome + idade exata, com resultado único. Esses têm nascimento, posição, pé e altura confirmados.
- **Atributos FC 26**: *confirmado* = jogador do TM casado com o FC 26 por data de nascimento + nome; *provável* = jogador do oGol casado com o FC 26 por nome + idade (precisa da data de nascimento da ficha para confirmar).
- **Parciais**: só nome, nacionalidade e idade, sem data de nascimento. Atributos pendentes.

## Cobertura por competição
| Competição | Clubes 2026 | Jogadores (oGol) | c/ nascimento (TM) | Atributos FC 26 (confirmado / provável) | Parciais | Elenco < 18 |
|---|---|---|---|---|---|---|
| Brasil — Série A | 20 | 972 | 607 | 73 / 98 | 365 | 0 |
| Brasil — Série B | 20 | 913 | 222 | 25 / 53 | 691 | 0 |
| Brasil — Série C | 20 | 709 | 60 | 8 / 27 | 649 | 0 |
| Brasil — Série D | 96 | 2267 | 147 | 34 / 91 | 2120 | 32 |
| Estadual AC | 8 | 149 | 7 | 3 / 5 | 142 | 5 |
| Estadual AL | 8 | 195 | 18 | 3 / 7 | 177 | 4 |
| Estadual AP | 8 | 77 | 6 | 1 / 4 | 71 | 8 |
| Estadual AM | 8 | 129 | 6 | 1 / 7 | 123 | 4 |
| Estadual BA | 10 | 207 | 70 | 9 / 14 | 137 | 4 |
| Estadual CE | 10 | 262 | 60 | 7 / 17 | 202 | 4 |
| Estadual DF | 10 | 149 | 8 | 1 / 4 | 141 | 6 |
| Estadual ES | 10 | 148 | 11 | 2 / 3 | 137 | 6 |
| Estadual GO | 13 | 262 | 42 | 4 / 9 | 220 | 7 |
| Estadual MA | 8 | 109 | 6 | 2 / 3 | 103 | 5 |
| Estadual MT | 9 | 235 | 11 | 3 / 15 | 224 | 3 |
| Estadual MS | 9 | 189 | 11 | 6 / 12 | 178 | 5 |
| Estadual MG | 12 | 309 | 92 | 16 / 21 | 217 | 5 |
| Estadual PA | 12 | 160 | 31 | 4 / 8 | 129 | 9 |
| Estadual PB | 10 | 251 | 23 | 4 / 11 | 228 | 3 |
| Estadual PR | 12 | 393 | 92 | 12 / 16 | 301 | 2 |
| Estadual PE | 8 | 259 | 38 | 4 / 11 | 221 | 1 |
| Estadual PI | 8 | 112 | 5 | 2 / 7 | 107 | 6 |
| Estadual RJ | 12 | 505 | 152 | 22 / 38 | 353 | 0 |
| Estadual RN | 8 | 105 | 6 | 3 / 6 | 99 | 6 |
| Estadual RS | 12 | 272 | 88 | 10 / 19 | 184 | 6 |
| Estadual RO | 7 | 111 | 7 | 3 / 9 | 104 | 4 |
| Estadual RR | 9 | 171 | 10 | 4 / 10 | 161 | 3 |
| Estadual SC | 12 | 423 | 59 | 13 / 24 | 364 | 3 |
| Estadual SP | 16 | 608 | 210 | 20 / 34 | 398 | 2 |
| Estadual SE | 10 | 202 | 13 | 2 / 10 | 189 | 5 |
| Estadual TO | 8 | 161 | 12 | 6 / 9 | 149 | 4 |
| ARG | 30 | 1108 | 810 | 557 / 613 | 298 | 0 |
| BOL | 16 | 712 | 41 | 15 / 72 | 671 | 0 |
| CHI | 16 | 651 | 69 | 45 / 135 | 582 | 0 |
| COL | 20 | 795 | 451 | 102 / 111 | 344 | 0 |
| EQU | 16 | 598 | 45 | 22 / 105 | 553 | 0 |
| PAR | 12 | 510 | 57 | 28 / 114 | 453 | 0 |
| PER | 18 | 653 | 74 | 45 / 133 | 579 | 0 |
| URU | 16 | 622 | 70 | 32 / 103 | 552 | 0 |
| VEN | 14 | 669 | 44 | 10 / 79 | 625 | 0 |
| Libertadores | 47 | 2024 | 735 | 304 / 553 | 1289 | 0 |
| Sul-Americana | 56 | 2301 | 753 | 333 / 556 | 1548 | 0 |

## Fontes

| Fonte | O que cobre | Funcionou? | Limitações | Licença / coleta |
|---|---|---|---|---|
| Transfermarkt Datasets (dcaribou) | Brasil Série A, Argentina, Colômbia; ex-jogadores dessas ligas pela tabela de transferências | Sim, download direto | Para em 06/07/2026; sem Séries B–D, estaduais, 6 países e continentais; 4 clubes da Série A (Juventude, Fortaleza, Ceará, Sport) só com dados de 2024 | CC0 1.0 |
| EA FC 26 (Kaggle `rovnez`, cópia GitHub) | 18.405 jogadores com 34 atributos; clubes licenciados da AS: ARG 30, CHI 6, COL 4, PAR 5, URU 5, BOL 4, EQU 5, VEN 4, PER 6 | Sim | Versão de 19/09/2025 (elencos de 2025); liga brasileira fictícia | Kaggle declara CC BY 4.0, "fins educacionais e de pesquisa"; dados raspados do sofifa, atributos são da EA. Só referência, não embarcar |
| oGol (ZOS, Lda.) | Elenco 2026 de todos os 438 clubes; ficha com nome completo, nascimento, nacionalidades, posição, pé e altura | Sim | Ficha de jogador = 1 requisição por atleta; slugs sem ID redirecionam; layouts variados nas páginas de edição | robots.txt libera; "Todos os direitos reservados"; Termos e Condições não acessíveis no site; empresa da UE (direito sui generis de base de dados). Coleta em massa exige decisão/autorização |
| BID da CBF | Registro oficial de atletas por clube | Não automatizável | Captcha em cada consulta | Oficial; só conferência manual |
| Sites de federações e clubes | — | Não testados nesta etapa | Desnecessários enquanto o oGol cobre todos os clubes; servem para conferir os elencos pequenos | — |

## Problemas de correspondência e atualização
- **Atualização**: TM até 06/07/2026; FC 26 de 09/2025; oGol é o único com elenco do 2º semestre de 2026. Para a "base inicial 2026" o oGol deve ser a referência de elenco; TM e FC 26 entram como enriquecimento.
- **Nome curto × nome completo**: o oGol lista apelidos ("Matheuzinho"); o casamento só é seguro com a data de nascimento da ficha. Por isso a Série A casa só 607 de 972 com o TM.
- **Ambíguos**: homônimos com mesma idade ficaram pendentes (não contam como casados).
- **Varredura**: o Goiano trouxe um clube sem nome (link quebrado) e o Mato-Grossense trouxe dois "Mixto" com IDs diferentes; Mato-Grossense e Sul-Mato-Grossense vieram com 9 clubes pela tabela de classificação. Conferir os participantes desses três no regulamento antes do importador.
- **FC 26 brasileiro**: liga 7 tem nomes trocados e nascimento 29/02; descartada em todos os cruzamentos.

## Clubes com elenco incompleto (< 18 jogadores no oGol)
Contagem entre parênteses. Fontes a tentar para eles: site oficial do clube, súmulas da federação estadual, BID (manual).

122 clubes: (sem nome: -/) (0), ABECAT Ouvidorense (4), ARUC (16), Altos (13), Amazônia Independente (2), América-RN (17), América-SE (16), Anapolina (3), Andraus (4), Aquidauanense (11), Araguaína (9), Atlético Gloriense (17), Atlético Piauiense (4), Avenida (4), Bahia de Feira (5), Barcelona de Ilhéus (8), Barcelona-RO (14), Baré (11), Bragantino-PA (5), Brasiliense (15), CEOV Operário (9), CRAC (12), CSE (16), Camboriú (7), Cametá (2), Capital FC (8), Capitão Poço (0), Capivariano (6), Capixaba (8), Carlos Renaux (5), Castanhal (12), Centro Oeste FC (2), Concórdia (7), Confiança-PB (9), Coruripe (8), Costa Rica EC (8), Cristal (6), Cruzeiro-AL (17), Democrata-GV (17), Desportiva Aracaju (16), Desportiva Ferroviária (6), Dorense (17), Fluminense-PI (14), Forte FC (9), Galo Maringá (6), Galícia (8), Guarany de Bagé (8), Gurupi (8), Horizonte (2), IAPE (15), ITZ Sport (8), Iguatu (14), Independente-AP (11), Independência-AC (17), Inhumas (14), Inter SM (8), Itabirito FC (4), Itacoatiara FC (4), Jataiense (6), Jequié (1), Ji-Paraná (9), Laguna (12), Luminense (4), Luverdense (13), Macapá (12), Maracanã (15), Maranguape (4), Misto (12), Mixto (14), Monsoon (15), Murici Sport (13), North Esporte Clube (3), Novo Hamburgo (11), Náutico-RR (17), Oeirense (9), Operário-MS (16), Oratório (15), Paranoá (9), Parintins FC (12), Piauí (15), Pombal EC (13), Potiguar (5), Potyguar Seridoense (12), Primavera AC (11), Princesa (0), QFC (8), Real Brasília (6), Rio Branco de Venda Nova (9), Rio Branco-AC (13), River-RR (8), Rondoniense (8), Samambaia (10), Sampaio Corrêa (12), Santa Cruz de Natal (5), Santa Cruz-AC (16), Santa Rosa (1), Santos-AP (3), Sergipe (14), Serra (15), Sobradinho (9), Sousa (9), São Francisco FC (15), São Francisco-PA (7), São José-AP (4), São Luiz (8), São Raimundo-AM (8), São Raimundo-PA (12), Taveirópolis (15), Teresina EC (8), Tocantinópolis (15), Tombense (9), Trem (15), Tuna Luso (16), Tuntum (9), URT (6), União Cacoalense (11), Vasco da Gama-AC (13), Velo Clube (16), Vilavelhense (10), Vitória das Tabocas (9), Ypiranga-AP (11), Águia Negra (13).

## Detalhe por clube
Formato: clube, jogadores no oGol (casados com TM, atributos FC 26 confirmado/provável).

### Brasil — Série A

Athletico Paranaense 52 (27 TM, 3/4 FC), Atlético Mineiro 50 (35 TM, 6/7 FC), Bahia 41 (32 TM, 5/5 FC), Botafogo 58 (38 TM, 7/9 FC), Chapecoense 58 (22 TM, 4/5 FC), Corinthians 55 (27 TM, 6/9 FC), Coritiba 43 (28 TM, 2/2 FC), Cruzeiro 44 (31 TM, 3/3 FC), Flamengo 48 (31 TM, 2/3 FC), Fluminense 51 (30 TM, 2/5 FC), Grêmio 49 (30 TM, 4/5 FC), Internacional 43 (30 TM, 4/5 FC), Mirassol 37 (26 TM, 2/5 FC), Palmeiras 48 (31 TM, 1/1 FC), Red Bull Bragantino 46 (29 TM, 1/3 FC), Remo 38 (26 TM, 3/4 FC), Santos 50 (32 TM, 3/2 FC), São Paulo 47 (33 TM, 4/4 FC), Vasco 59 (37 TM, 9/11 FC), Vitória 55 (32 TM, 2/6 FC)

### Brasil — Série B

América Mineiro 45 (9 TM, 3/4 FC), Athletic-MG 47 (11 TM, 2/3 FC), Atlético Goianiense 50 (13 TM, 1/3 FC), Avaí 48 (11 TM, 3/6 FC), Botafogo-SP 39 (4 TM, 0/1 FC), Ceará 43 (19 TM, 1/6 FC), CRB 44 (11 TM, 0/1 FC), Criciúma 38 (7 TM, 1/1 FC), Cuiabá 61 (7 TM, 1/5 FC), Fortaleza 39 (26 TM, 2/2 FC), Goiás 36 (8 TM, 0/2 FC), Grêmio Novorizontino 51 (8 TM, 2/4 FC), Juventude 52 (18 TM, 1/2 FC), Londrina 46 (13 TM, 2/3 FC), Náutico 50 (8 TM, 1/1 FC), Operário Ferroviário 42 (5 TM, 2/3 FC), Ponte Preta 43 (5 TM, 0/2 FC), São Bernardo 36 (6 TM, 0/0 FC), Sport 48 (21 TM, 1/3 FC), Vila Nova 55 (12 TM, 2/1 FC)

### Brasil — Série C

Ferroviária 46 (3 TM, 0/1 FC), Maringá 33 (5 TM, 1/1 FC), Botafogo-PB 37 (7 TM, 0/0 FC), Brusque 34 (3 TM, 0/1 FC), Floresta-CE 40 (3 TM, 1/1 FC), Inter de Limeira 33 (3 TM, 0/2 FC), Paysandu 47 (3 TM, 0/2 FC), Santa Cruz 39 (2 TM, 0/3 FC), Amazonas FC 42 (3 TM, 1/2 FC), Anápolis 33 (4 TM, 0/0 FC), Barra-SC 52 (1 TM, 1/2 FC), Caxias 25 (2 TM, 0/3 FC), Confiança 27 (2 TM, 0/0 FC), Figueirense 41 (3 TM, 0/1 FC), Guarani 34 (1 TM, 0/1 FC), Itabaiana 25 (2 TM, 1/1 FC), Ituano 34 (3 TM, 0/1 FC), Maranhão 22 (1 TM, 1/0 FC), Volta Redonda 41 (5 TM, 1/3 FC), Ypiranga-RS 24 (4 TM, 1/2 FC)

### Brasil — Série D

ASA 37 (2 TM, 1/1 FC), Uberlândia 30 (0 TM, 0/0 FC), CSA 35 (1 TM, 1/2 FC), Goiatuba EC 29 (2 TM, 0/0 FC), Nacional-AM 24 (1 TM, 0/1 FC), São José-RS 25 (2 TM, 0/1 FC), ABC 28 (0 TM, 0/0 FC), Gama 19 (1 TM, 1/2 FC), América-RN 17 (1 TM, 1/2 FC), Cianorte 22 (2 TM, 0/0 FC), Ferroviário 28 (4 TM, 0/1 FC), Iguatu 14 (0 TM, 0/1 FC), Luverdense 13 (1 TM, 0/1 FC), Portuguesa 21 (2 TM, 0/0 FC), São Luiz 8 (0 TM, 0/0 FC), Treze 32 (2 TM, 1/3 FC), Águia 18 (1 TM, 0/0 FC), Betim Futebol 31 (2 TM, 0/0 FC), Capital CF 24 (2 TM, 0/0 FC), CRAC 12 (2 TM, 1/1 FC), Gazin Porto Velho EC 18 (0 TM, 0/0 FC), Guaporé 19 (0 TM, 0/2 FC), Imperatriz 19 (2 TM, 0/0 FC), Ivinhema 30 (0 TM, 0/1 FC), Maguary-PE 22 (2 TM, 0/1 FC), Manauara EC 18 (2 TM, 0/2 FC), Marcílio Dias 46 (3 TM, 2/5 FC), Portuguesa-RJ 30 (0 TM, 0/1 FC), Serra Branca-PB 37 (4 TM, 2/2 FC), Trem 15 (1 TM, 0/0 FC), Velo Clube 16 (0 TM, 0/0 FC), XV de Piracicaba 38 (4 TM, 1/2 FC), Altos 13 (0 TM, 0/1 FC), America-RJ 24 (5 TM, 0/2 FC), Aparecidense 18 (0 TM, 0/1 FC), Araguaína 9 (0 TM, 0/0 FC), Blumenau 40 (6 TM, 1/3 FC), Brasiliense 15 (1 TM, 0/0 FC), Ceilândia 21 (2 TM, 0/0 FC), Central 50 (4 TM, 1/1 FC), Democrata-GV 17 (2 TM, 2/2 FC), EC Água Santa 18 (1 TM, 0/1 FC), FC Cascavel 40 (2 TM, 0/2 FC), Fluminense-PI 14 (1 TM, 0/1 FC), Independência-AC 17 (0 TM, 0/0 FC), Jacuipense 22 (3 TM, 0/1 FC), Juazeirense 20 (0 TM, 0/1 FC), Lagarto-SE 22 (2 TM, 0/1 FC), Maracanã 15 (1 TM, 0/1 FC), Mixto 14 (0 TM, 0/0 FC), Monte Roraima 27 (2 TM, 1/1 FC), Noroeste 41 (4 TM, 1/1 FC), Parnahyba 30 (1 TM, 1/2 FC), Piauí 15 (0 TM, 0/1 FC), Rio Branco-ES 22 (0 TM, 0/0 FC), Sampaio Corrêa 12 (0 TM, 0/0 FC), Sampaio Corrêa-RJ 36 (0 TM, 0/1 FC), Santa Catarina 40 (4 TM, 1/1 FC), São Joseense 40 (3 TM, 1/0 FC), São Raimundo-RR 19 (0 TM, 0/0 FC), Sergipe 14 (2 TM, 0/0 FC), Tombense 9 (0 TM, 0/0 FC), Tuna Luso 16 (0 TM, 0/0 FC), Vitória-ES 25 (2 TM, 0/1 FC), ABECAT Ouvidorense 4 (0 TM, 0/0 FC), Atlético Cearense 35 (2 TM, 0/4 FC), Atlético-BA 25 (1 TM, 1/0 FC), Azuriz Futebol 31 (4 TM, 1/1 FC), CEOV Operário 9 (0 TM, 0/1 FC), CSE 16 (1 TM, 0/0 FC), Decisão 20 (1 TM, 1/1 FC), Galvez EC 29 (0 TM, 0/1 FC), GAS 25 (1 TM, 0/2 FC), GE Brasil 35 (1 TM, 0/0 FC), Guarany de Bagé 8 (1 TM, 0/0 FC), IAPE 15 (1 TM, 0/2 FC), Inhumas 14 (1 TM, 0/1 FC), Joinville 47 (4 TM, 1/1 FC), Laguna 12 (2 TM, 0/2 FC), Madureira 46 (5 TM, 1/3 FC), Manaus FC 21 (0 TM, 0/1 FC), Maricá 38 (3 TM, 0/1 FC), Moto Club 20 (1 TM, 0/0 FC), Nova Iguaçu 40 (0 TM, 0/1 FC), Operário-MS 16 (2 TM, 0/0 FC), Oratório 15 (1 TM, 0/0 FC), Porto-BA 22 (2 TM, 1/1 FC), Pouso Alegre 23 (2 TM, 0/2 FC), Primavera AC 11 (0 TM, 0/0 FC), Real Noroeste 23 (4 TM, 1/1 FC), Retrô FC 22 (0 TM, 0/1 FC), SC Humaitá 23 (5 TM, 2/1 FC), Sousa 9 (0 TM, 0/0 FC), Tirol 49 (4 TM, 2/4 FC), Tocantinópolis 15 (2 TM, 2/0 FC), União Rondonópolis 39 (2 TM, 1/1 FC)

### Estadual AC

Rio Branco-AC 13 (1 TM, 0/0 FC), Santa Cruz-AC 16 (0 TM, 0/0 FC), Galvez EC 29 (0 TM, 0/1 FC), SC Humaitá 23 (5 TM, 2/1 FC), ADESG 23 (1 TM, 1/2 FC), Independência-AC 17 (0 TM, 0/0 FC), São Francisco FC 15 (0 TM, 0/0 FC), Vasco da Gama-AC 13 (0 TM, 0/1 FC)

### Estadual AL

ASA 37 (2 TM, 1/1 FC), CRB 44 (11 TM, 0/1 FC), CSA 35 (1 TM, 1/2 FC), Murici Sport 13 (1 TM, 1/0 FC), Coruripe 8 (1 TM, 0/1 FC), Cruzeiro-AL 17 (0 TM, 0/1 FC), CSE 16 (1 TM, 0/0 FC), Penedense 25 (1 TM, 0/1 FC)

### Estadual AP

Santos-AP 3 (0 TM, 0/0 FC), São José-AP 4 (1 TM, 0/0 FC), Oratório 15 (1 TM, 0/0 FC), Cristal 6 (1 TM, 0/0 FC), Independente-AP 11 (0 TM, 0/0 FC), Macapá 12 (1 TM, 0/3 FC), Trem 15 (1 TM, 0/0 FC), Ypiranga-AP 11 (1 TM, 1/1 FC)

### Estadual AM

Amazonas FC 42 (3 TM, 1/2 FC), Nacional-AM 24 (1 TM, 0/1 FC), Parintins FC 12 (0 TM, 0/0 FC), Manauara EC 18 (2 TM, 0/2 FC), Manaus FC 21 (0 TM, 0/1 FC), Princesa 0 (0 TM, 0/0 FC), Itacoatiara FC 4 (0 TM, 0/0 FC), São Raimundo-AM 8 (0 TM, 0/1 FC)

### Estadual BA

Bahia 41 (32 TM, 5/5 FC), Vitória 55 (32 TM, 2/6 FC), Jacuipense 22 (3 TM, 0/1 FC), Juazeirense 20 (0 TM, 0/1 FC), Atlético-BA 25 (1 TM, 1/0 FC), Bahia de Feira 5 (0 TM, 0/0 FC), Barcelona de Ilhéus 8 (0 TM, 0/0 FC), Galícia 8 (0 TM, 0/0 FC), Jequié 1 (0 TM, 0/0 FC), Porto-BA 22 (2 TM, 1/1 FC)

### Estadual CE

Ceará 43 (19 TM, 1/6 FC), Fortaleza 39 (26 TM, 2/2 FC), Ferroviário 28 (4 TM, 0/1 FC), Floresta-CE 40 (3 TM, 1/1 FC), Horizonte 2 (0 TM, 0/0 FC), Iguatu 14 (0 TM, 0/1 FC), Maracanã 15 (1 TM, 0/1 FC), Maranguape 4 (0 TM, 0/0 FC), Quixadá 28 (3 TM, 1/1 FC), Tirol 49 (4 TM, 2/4 FC)

### Estadual DF

Gama 19 (1 TM, 1/2 FC), Sobradinho 9 (1 TM, 0/0 FC), Ceilândia 21 (2 TM, 0/0 FC), Samambaia 10 (0 TM, 0/0 FC), ARUC 16 (0 TM, 0/0 FC), Brasília 20 (0 TM, 0/1 FC), Brasiliense 15 (1 TM, 0/0 FC), Capital CF 24 (2 TM, 0/0 FC), Paranoá 9 (1 TM, 0/1 FC), Real Brasília 6 (0 TM, 0/0 FC)

### Estadual ES

Porto Vitória 21 (0 TM, 0/0 FC), Serra 15 (2 TM, 1/1 FC), Vilavelhense 10 (3 TM, 0/0 FC), Vitória-ES 25 (2 TM, 0/1 FC), Desportiva Ferroviária 6 (0 TM, 0/0 FC), Forte FC 9 (0 TM, 0/0 FC), Real Noroeste 23 (4 TM, 1/1 FC), Rio Branco-ES 22 (0 TM, 0/0 FC), Capixaba 8 (0 TM, 0/0 FC), Rio Branco de Venda Nova 9 (0 TM, 0/0 FC)

### Estadual GO

Atlético Goianiense 50 (13 TM, 1/3 FC), Goiás 36 (8 TM, 0/2 FC), ABECAT Ouvidorense 4 (0 TM, 0/0 FC), Jataiense 6 (0 TM, 0/0 FC), Anapolina 3 (0 TM, 0/0 FC), Vila Nova 55 (12 TM, 2/1 FC), Anápolis 33 (4 TM, 0/0 FC), CRAC 12 (2 TM, 1/1 FC), Aparecidense 18 (0 TM, 0/1 FC), Centro Oeste FC 2 (0 TM, 0/0 FC), Goiatuba EC 29 (2 TM, 0/0 FC), Inhumas 14 (1 TM, 0/1 FC), -/ 0 (0 TM, 0/0 FC)

### Estadual MA

IAPE 15 (1 TM, 0/2 FC), Maranhão 22 (1 TM, 1/0 FC), Moto Club 20 (1 TM, 0/0 FC), Sampaio Corrêa 12 (0 TM, 0/0 FC), Imperatriz 19 (2 TM, 0/0 FC), Tuntum 9 (0 TM, 0/0 FC), ITZ Sport 8 (1 TM, 1/1 FC), Luminense 4 (0 TM, 0/0 FC)

### Estadual MT

Mixto 14 (0 TM, 0/0 FC), Atlético-MT 23 (4 TM, 2/3 FC), Campo Novo FC 51 (2 TM, 0/3 FC), Mixto 25 (0 TM, 0/0 FC), Várzea Grande 26 (2 TM, 0/2 FC), União Rondonópolis 39 (2 TM, 1/1 FC), Luverdense 13 (1 TM, 0/1 FC), CEOV Operário 9 (0 TM, 0/1 FC), Chapada 35 (0 TM, 0/4 FC)

### Estadual MS

Taveirópolis 15 (0 TM, 0/2 FC), 7 de Setembro-MS 30 (3 TM, 1/3 FC), Aquidauanense 11 (0 TM, 0/1 FC), Misto 12 (0 TM, 0/1 FC), Águia Negra 13 (0 TM, 0/1 FC), Ivinhema 30 (0 TM, 0/1 FC), Naviraiense 35 (2 TM, 1/1 FC), Costa Rica EC 8 (0 TM, 0/0 FC), FC Pantanal 35 (6 TM, 4/2 FC)

### Estadual MG

Atlético Mineiro 50 (35 TM, 6/7 FC), Cruzeiro 44 (31 TM, 3/3 FC), América Mineiro 45 (9 TM, 3/4 FC), Pouso Alegre 23 (2 TM, 0/2 FC), North Esporte Clube 3 (0 TM, 0/0 FC), URT 6 (0 TM, 0/0 FC), Tombense 9 (0 TM, 0/0 FC), Uberlândia 30 (0 TM, 0/0 FC), Athletic-MG 47 (11 TM, 2/3 FC), Betim Futebol 31 (2 TM, 0/0 FC), Democrata-GV 17 (2 TM, 2/2 FC), Itabirito FC 4 (0 TM, 0/0 FC)

### Estadual PA

Paysandu 47 (3 TM, 0/2 FC), Remo 38 (26 TM, 3/4 FC), Cametá 2 (0 TM, 0/0 FC), Castanhal 12 (0 TM, 0/0 FC), Águia 18 (1 TM, 0/0 FC), Capitão Poço 0 (0 TM, 0/0 FC), Santa Rosa 1 (0 TM, 0/0 FC), Tuna Luso 16 (0 TM, 0/0 FC), Amazônia Independente 2 (0 TM, 0/0 FC), Bragantino-PA 5 (1 TM, 1/1 FC), São Francisco-PA 7 (0 TM, 0/1 FC), São Raimundo-PA 12 (0 TM, 0/0 FC)

### Estadual PB

Botafogo-PB 37 (7 TM, 0/0 FC), Sousa 9 (0 TM, 0/0 FC), Campinense 28 (2 TM, 0/3 FC), Serra Branca-PB 37 (4 TM, 2/2 FC), Atlético-PB 30 (0 TM, 0/0 FC), Confiança-PB 9 (0 TM, 0/0 FC), Esporte de Patos 30 (5 TM, 1/3 FC), Nacional-PB 26 (2 TM, 0/0 FC), Pombal EC 13 (1 TM, 0/0 FC), Treze 32 (2 TM, 1/3 FC)

### Estadual PR

Londrina 46 (13 TM, 2/3 FC), Operário Ferroviário 42 (5 TM, 2/3 FC), Athletico Paranaense 52 (27 TM, 3/4 FC), Coritiba 43 (28 TM, 2/2 FC), Azuriz Futebol 31 (4 TM, 1/1 FC), Cianorte 22 (2 TM, 0/0 FC), Foz do Iguaçu 34 (3 TM, 0/0 FC), São Joseense 40 (3 TM, 1/0 FC), Andraus 4 (0 TM, 0/0 FC), FC Cascavel 40 (2 TM, 0/2 FC), Galo Maringá 6 (0 TM, 0/0 FC), Maringá 33 (5 TM, 1/1 FC)

### Estadual PE

Náutico 50 (8 TM, 1/1 FC), Sport 48 (21 TM, 1/3 FC), Retrô FC 22 (0 TM, 0/1 FC), Santa Cruz 39 (2 TM, 0/3 FC), Decisão 20 (1 TM, 1/1 FC), Maguary-PE 22 (2 TM, 0/1 FC), Jaguar 49 (4 TM, 1/1 FC), Vitória das Tabocas 9 (0 TM, 0/0 FC)

### Estadual PI

Atlético Piauiense 4 (0 TM, 0/1 FC), Piauí 15 (0 TM, 0/1 FC), Altos 13 (0 TM, 0/1 FC), Fluminense-PI 14 (1 TM, 0/1 FC), Corisabbá 19 (2 TM, 1/1 FC), Oeirense 9 (0 TM, 0/0 FC), Parnahyba 30 (1 TM, 1/2 FC), Teresina EC 8 (1 TM, 0/0 FC)

### Estadual RJ

Flamengo 48 (31 TM, 2/3 FC), Fluminense 51 (30 TM, 2/5 FC), Madureira 46 (5 TM, 1/3 FC), Vasco 59 (37 TM, 9/11 FC), Bangu 25 (3 TM, 0/0 FC), Botafogo 58 (38 TM, 7/9 FC), Boavista-RJ 33 (0 TM, 0/0 FC), Volta Redonda 41 (5 TM, 1/3 FC), Maricá 38 (3 TM, 0/1 FC), Nova Iguaçu 40 (0 TM, 0/1 FC), Portuguesa-RJ 30 (0 TM, 0/1 FC), Sampaio Corrêa-RJ 36 (0 TM, 0/1 FC)

### Estadual RN

ABC 28 (0 TM, 0/0 FC), América-RN 17 (1 TM, 1/2 FC), Potiguar 5 (1 TM, 0/0 FC), QFC 8 (0 TM, 0/0 FC), Laguna 12 (2 TM, 0/2 FC), Santa Cruz de Natal 5 (0 TM, 0/0 FC), Globo FC 18 (2 TM, 2/1 FC), Potyguar Seridoense 12 (0 TM, 0/1 FC)

### Estadual RS

Grêmio 49 (30 TM, 4/5 FC), Internacional 43 (30 TM, 4/5 FC), Juventude 52 (18 TM, 1/2 FC), Ypiranga-RS 24 (4 TM, 1/2 FC), Caxias 25 (2 TM, 0/3 FC), Novo Hamburgo 11 (0 TM, 0/1 FC), São José-RS 25 (2 TM, 0/1 FC), São Luiz 8 (0 TM, 0/0 FC), Avenida 4 (0 TM, 0/0 FC), Guarany de Bagé 8 (1 TM, 0/0 FC), Inter SM 8 (0 TM, 0/0 FC), Monsoon 15 (1 TM, 0/0 FC)

### Estadual RO

Guaporé 19 (0 TM, 0/2 FC), Rondoniense 8 (1 TM, 0/0 FC), Gazin Porto Velho EC 18 (0 TM, 0/0 FC), Ji-Paraná 9 (1 TM, 1/1 FC), Barcelona-RO 14 (2 TM, 1/2 FC), Genus 32 (3 TM, 1/3 FC), União Cacoalense 11 (0 TM, 0/1 FC)

### Estadual RR

Baré 11 (1 TM, 1/1 FC), GAS 25 (1 TM, 0/2 FC), Monte Roraima 27 (2 TM, 1/1 FC), São Raimundo-RR 19 (0 TM, 0/0 FC), Atlético Roraima 24 (3 TM, 1/2 FC), Náutico-RR 17 (1 TM, 1/4 FC), Progresso-RR 22 (1 TM, 0/0 FC), Rio Negro-RR 18 (1 TM, 0/0 FC), River-RR 8 (0 TM, 0/0 FC)

### Estadual SC

Barra-SC 52 (1 TM, 1/2 FC), Chapecoense 58 (22 TM, 4/5 FC), Camboriú 7 (1 TM, 0/1 FC), Criciúma 38 (7 TM, 1/1 FC), Avaí 48 (11 TM, 3/6 FC), Brusque 34 (3 TM, 0/1 FC), Concórdia 7 (0 TM, 0/0 FC), Santa Catarina 40 (4 TM, 1/1 FC), Carlos Renaux 5 (0 TM, 0/0 FC), Figueirense 41 (3 TM, 0/1 FC), Joinville 47 (4 TM, 1/1 FC), Marcílio Dias 46 (3 TM, 2/5 FC)

### Estadual SP

Grêmio Novorizontino 51 (8 TM, 2/4 FC), Palmeiras 48 (31 TM, 1/1 FC), Corinthians 55 (27 TM, 6/9 FC), São Paulo 47 (33 TM, 4/4 FC), Capivariano 6 (0 TM, 0/0 FC), Portuguesa 21 (2 TM, 0/0 FC), Red Bull Bragantino 46 (29 TM, 1/3 FC), Santos 50 (32 TM, 3/2 FC), Botafogo-SP 39 (4 TM, 0/1 FC), Guarani 34 (1 TM, 0/1 FC), Mirassol 37 (26 TM, 2/5 FC), Noroeste 41 (4 TM, 1/1 FC), Ponte Preta 43 (5 TM, 0/2 FC), Primavera 38 (2 TM, 0/1 FC), São Bernardo 36 (6 TM, 0/0 FC), Velo Clube 16 (0 TM, 0/0 FC)

### Estadual SE

Confiança 27 (2 TM, 0/0 FC), Sergipe 14 (2 TM, 0/0 FC), América-SE 16 (1 TM, 0/1 FC), Itabaiana 25 (2 TM, 1/1 FC), Falcon FC 26 (1 TM, 0/2 FC), Guarany-SE 22 (1 TM, 0/2 FC), Lagarto-SE 22 (2 TM, 0/1 FC), Atlético Gloriense 17 (0 TM, 0/1 FC), Desportiva Aracaju 16 (0 TM, 0/0 FC), Dorense 17 (2 TM, 1/2 FC)

### Estadual TO

Tocantinópolis 15 (2 TM, 2/0 FC), União Atlético 26 (2 TM, 1/0 FC), Capital FC 8 (0 TM, 0/1 FC), Gurupi 8 (0 TM, 0/0 FC), Araguaína 9 (0 TM, 0/0 FC), Bela Vista-TO 27 (4 TM, 0/2 FC), Guaraí 49 (3 TM, 2/6 FC), Palmas 19 (1 TM, 1/0 FC)

### ARG

Belgrano 36 (24 TM, 18/19 FC), River Plate 39 (27 TM, 19/20 FC), Argentinos Juniors 34 (28 TM, 23/26 FC), Rosario Central 46 (30 TM, 19/21 FC), Gimnasia 38 (25 TM, 20/21 FC), Huracán 29 (23 TM, 16/17 FC), Racing Club 37 (22 TM, 17/21 FC), Unión 35 (25 TM, 17/20 FC), Boca Juniors 37 (29 TM, 24/25 FC), Estudiantes 40 (32 TM, 23/25 FC), Independiente 33 (21 TM, 13/15 FC), Independiente Rivadavia 32 (28 TM, 18/19 FC), Lanús 30 (22 TM, 16/19 FC), San Lorenzo 43 (30 TM, 23/26 FC), Talleres 35 (26 TM, 14/15 FC), Vélez Sarsfield 31 (20 TM, 16/16 FC), Aldosivi 45 (26 TM, 22/25 FC), Atlético Tucumán 36 (28 TM, 21/22 FC), Banfield 36 (25 TM, 16/18 FC), Barracas Central 37 (33 TM, 24/27 FC), Central Córdoba S.Estero 38 (26 TM, 16/18 FC), Defensa y Justicia 36 (27 TM, 21/22 FC), Deportivo Riestra 37 (28 TM, 15/18 FC), Estudiantes Río Cuarto 47 (29 TM, 10/11 FC), Gimnasia Mendoza 34 (29 TM, 8/8 FC), Instituto 36 (25 TM, 20/24 FC), Newell´s Old Boys 40 (31 TM, 18/20 FC), Platense 39 (34 TM, 23/26 FC), Sarmiento de Junín 36 (29 TM, 23/24 FC), Tigre 36 (28 TM, 24/25 FC)

### BOL

ABB 50 (0 TM, 0/2 FC), Always Ready 49 (6 TM, 0/2 FC), Aurora 47 (2 TM, 0/2 FC), Blooming 49 (4 TM, 0/0 FC), Bolívar 44 (12 TM, 10/18 FC), Guabirá 38 (2 TM, 0/1 FC), Gualberto Villarroel 51 (1 TM, 0/7 FC), Independiente Petrolero 49 (1 TM, 0/5 FC), Nacional Potosí 33 (0 TM, 0/9 FC), Oriente Petrolero 52 (2 TM, 0/4 FC), Real Oruro 44 (0 TM, 0/2 FC), Real Potosí 33 (2 TM, 0/1 FC), Real Tomayapo 46 (1 TM, 1/3 FC), San Antonio Bulo Bulo 39 (2 TM, 2/8 FC), The Strongest 37 (5 TM, 1/3 FC), Universitario de Vinto 51 (1 TM, 1/5 FC)

### CHI

Audax Italiano 38 (4 TM, 4/9 FC), Cobresal 42 (3 TM, 1/3 FC), Colo-Colo 44 (7 TM, 3/16 FC), Coquimbo Unido 39 (1 TM, 0/0 FC), Deportes Concepción 37 (2 TM, 2/8 FC), Deportes Limache 35 (3 TM, 2/7 FC), Everton 34 (5 TM, 1/3 FC), Huachipato 40 (2 TM, 1/2 FC), La Serena 45 (4 TM, 3/7 FC), Ñublense 40 (1 TM, 1/5 FC), O´Higgins 37 (8 TM, 5/7 FC), Palestino 43 (3 TM, 3/21 FC), Unión La Calera 41 (2 TM, 1/2 FC), Univ. Católica 48 (7 TM, 7/23 FC), Univ. Concepción 44 (5 TM, 4/7 FC), Universidad de Chile 44 (12 TM, 7/15 FC)

### COL

Atlético Nacional 50 (31 TM, 24/23 FC), Junior Barranquilla 32 (25 TM, 4/3 FC), Santa Fe 47 (22 TM, 4/4 FC), Tolima 39 (25 TM, 1/2 FC), América de Cali 34 (21 TM, 8/10 FC), Deportivo Pasto 39 (23 TM, 2/2 FC), Internacional de Bogotá 34 (26 TM, 5/5 FC), Once Caldas 29 (20 TM, 11/12 FC), Alianza FC 37 (23 TM, 2/2 FC), Atlético Bucaramanga 40 (21 TM, 11/11 FC), Boyacá Chicó 51 (26 TM, 3/2 FC), Cúcuta Deportivo 44 (14 TM, 1/2 FC), Deportivo Cali 38 (28 TM, 5/6 FC), Deportivo Pereira 39 (26 TM, 2/1 FC), Fortaleza FC 39 (23 TM, 2/2 FC), Independiente Medellín 46 (22 TM, 4/6 FC), Jaguares de Córdoba 39 (9 TM, 1/3 FC), Llaneros 41 (23 TM, 3/3 FC), Millonarios 39 (26 TM, 6/8 FC), Rionegro Águilas 38 (17 TM, 3/4 FC)

### EQU

Emelec 43 (5 TM, 1/6 FC), Guayaquil City 30 (0 TM, 0/1 FC), Leones Del Norte 40 (1 TM, 0/1 FC), Libertad de Loja 29 (1 TM, 0/3 FC), Aucas 35 (3 TM, 2/4 FC), Barcelona SC 46 (7 TM, 2/12 FC), Delfín SC 35 (2 TM, 0/2 FC), Deportivo Cuenca 35 (1 TM, 1/5 FC), Independiente del Valle 49 (5 TM, 5/20 FC), LDU Quito 40 (8 TM, 6/20 FC), Macará 32 (1 TM, 1/1 FC), Manta FC 36 (2 TM, 0/3 FC), Mushuc Runa 42 (1 TM, 0/10 FC), Orense SC 43 (2 TM, 0/1 FC), Técnico Univ. 35 (1 TM, 0/1 FC), Universidad Catolica 28 (5 TM, 4/15 FC)

### PAR

2 de Mayo 33 (2 TM, 1/5 FC), Cerro Porteño 50 (12 TM, 7/20 FC), Guaraní 50 (5 TM, 4/15 FC), Libertad 45 (5 TM, 3/23 FC), Nacional 34 (6 TM, 2/4 FC), Olimpia 39 (14 TM, 6/15 FC), Recoleta 46 (3 TM, 0/0 FC), Rubio Ñú 38 (4 TM, 1/4 FC), San Lorenzo 54 (0 TM, 0/1 FC), Sportivo Ameliano 40 (2 TM, 1/5 FC), Sportivo Luqueño 37 (4 TM, 3/18 FC), Sportivo Trinidense 44 (0 TM, 0/4 FC)

### PER

ADT 35 (2 TM, 0/1 FC), Alianza Atlético 31 (6 TM, 0/2 FC), Alianza Lima 66 (18 TM, 15/23 FC), Atlético Grau 33 (2 TM, 1/13 FC), Cienciano 30 (3 TM, 2/8 FC), Comerciantes Unidos 31 (1 TM, 1/4 FC), Cusco FC 45 (0 TM, 0/5 FC), Deportivo Garcilaso 30 (1 TM, 0/6 FC), FBC Melgar 37 (9 TM, 3/17 FC), FC Cajamarca 31 (0 TM, 0/2 FC), Juan Pablo II College 36 (2 TM, 1/3 FC), Los Chankas 32 (0 TM, 0/0 FC), Sport Boys Callao 34 (3 TM, 3/5 FC), Sport Huancayo 33 (2 TM, 0/2 FC), Sporting Cristal 42 (11 TM, 7/16 FC), UCV Moquegua 34 (0 TM, 0/1 FC), Univ. Técnica 26 (0 TM, 0/4 FC), Universitario 47 (14 TM, 12/21 FC)

### URU

Boston River 37 (3 TM, 2/14 FC), CA Cerro 38 (6 TM, 1/6 FC), Cerro Largo 36 (2 TM, 1/9 FC), Danubio 38 (1 TM, 0/4 FC), Defensor Sporting 35 (2 TM, 2/2 FC), Juventud 36 (6 TM, 3/7 FC), Liverpool Montevideo 39 (4 TM, 3/7 FC), Montevideo City 37 (1 TM, 0/1 FC), Montevideo Wanderers 50 (1 TM, 0/0 FC), Nacional 34 (11 TM, 9/15 FC), Peñarol 46 (17 TM, 8/16 FC), Progreso 46 (4 TM, 1/3 FC), Racing 34 (1 TM, 1/11 FC), Albion 38 (4 TM, 0/3 FC), Central Español 39 (3 TM, 0/4 FC), Deportivo Maldonado 39 (4 TM, 1/1 FC)

### VEN

Academia Anzoátegui 40 (1 TM, 0/3 FC), Academia Puerto Cabello 48 (7 TM, 4/17 FC), Carabobo 45 (7 TM, 2/14 FC), Caracas FC 43 (3 TM, 2/15 FC), Dep. La Guaira 50 (6 TM, 0/2 FC), Deportivo Táchira 45 (5 TM, 1/12 FC), Estudiantes de Mérida 40 (2 TM, 0/0 FC), Metropolitanos FC 45 (1 TM, 0/2 FC), Monagas SC 44 (3 TM, 0/0 FC), Portuguesa FC 46 (0 TM, 0/1 FC), Rayo Zuliano FC 59 (2 TM, 0/1 FC), Trujillanos FC 50 (0 TM, 0/2 FC), UCV FC 57 (3 TM, 1/5 FC), Zamora FC 57 (4 TM, 0/5 FC)

### Libertadores

Flamengo 48 (31 TM, 2/3 FC), Fluminense 51 (30 TM, 2/5 FC), Corinthians 55 (27 TM, 6/9 FC), Independiente del Valle 49 (5 TM, 5/20 FC), LDU Quito 40 (8 TM, 6/20 FC), Platense 39 (34 TM, 23/26 FC), Cerro Porteño 50 (12 TM, 7/20 FC), Coquimbo Unido 39 (1 TM, 0/0 FC), Cruzeiro 44 (31 TM, 3/3 FC), Independiente Rivadavia 32 (28 TM, 18/19 FC), Mirassol 37 (26 TM, 2/5 FC), Rosario Central 46 (30 TM, 19/21 FC), Tolima 39 (25 TM, 1/2 FC), Univ. Católica 48 (7 TM, 7/23 FC), Always Ready 49 (6 TM, 0/2 FC), Barcelona SC 46 (7 TM, 2/12 FC), Boca Juniors 37 (29 TM, 24/25 FC), Bolívar 44 (12 TM, 10/18 FC), Cusco FC 45 (0 TM, 0/5 FC), Dep. La Guaira 50 (6 TM, 0/2 FC), Independiente Medellín 46 (22 TM, 4/6 FC), Junior Barranquilla 32 (25 TM, 4/3 FC), Lanús 30 (22 TM, 16/19 FC), Libertad 45 (5 TM, 3/23 FC), Nacional 34 (11 TM, 9/15 FC), Peñarol 46 (17 TM, 8/16 FC), Santa Fe 47 (22 TM, 4/4 FC), Sporting Cristal 42 (11 TM, 7/16 FC), UCV FC 57 (3 TM, 1/5 FC), Universitario 47 (14 TM, 12/21 FC), Botafogo 58 (38 TM, 7/9 FC), Carabobo 45 (7 TM, 2/14 FC), Juventud 36 (6 TM, 3/7 FC), O´Higgins 37 (8 TM, 5/7 FC), 2 de Mayo 33 (2 TM, 1/5 FC), Argentinos Juniors 34 (28 TM, 23/26 FC), Bahia 41 (32 TM, 5/5 FC), Deportivo Táchira 45 (5 TM, 1/12 FC), Guaraní 50 (5 TM, 4/15 FC), Huachipato 40 (2 TM, 1/2 FC), Liverpool Montevideo 39 (4 TM, 3/7 FC), Nacional Potosí 33 (0 TM, 0/9 FC), Alianza Lima 66 (18 TM, 15/23 FC), The Strongest 37 (5 TM, 1/3 FC), Estudiantes 40 (32 TM, 23/25 FC), Palmeiras 48 (31 TM, 1/1 FC), Universidad Catolica 28 (5 TM, 4/15 FC)

### Sul-Americana

Montevideo City 37 (1 TM, 0/1 FC), Vasco 59 (37 TM, 9/11 FC), Cienciano 30 (3 TM, 2/8 FC), Santa Fe 47 (22 TM, 4/4 FC), Santos 50 (32 TM, 3/2 FC), São Paulo 47 (33 TM, 4/4 FC), Bolívar 44 (12 TM, 10/18 FC), Botafogo 58 (38 TM, 7/9 FC), Macará 32 (1 TM, 1/1 FC), Olimpia 39 (14 TM, 6/15 FC), Recoleta 46 (3 TM, 0/0 FC), Red Bull Bragantino 46 (29 TM, 1/3 FC), River Plate 39 (27 TM, 19/20 FC), Tigre 36 (28 TM, 24/25 FC), Caracas FC 43 (3 TM, 2/15 FC), Grêmio 49 (30 TM, 4/5 FC), Independiente Medellín 46 (22 TM, 4/6 FC), Lanús 30 (22 TM, 16/19 FC), Nacional 34 (11 TM, 9/15 FC), O´Higgins 37 (8 TM, 5/7 FC), Sporting Cristal 42 (11 TM, 7/16 FC), UCV FC 57 (3 TM, 1/5 FC), Academia Puerto Cabello 48 (7 TM, 4/17 FC), Alianza Atlético 31 (6 TM, 0/2 FC), América de Cali 34 (21 TM, 8/10 FC), Audax Italiano 38 (4 TM, 4/9 FC), Barracas Central 37 (33 TM, 24/27 FC), Blooming 49 (4 TM, 0/0 FC), Boston River 37 (3 TM, 2/14 FC), Carabobo 45 (7 TM, 2/14 FC), Deportivo Cuenca 35 (1 TM, 1/5 FC), Deportivo Riestra 37 (28 TM, 15/18 FC), Independiente Petrolero 49 (1 TM, 0/5 FC), Juventud 36 (6 TM, 3/7 FC), Millonarios 39 (26 TM, 6/8 FC), Palestino 43 (3 TM, 3/21 FC), Racing Club 37 (22 TM, 17/21 FC), San Lorenzo 43 (30 TM, 23/26 FC), Atlético Bucaramanga 40 (21 TM, 11/11 FC), Atlético Nacional 50 (31 TM, 24/23 FC), Cobresal 42 (3 TM, 1/3 FC), Defensor Sporting 35 (2 TM, 2/2 FC), Deportivo Garcilaso 30 (1 TM, 0/6 FC), FBC Melgar 37 (9 TM, 3/17 FC), Guabirá 38 (2 TM, 0/1 FC), Libertad de Loja 29 (1 TM, 0/3 FC), Metropolitanos FC 45 (1 TM, 0/2 FC), Monagas SC 44 (3 TM, 0/0 FC), Nacional 34 (6 TM, 2/4 FC), Orense SC 43 (2 TM, 0/1 FC), Racing 34 (1 TM, 1/11 FC), San Antonio Bulo Bulo 39 (2 TM, 2/8 FC), Sportivo Trinidense 44 (0 TM, 0/4 FC), Universidad de Chile 44 (12 TM, 7/15 FC), Atlético Mineiro 50 (35 TM, 6/7 FC), Boca Juniors 37 (29 TM, 24/25 FC)
