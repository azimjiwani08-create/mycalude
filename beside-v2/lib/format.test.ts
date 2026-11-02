import { describe, expect, it } from "vitest";
import { containsContact } from "./format";

describe("containsContact (chat guard)", () => {
  it.each([
    ["phone with spaces", "call me on 98200 12345"],
    ["phone with country code and dashes", "+91-98200-12345"],
    ["email", "mail me at a@b.com"],
    ["bare domain link", "see insta.com/arjun"],
    ["www link", "www.example.org"],
    ["https link", "https://example.in/x"],
  ])("blocks %s", (_label, text) => {
    expect(containsContact(text)).toBe(true);
  });

  it.each([
    ["a time", "See you at 4:00 pm"],
    ["a day", "Sat, 2 Nov works"],
    ["a quick reply", "Running 5 minutes late"],
    ["plain text", "Looking forward to it."],
  ])("allows %s", (_label, text) => {
    expect(containsContact(text)).toBe(false);
  });
});
