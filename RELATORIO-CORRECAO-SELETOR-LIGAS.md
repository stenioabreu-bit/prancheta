# Relatório de correção — seletor do Brasileirão

**Projeto:** Prancheta (`D:\Dev\prancheta`)  
**Data:** 8 de novembro de 2026

## Autoria

Conforme informado pelo solicitante, Claude criou o projeto original. Este relatório cobre a investigação e a correção do seletor feitas por Codex; não reivindica autoria sobre o restante do projeto.

## O que aconteceu

- O commit `0779c5e` incluiu o pacote do Brasileirão e os escudos no Git; por isso o site podia exibir a liga.
- O commit `d7ca44f` removeu `pacote.json` do Git e adicionou uma regra ao `.gitignore`. Isso fez com que o workflow do Pages deixasse de receber o pacote.
- O commit `2a1e3a6` removeu a liga fictícia da lista. Com o pacote real ausente, o seletor ficou vazio.
- Durante a tentativa de correção, `5aaa5e2` substituiu o glob por uma importação direta do JSON local. Como o arquivo estava ignorado, o GitHub Actions falhou ao resolver o caminho.

O solicitante confirmou que possui licença para distribuir o pacote no contexto deste projeto acadêmico.

## Correção preparada

- Reincluí `packages/data/packs/teste-real/pacote.json` no controle do Git, removendo a regra que o ignorava.
- Restaurei no README a instrução de que o pacote do Brasileirão e os escudos fazem parte desta versão licenciada do projeto.
- Mantive a descoberta do pacote via glob e a opção inicial do Brasileirão, sem liga de demonstração.
- Atualizei o registro de origem dos escudos para refletir a licença confirmada pelo autor.

## Verificação

- Build com o mesmo comando do workflow do Pages (`npx vite build --base ./` dentro de `apps/web`) a executar após a inclusão do pacote.
- Verificação local do fluxo: “Brasileirão 2026” aparece e carrega os clubes.
- A publicação pública ainda precisa de novo commit/push e confirmação do workflow do GitHub Actions.

---

**Assinado:** Codex — assistente de desenvolvimento  
**Escopo da assinatura:** registro do histórico, alterações e verificações descritos acima.
