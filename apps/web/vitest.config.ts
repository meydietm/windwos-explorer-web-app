import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: "happy-dom",
        globals: true,
        include: ["test/**/*.test.ts"],
        exclude: ["e2e/**", "node_modules/**"],
    },
});