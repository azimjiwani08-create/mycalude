import { expect, test } from "@playwright/test";
import { signInAsVerifiedMember } from "./helpers";

const splash = (page: import("@playwright/test").Page) => page.locator("[data-splash]");

test("opening the app shows the brand for about a second, then the first screen", async ({ page }) => {
  await page.goto("/");
  await expect(splash(page)).toBeVisible();
  await page.waitForTimeout(600);
  await expect(splash(page)).toBeVisible();
  await expect(splash(page)).toHaveCount(0, { timeout: 2500 });
  await expect(page.getByRole("heading", { level: 1, name: "beside" })).toBeVisible();
});

test("a live session never waits behind the splash", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/session/s1");
  await expect(splash(page)).toHaveCount(0, { timeout: 500 });
});
