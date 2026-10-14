import { expect, test } from "@playwright/test";

test("home page exposes its main landmark and skip link", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator('a[href="#main"]')).toBeAttached();
});
