import { defineConfig, devices } from "@playwright/test";

/** Fluxos de ponta a ponta no celular e no PC. */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5318", trace: "retain-on-failure" },
  webServer: {
    command: "npx vite --port 5318 --strictPort",
    url: "http://localhost:5318",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "pc", use: { browserName: "chromium", viewport: { width: 1366, height: 850 } } },
  ],
});
