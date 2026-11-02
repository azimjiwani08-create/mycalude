import { expect, test } from "@playwright/test";
import { signInAsVerifiedMember } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/chat/s1");
});

for (const text of ["call me on 98200 12345", "mail me at a@b.com", "see insta.com/arjun"]) {
  test(`blocks sending "${text}"`, async ({ page }) => {
    await page.getByLabel("Message", { exact: true }).fill(text);
    await expect(page.getByText("Numbers and links can't be shared here.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
  });
}

test("allows a normal message", async ({ page }) => {
  await page.getByLabel("Message", { exact: true }).fill("Looking forward to it.");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});
