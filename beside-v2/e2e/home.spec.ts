import { expect, test } from "@playwright/test";
import { signInAsVerifiedMember } from "./helpers";

test.use({ viewport: { width: 375, height: 812 } });

test("the first screen logged out is one photo, the logo, one pill and one button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "beside" })).toBeVisible();
  await expect(page.getByText("Verified people. Public places.")).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Use a different method" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with phone number" }).click();
  await page.waitForURL("**/login");
});

test("the feed is white, one companion per screen, with the next card peeking in from the right", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  const list = page.getByRole("list", { name: "Companions" });
  await expect(list.locator(":scope > li[data-index]")).toHaveCount(5);
  await expect(page.locator("div.bg-\\(--feed-bg\\)")).toHaveCSS("background-color", "rgb(255, 255, 255)");

  // No fee, rate or rating anywhere: not in the text, the labels, or the page source.
  const body = await page.locator("body").innerText();
  const hit = body.match(/₹|per hour|\/hr|\brate\b|\b4\.\d/i);
  expect(hit?.[0] ?? null).toBeNull();
  const labels = await page.evaluate(() => [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")).join(" "));
  expect(labels).not.toMatch(/₹|price|\brate\b|\bfee\b/i);
  const html = await (await page.request.get("/")).text();
  expect(html).not.toMatch(/pricePlaceholder|₹|\b1800\b/);

  // A rounded card, then 24px of the next one at the right edge.
  const first = (await list.locator(":scope > li").nth(0).boundingBox())!;
  const second = (await list.locator(":scope > li").nth(1).boundingBox())!;
  expect(first.x).toBe(16);
  expect(second.x).toBeGreaterThan(375 - 30);
  expect(second.x).toBeLessThan(375 - 18);
  await expect(page.locator("article").first()).toHaveCSS("border-top-left-radius", "28px");
  await expect(page.getByText("That's everyone for now")).toHaveCount(1);
  await expect(list).toHaveCSS("scroll-snap-type", "x mandatory");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("photos scroll up and down inside the card, with vertical marks, then the details come in", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  const photo = (n: number) => page.getByRole("button", { name: `Meera, Communication coach, photo ${n} of 3. Open profile` });
  const scroller = page.locator("[data-card-scroller]").first();
  await expect(photo(1)).toBeVisible();
  // Three marks on the right edge, one solid.
  await expect(page.locator("article").first().locator("[data-photo-marks] span")).toHaveCount(3);
  await expect(page.locator("article").first().locator("[data-photo-marks] span.bg-white")).toHaveCount(1);

  // Nothing moves by itself.
  await page.waitForTimeout(4500);
  await expect(photo(1)).toBeVisible();

  const h = await scroller.evaluate((el) => el.clientHeight);
  await scroller.evaluate((el, top) => el.scrollTo({ top, behavior: "instant" }), h);
  await expect(photo(2)).toBeVisible();
  // The card stays where it is while its photos move.
  expect((await page.locator("article").first().boundingBox())!.x).toBe(16);
  expect(await page.getByRole("list", { name: "Companions" }).evaluate((el) => el.scrollLeft)).toBe(0);

  // After the last photo: voice note, prompt, languages, chips and the main button.
  await page.locator("[data-card-page]").first().evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
  const details = page.getByRole("region", { name: "About Meera" });
  await expect(details.getByRole("button", { name: "Play voice note, 15 seconds" })).toBeVisible();
  await expect(details.getByText("Hear Meera say hello · 0:15")).toBeVisible();
  await expect(details.getByText("Ask me about speaking up in meetings without rehearsing every word.")).toBeVisible();
  await expect(details.getByRole("list", { name: "Languages" }).getByRole("listitem")).toHaveText(["English", "Hindi", "Marathi"]);
  await expect(details.getByText("ID verified")).toBeVisible();
  await expect(details.getByText("Public places only")).toBeVisible();
  await expect(details.getByRole("button", { name: "See full profile" })).toBeVisible();
  await expect(details.getByRole("button", { name: "See full profile" })).toHaveCSS("height", "56px");
  expect(await details.innerText()).not.toMatch(/₹|price|\brate\b/i);
});

test("the photo block and the details block are two separate blocks, and the name never leaves the photo", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  const photo = page.locator("article").first();
  const details = page.getByRole("region", { name: "About Meera" });
  const p = (await photo.boundingBox())!;
  const d = (await details.boundingBox())!;
  // 4:5, capped at 52% of the viewport height, with a 12px gap before the details block.
  expect(p.height).toBeLessThanOrEqual(812 * 0.52 + 1);
  expect(Math.round(d.y - (p.y + p.height))).toBe(12);
  expect(d.width).toBe(p.width);
  await expect(details).toHaveCSS("border-top-width", /^1(\.5)?px$/);
  await expect(details).toHaveCSS("border-top-left-radius", "28px");
  // The name and role sit inside the photo block.
  const name = (await photo.getByText("Meera", { exact: true }).boundingBox())!;
  expect(name.y + name.height).toBeLessThanOrEqual(p.y + p.height);
  const pill = (await details.getByRole("button", { name: "Play voice note, 15 seconds" }).boundingBox())!;
  expect(pill.height).toBe(56);
  expect(pill.y).toBeGreaterThanOrEqual(d.y);

  // Scrolling the page moves past the photo without changing which photo is showing.
  await page.locator("[data-card-page]").first().evaluate((el) => el.scrollTo({ top: 300, behavior: "instant" }));
  await expect(page.getByRole("button", { name: "Meera, Communication coach, photo 1 of 3. Open profile" })).toBeVisible();
});

test("the voice note plays only on tap, and the text can be shown", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  await page.locator("[data-card-page]").first().evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
  const play = page.getByRole("button", { name: "Play voice note, 15 seconds" }).first();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(1200);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await play.click();
  await expect(page.getByRole("button", { name: "Pause voice note" }).first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Pause voice note" }).first().click();
  await expect(play).toHaveAttribute("aria-pressed", "false");

  await page.getByText("Show text").first().click();
  await expect(page.getByText("I coach people who find big rooms", { exact: false })).toBeVisible();
});

test("swiping sideways changes the companion, and the buttons do the same", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  const list = page.getByRole("list", { name: "Companions" });
  await expect(list.locator(":scope > li").nth(0)).toHaveAttribute("aria-current", "true");
  await list.evaluate((el) => el.scrollTo({ left: el.clientWidth, behavior: "instant" }));
  await expect(list.locator(":scope > li").nth(1)).toHaveAttribute("aria-current", "true");

  // The same moves as buttons, for VoiceOver and Switch Control.
  await page.getByRole("button", { name: "Previous companion" }).evaluate((el) => (el as HTMLElement).click());
  await expect(list.locator(":scope > li").nth(0)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Next companion" }).evaluate((el) => (el as HTMLElement).click());
  await expect(list.locator(":scope > li").nth(1)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Next photo" }).nth(1).evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByRole("button", { name: "Tara, Theatre performer, photo 2 of 3. Open profile" })).toBeVisible();
});

test("tapping a photo opens the profile", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Meera, Communication coach, photo 1 of 3. Open profile" }).click();
  await page.waitForURL("**/companions/meera");
});

test("the home button has no label, returns to the first companion, and only sits on the feed", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  const dock = page.getByRole("navigation");
  await expect(dock.getByRole("link")).toHaveCount(1);
  await expect(dock.getByRole("link", { name: "Home" })).toHaveText("");

  const list = page.getByRole("list", { name: "Companions" });
  await list.evaluate((el) => el.scrollTo({ left: el.clientWidth * 2, behavior: "auto" }));
  await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await dock.getByRole("link", { name: "Home" }).click();
  await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBe(0);

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("the fonts and colours come from the design kit, with no faux bold", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/profile");
  const title = page.getByRole("heading", { name: "Your profile" });
  await expect(title).toHaveCSS("font-family", /Zodiak/);
  await expect(page.locator("body")).toHaveCSS("font-family", /Supreme/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const heavy = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => Number(getComputedStyle(el).fontWeight) > 400).length);
  expect(heavy).toBe(0);
});

