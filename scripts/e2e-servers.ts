/* eslint-disable no-empty */
import { join, resolve } from "node:path";

const isLazy = process.argv.includes("--lazy");

const API_PORT = Number(process.env.E2E_API_PORT ?? 3001);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5173);

const API_BASE = `http://127.0.0.1:${API_PORT}`;
const WEB_BASE = `http://127.0.0.1:${WEB_PORT}`;

const rootDir = resolve(import.meta.dir, "..");
const apiDir = join(rootDir, "apps", "api");
const webDir = join(rootDir, "apps", "web");

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitForOk(urls: string[], timeoutMs = 120_000) {
    const start = Date.now();
    let lastErr: unknown = null;

    while (Date.now() - start < timeoutMs) {
        for (const url of urls) {
            try {
                const res = await fetch(url, { method: "GET" });
                if (res.ok) return;
            } catch (e) {
                lastErr = e;
            }
        }
        await sleep(350);
    }

    throw new Error(
        `Timeout waiting for server. Tried: ${urls.join(", ")}. LastErr: ${String(lastErr)}`
    );
}

function spawnProc(name: string, cmd: string[], cwd: string, env: Record<string, string>) {
    const p = Bun.spawn({
        cmd,
        cwd,
        env: { ...process.env, ...env },
        stdout: "inherit",
        stderr: "inherit",
    });

    p.exited.then((code) => {
        // Kalau server mati, biar Playwright cepat fail
        console.error(`[e2e] ${name} exited with code ${code}`);
        process.exit(code === 0 ? 1 : code);
    });

    return p;
}

const apiProc = spawnProc(
    "api",
    ["bun", "run", "dev"],
    apiDir,
    { PORT: String(API_PORT) }
);

const webProc = spawnProc(
    "web",
    [
        "bun",
        "run",
        "dev",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        String(WEB_PORT),
        "--strictPort",
    ],
    webDir,
    {
        VITE_TREE_MODE: isLazy ? "lazy" : "full",
    }
);

async function main() {
    // API readiness: coba beberapa endpoint (biar tidak tergantung 1 path health)
    await waitForOk(
        [
            `${API_BASE}/api/health`,
            `${API_BASE}/health`,
            `${API_BASE}/api/v1/folders/tree`, // fallback: endpoint yang pasti ada
        ],
        120_000
    );

    // Web readiness: cukup root
    await waitForOk([`${WEB_BASE}/`], 120_000);

    console.log(`[e2e] Ready. mode=${isLazy ? "lazy" : "full"} web=${WEB_BASE} api=${API_BASE}`);

    // keep-alive sampai Playwright mengirim SIGTERM
    await new Promise(() => { });
}

function shutdown() {
    try { apiProc.kill(); } catch { }
    try { webProc.kill(); } catch { }
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((e) => {
    console.error("[e2e] failed:", e);
    shutdown();
});
