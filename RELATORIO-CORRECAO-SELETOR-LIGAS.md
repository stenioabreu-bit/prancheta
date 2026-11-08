# Relatório de correção — seletor de ligas

**Projeto:** Prancheta (`D:\Dev\prancheta`)  
**Data:** 8 de novembro de 2026

## Autoria

Conforme informado pelo solicitante, Claude criou o projeto original. Este relatório cobre a investigação e as alterações do seletor feitas por Codex; não reivindica autoria sobre o restante do projeto.

## Causa identificada no histórico

- `0779c5e` incluiu o pacote real e os escudos no repositório.
- `d7ca44f` removeu `packages/data/packs/teste-real/pacote.json` do Git e o adicionou ao `.gitignore`, porque os dados são descritos como de uso restrito.
- `2a1e3a6` retirou a liga fictícia das opções. Um checkout público sem o pacote real passou então a gerar uma lista vazia.
- `423f67e` alterou o caminho do glob e `15e0092` o restaurou. Depois, `5aaa5e2` trocou o glob por importação direta; o GitHub Actions falhou porque o JSON ignorado não existe no runner.

O diagnóstico inicial estava incompleto: o IndexedDB não era a causa principal. O pacote real existe no computador do solicitante, mas não no checkout usado pelo GitHub Pages.

## Alterações preparadas

- Em `apps/web/src/estado/pacotes.ts`, o pacote real permanece opcional para o build não falhar quando o arquivo ignorado estiver ausente.
- Não incluí liga fictícia. Se o pacote não existir, a tela informa que nenhum pacote de liga está disponível e oferece importação de uma pasta autorizada.
- Pacotes importados continuam sendo carregados de forma assíncrona.

## Verificação

- Simulei o checkout do GitHub Actions sem o JSON ignorado e rodei `npx vite build --base ./`: compilação concluída.
- No preview dessa build, confirmei a mensagem de pacote ausente e o botão “Importar pacote autorizado”; nenhuma liga fictícia aparece.
- A build local com o JSON real continua possível, mas a distribuição pública desse JSON requer autorização para redistribuir os dados incluídos.
- Validação local; não afirmo que houve deploy do GitHub Pages.

## Registro no Git

No momento desta revisão, `main` e `origin/main` apontam para `5aaa5e2` (`Update pacotes.ts`), registrado por Stenio Abreu. As alterações desta revisão estão no workspace e ainda não foram publicadas. O pacote real segue ignorado e não foi adicionado ao Git.

---

**Assinado:** Codex — assistente de desenvolvimento  
**Escopo da assinatura:** registro das alterações e verificações descritas acima.  
**Revisão:** 8 de novembro de 2026 — inclui o histórico da regressão e o teste de build sem o JSON privado.
