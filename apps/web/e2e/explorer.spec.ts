import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:3001";

test("search -> load more works", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("global-search").fill("report");

    await expect(page.getByTestId("search-results")).toBeVisible();

    const items = page.getByTestId("search-item");
    await expect(items).toHaveCount(30); // default limit kamu 30

    await page.getByTestId("search-load-more").click();

    await expect
        .poll(async () => await items.count())
        .toBeGreaterThan(30);
});

test("deep-link /folders/:id opens folder contents", async ({ page, request }) => {
    // ambil folder id untuk Downloads lewat API search
    const res = await request.get(
        `${API}/api/v1/search?q=Downloads&types=folders&limit=1&offset=0`
    );
    expect(res.ok()).toBeTruthy();

    const json = await res.json();
    const downloads = json.results?.[0];
    expect(downloads?.kind).toBe("folder");

    await page.goto(`/folders/${downloads.id}`);

    // minimal: pastikan browse grid muncul (kalau kamu tambahkan testid)
    // kalau belum, kamu bisa expect ada text "Contents" atau breadcrumb
    await expect(page.getByText("Contents")).toBeVisible();
});

test("click search result opens folder and updates URL", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("global-search").fill("report");
    await expect(page.getByTestId("search-item").first()).toBeVisible();

    await page.getByTestId("search-item").first().click();

    await expect(page).toHaveURL(/\/folders\/\d+/);
});
