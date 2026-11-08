import { type Page, expect, test } from "@playwright/test";

/** Screenshots de referência (fora do git) para conferir o layout de cada dispositivo. */
async function foto(page: Page, nome: string) {
  await page.screenshot({ path: `e2e/fotos/${test.info().project.name}-${nome}.png`, fullPage: true });
}

async function novoJogo(page: Page) {
  await page.goto("/");
  await page.getByLabel("Seu nome").fill("Teste");
  await page.getByRole("button", { name: /Real Planalto/ }).click();
  await foto(page, "01-novo-jogo");
  await page.getByRole("button", { name: "Assumir o clube" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Real Planalto" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => indexedDB.deleteDatabase("prancheta"));
});

test("novo jogo, partida completa e o save sobrevive ao recarregar", async ({ page }) => {
  await novoJogo(page);
  await foto(page, "02-inicio");
  await page.getByRole("button", { name: "Ir para o jogo" }).click();
  await expect(page.getByText("Preleção no vestiário")).toBeVisible();
  await page.getByRole("button", { name: /^Motivar/ }).click();
  await expect(page.getByRole("status").first()).toBeVisible();
  await foto(page, "03-pre-jogo");
  await page.getByRole("button", { name: "Começar o jogo" }).click();
  await page.waitForTimeout(800);
  await foto(page, "04-jogo");
  await page.getByRole("button", { name: "Até o fim" }).click();
  await expect(page.getByText("Conversa no vestiário")).toBeVisible();
  await expect(page.locator(".clock")).toContainText("Encerrado");
  await foto(page, "05-pos-jogo");
  await page.getByRole("button", { name: "Voltar ao clube" }).click();
  await expect(page.locator(".top .sub")).toContainText("rodada 2/38");

  await page.waitForTimeout(700); // save automático (400 ms)
  await page.reload();
  await expect(page.locator(".top .sub")).toContainText("rodada 2/38");
});

test("abas: elenco, tática, tabela e clube", async ({ page }) => {
  await novoJogo(page);
  const menu = page.getByRole("navigation", { name: "Seções" });

  await menu.getByRole("button", { name: /Elenco/ }).click();
  await expect(page.getByRole("heading", { name: /Elenco · \d+/ })).toBeVisible();
  await page.locator(".prow").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Elogiar a fase dele" }).click();
  await expect(page.locator(".resposta")).toBeVisible();
  await foto(page, "06-jogador");
  await page.getByRole("button", { name: "Fechar" }).click();

  await menu.getByRole("button", { name: /Tática/ }).click();
  await page.getByLabel("Esquema").selectOption("4-4-2");
  await expect(page.getByRole("group", { name: "Escalação no 4-4-2" })).toBeVisible();
  await page.getByRole("button", { name: /^ATA:/ }).first().click();
  await expect(page.getByLabel("Função")).toBeVisible();
  await page.getByLabel("Função").selectOption("Pivô");
  await page.getByRole("button", { name: "Fechar" }).click();
  await foto(page, "07-tatica");

  await menu.getByRole("button", { name: /Tabela/ }).click();
  await expect(page.locator("table")).toBeVisible();
  await page.getByRole("button", { name: "Série D" }).click();
  await expect(page.getByLabel("Grupo")).toBeVisible();
  await page.getByRole("button", { name: "Copa do Brasil" }).click();
  await foto(page, "08-tabela");

  await menu.getByRole("button", { name: /Clube/ }).click();
  await expect(page.getByRole("heading", { name: "Caixa de mensagens" })).toBeVisible();
  await page.getByRole("button", { name: /^Mercado/ }).click();
  await page.getByRole("button", { name: "Indicar" }).first().click();
  await expect(page.getByRole("status")).toContainText("indicado");
  await foto(page, "09-mercado");
  await page.getByRole("button", { name: /^Treino/ }).click();
  await page.getByRole("button", { name: /^Tático/ }).click();
  await page.getByRole("button", { name: /^Comissão/ }).click();
  await expect(page.getByLabel("Auxiliar técnico")).toBeVisible();
  await page.getByRole("button", { name: /^Base/ }).click();
  await page
    .getByRole("button", { name: /^Promover/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("promovido");
});

test("simular jogos sem assistir avança a temporada", async ({ page }) => {
  await novoJogo(page);
  for (let i = 0; i < 5; i++) {
    const simular = page.getByRole("button", { name: "Simular sem assistir" });
    const avancar = page.getByRole("button", { name: "Avançar rodada" });
    if (await simular.isVisible()) await simular.click();
    else await avancar.click();
  }
  await expect(page.locator(".top .sub")).toContainText("rodada 6/38");
  await expect(page.locator(".news li").first()).toBeVisible();
});