test("the Live session pill never covers the chat header, even when scrolled", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/chat/s1");
  const pill = page.locator("a.fixed", { hasText: "Live session" });
  await expect(pill).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const pillBox = (await pill.boundingBox())!;
  const headerBox = (await page.locator("header").first().boundingBox())!;
  expect(headerBox.y).toBeGreaterThanOrEqual(pillBox.y + pillBox.height);
});

test("the Live session pill shows on member screens and opens the live session", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/sessions");
  await page.locator("a.fixed", { hasText: "Live session" }).click();
  await page.waitForURL("**/session/s1");
  await expect(page.getByRole("button", { name: /Safety button/ })).toBeVisible();
  await expect(page.getByText("Hold to get help")).toBeVisible();
});

test("the fee appears only on the booking summary, after a time and venue are picked", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/companions/meera");
  await expect(page.getByRole("heading", { level: 1, name: "Meera" })).toBeVisible();
  const profile = await page.locator("body").innerText();
  expect(profile).not.toMatch(/₹|per hour|4\.8|62 sessions/);

  await page.getByRole("button", { name: /Request a session/ }).click();
  await page.waitForURL("**/plan");
  await expect(page.getByText("Session fee")).toHaveCount(0);

  await page.getByRole("group", { name: "Which day?" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "4:00 pm" }).click();
  await page.getByRole("radio").first().check();

  await expect(page.getByText("Session fee")).toBeVisible();
  await expect(page.getByText("₹1,800")).toBeVisible();
  await expect(page.getByText(/per hour|\/hr/)).toHaveCount(0);
  await expect(page.locator('img[src*="/portraits/"]:visible')).toHaveCount(0);
});

test("Sessions, Messages and settings open from the profile icon", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Your profile" }).click();
  await page.waitForURL("**/profile");
  await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible();
  await expect(page.getByLabel("Emergency contact")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Sessions" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Messages" }).click();
  await page.waitForURL("**/chat");
  await page.getByRole("list", { name: "Conversations" }).getByRole("link", { name: /Tara/ }).click();
  await page.waitForURL("**/chat/s2");
});

test("sample dates are correct for today, and the route map is hidden in production", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/sessions");
  const expected = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );
  await expect(page.getByText(expected, { exact: false })).toBeVisible();

  const res = await page.goto("/prototype");
  expect(res?.status()).toBe(404);
});

test("the hello has a transcript on the profile", async ({ page }) => {
  await signInAsVerifiedMember(page);
  await page.goto("/companions/meera");
  await page.getByText("Read what she says").click();
  await expect(page.getByText("I coach people who find big rooms", { exact: false })).toBeVisible();
});
