import type { Page } from "@playwright/test";

/** Seed a verified member session so member-only screens render directly. */
export async function signInAsVerifiedMember(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("beside:session")) return;
    sessionStorage.setItem(
      "beside:session",
      JSON.stringify({
        verified: true,
        phone: "9820012345",
        authMode: "join",
        intent: null,
        steps: { phone: "done", id: "done", selfie: "done", payment: "done" },
        idMethod: "DigiLocker",
        paymentDeferred: false,
        agreed: true,
        savedIds: [],
        planCompanionId: null,
      }),
    );
  });
}

/** Walk the full gate: phone, OTP, the verification rows, and the ground rules. */
export async function completeVerification(page: Page) {
  await page.getByRole("button", { name: /Continue with phone number/ }).click();
  await page.getByLabel("Phone number").fill("9820012345");
  await page.getByRole("button", { name: /Send code/ }).click();
  await page.getByLabel("Digit 1 of 6").click();
  await page.keyboard.type("482913");
  await page.getByRole("button", { name: /Verify and continue/ }).click();

  await page.waitForURL("**/verify");
  const row = (title: string) => page.getByRole("listitem").filter({ hasText: title });
  await row("Government ID").getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "DigiLocker" }).click();
  await row("Government ID").getByText("Done").waitFor();
  await row("Selfie check").getByRole("button", { name: "Start" }).click();
  // The prototype fails the first selfie attempt on purpose.
  await row("Selfie check").getByRole("button", { name: "Try again" }).click();
  await row("Selfie check").getByText("Done").waitFor();
  await page.getByRole("button", { name: /^Continue/ }).click();

  await page.waitForURL("**/rules");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /I agree and continue/ }).click();
}
