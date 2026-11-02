import { expect, test } from "@playwright/test";
import { signInAsVerifiedMember } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/session/s1");
});

async function pointerOnSos(page: import("@playwright/test").Page) {
  const box = await page.getByRole("button", { name: /Safety button/ }).boundingBox();
  if (!box) throw new Error("SOS button not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

test("a short tap does not alert the safety team", async ({ page }) => {
  await pointerOnSos(page);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await expect(page.getByText("Safety team notified")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("beside:sos"))).toBeNull();
});

test("a one-second hold alerts the safety team", async ({ page }) => {
  await pointerOnSos(page);
  await page.mouse.down();
  await page.waitForTimeout(1300);
  await expect(page.getByRole("alert").filter({ hasText: "Safety team notified" })).toBeVisible();
  await page.mouse.up();
  const stored = await page.evaluate(() => localStorage.getItem("beside:sos"));
  expect(JSON.parse(stored ?? "{}").sessionId).toBe("s1");
});
