import { expect, test } from "@playwright/test";
import { completeVerification } from "./helpers";

test("a profile link returns to that profile after verification", async ({ page }) => {
  await page.goto("/companions/tara");
  await completeVerification(page);

  await page.waitForURL("**/companions/tara");
  await expect(page.getByRole("heading", { level: 1, name: "Tara" })).toBeVisible();
});

test("the first screen leads to the feed after verification", async ({ page }) => {
  await page.goto("/");
  await completeVerification(page);

  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("list", { name: "Companions" })).toBeVisible();
  await expect(page.getByText(/You're verified/)).toBeVisible();
});
