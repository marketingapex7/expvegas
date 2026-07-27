import { expect, test } from "@playwright/test";
import { cleanDisplayText } from "../lib/ticketmaster";

test("display text keeps accents and typographic punctuation", () => {
  // The previous cleaner stripped everything non-ASCII, which turned
  // "Myst\u00e8re" into "Myst re" and broke the residency override that
  // expects the accented name.
  expect(cleanDisplayText("Myst\u00e8re by Cirque du Soleil")).toBe("Myst\u00e8re by Cirque du Soleil");
  expect(cleanDisplayText("C\u00e9line Dion \u2014 Live at Resorts World")).toBe("C\u00e9line Dion \u2014 Live at Resorts World");
  expect(cleanDisplayText("rock\u2019s most legendary bands")).toBe("rock\u2019s most legendary bands");
});

test("display text removes zero-width characters without splitting words", () => {
  expect(cleanDisplayText("PWR\u200bUP")).toBe("PWRUP");
  expect(cleanDisplayText("\ufeffOpening Night")).toBe("Opening Night");
});

test("display text strips control characters and mojibake markers", () => {
  expect(cleanDisplayText("AC/DC\u0007 PWR UP")).toBe("AC/DC PWR UP");
  expect(cleanDisplayText("Vegas \ufffd Show")).toBe("Vegas Show");
  expect(cleanDisplayText("  spaced\n\nout\ttext  ")).toBe("spaced out text");
  expect(cleanDisplayText(undefined)).toBe("");
});
