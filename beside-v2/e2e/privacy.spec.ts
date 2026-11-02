import { expect, test, type Page } from "@playwright/test";

/** Collect every portrait request; sharp files end in -sharp.jpg, soft ones in -soft.jpg. */
function trackPhotos(page: Page) {
  const photos: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/portraits/")) photos.push(req.url());
  });
  return photos;
}

test("logged out, the first screen requests no sharp photo", async ({ page }) => {
  const photos = trackPhotos(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Continue with phone number" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(photos.filter((url) => url.includes("-sharp."))).toEqual([]);
});

test("logged out, a profile URL shows the gate and requests no sharp photo", async ({ page }) => {
  const photos = trackPhotos(page);
  await page.goto("/companions/meera");
  await expect(page.getByRole("heading", { name: "Verify to see full profiles." })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(photos.filter((url) => url.includes("-sharp."))).toEqual([]);
});
