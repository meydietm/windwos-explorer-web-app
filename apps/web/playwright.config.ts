import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    testIgnore: ["**/lazy.spec.ts"],
    timeout: 60_000,
    retries: process.env.CI ? 1 : 0,
    use: {
        baseURL: "http://127.0.0.1:5173",
        trace: "on-first-retry",
    },
    webServer: {
        command: "bun ../../scripts/e2e-servers.ts",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
