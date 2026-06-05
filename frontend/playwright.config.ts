import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
const apiURL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8787").replace(
  /\/$/,
  "",
);

process.env.NEXT_PUBLIC_API_URL = apiURL;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "on-first-retry",
  },
  webServer: {
    command: `bun run dev --hostname 127.0.0.1 --port ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://127.0.0.1:${port}`,
  },
});
