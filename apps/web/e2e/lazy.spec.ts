import { test, expect } from "@playwright/test";

test("lazy mode: expand triggers children request", async ({ page }) => {
  await page.goto("/");

  const thisPcRow = page.getByTestId("tree-row").filter({ hasText: "This PC" }).first();
  await expect(thisPcRow).toBeVisible({ timeout: 15_000 });

  const caret = thisPcRow.locator('[data-testid="tree-caret"]');
  await expect(caret).toBeVisible();

  const reqPromise = page.waitForRequest((req) =>
    req.method() === "GET" &&
    /\/api\/v1\/folders\/\d+\/children$/.test(req.url())
  );

  await caret.click();
  await reqPromise;
});
