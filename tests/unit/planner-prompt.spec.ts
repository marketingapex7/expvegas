import { expect, test } from "vitest";
import {
  addDays,
  arrivalDateError,
  departureDateError,
  mixedSelectionText,
  sentenceFor,
  travelDateBlocker,
  travelDateEditMessage,
  travelDatesValue,
  tripLengthInDays,
  upsertPromptSentence,
} from "@/lib/planner-prompt";

test("a chip replaces its own prompt sentence rather than appending a duplicate", () => {
  const first = upsertPromptSentence("", "Group", "Group: couple.");
  expect(first).toBe("Group: couple.");

  // Choosing again in the same group rewrites that sentence in place.
  const second = upsertPromptSentence(first, "Group", "Group: friends trip.");
  expect(second).toBe("Group: friends trip.");
  expect(second).not.toContain("couple");

  // A different group appends instead.
  const withVibe = upsertPromptSentence(second, "Vibe", "Vibe: big Vegas spectacle.");
  expect(withVibe).toBe("Group: friends trip. Vibe: big Vegas spectacle.");
});

test("a chip edit preserves what the visitor typed around it", () => {
  const typed = "We want one great night. Group: couple. Keep it walkable.";
  expect(upsertPromptSentence(typed, "Group", "Group: bachelor party.")).toBe(
    "We want one great night. Group: bachelor party. Keep it walkable.",
  );
});

test("clearing a group's selections leaves the prompt untouched", () => {
  // An empty sentence must not append a stray fragment.
  expect(upsertPromptSentence("Vibe: easy laughs.", "Group", "")).toBe("Vibe: easy laughs.");
});

test("group sentences read naturally per group", () => {
  expect(sentenceFor("Ticket budget", "Under $100 per person")).toBe("Ticket budget: Under $100 per person.");
  expect(sentenceFor("Group", "couple")).toBe("Group: couple.");
  expect(sentenceFor("Lodging", "near Bellagio")).toBe("Lodging: near near Bellagio.");
  expect(sentenceFor("Lodging", "haven't booked lodging yet")).toBe("Lodging: not booked yet.");
  expect(sentenceFor("Vibe", "sports energy")).toBe("Vibe: sports energy.");
});

test("a single abstaining gambling choice stays a plain instruction", () => {
  // These two feed lib/planner-preferences, which reads "no gambling" and
  // "atmosphere" as stances. Wrapping them in "Mix ..." would break that.
  expect(mixedSelectionText("gambling", ["No gambling"])).toBe("No gambling");
  expect(mixedSelectionText("gambling", ["Casino atmosphere only"])).toBe(
    "Casino atmosphere only, with no gambling bankroll",
  );
});

test("multiple selections become one mixed instruction", () => {
  expect(mixedSelectionText("ticket", ["Under $100 per person", "$200-$350 per person"])).toBe(
    "Mix ticket options across Under $100 per person and $200-$350 per person; include choices from each selection when available",
  );
  expect(mixedSelectionText("meal", ["Under $30 per person"])).toBe(
    "Mix meals across Under $30 per person; include choices from each selection when available",
  );
  expect(mixedSelectionText("ticket", [])).toBeUndefined();
});

test("travel dates render as a range or a single day", () => {
  expect(travelDatesValue("2026-09-04", "2026-09-07")).toBe("2026-09-04 to 2026-09-07");
  expect(travelDatesValue("2026-09-04", "")).toBe("2026-09-04");
  expect(travelDatesValue("", "")).toBe("");
});

test("trip length counts whole days between arrival and departure", () => {
  expect(tripLengthInDays("2026-09-04", "2026-09-07")).toBe(3);
  expect(tripLengthInDays("2026-09-04", "2026-09-04")).toBe(0);
  expect(tripLengthInDays("", "2026-09-07")).toBe(0);
  expect(addDays("2026-09-04", 7)).toBe("2026-09-11");
  expect(addDays("", 7)).toBeUndefined();
});

test("date fields report their own problems", () => {
  const today = "2026-09-01";
  expect(arrivalDateError("", today)).toMatch(/Choose your arrival date/);
  expect(arrivalDateError("2026-08-30", today)).toMatch(/today or later/);
  expect(arrivalDateError("2026-09-04", today)).toBe("");

  expect(departureDateError("2026-09-04", "")).toMatch(/Choose your departure date/);
  expect(departureDateError("2026-09-04", "2026-09-02")).toMatch(/on or after arrival/);
  // The planner and the API both cap a trip at seven days.
  expect(departureDateError("2026-09-04", "2026-09-12")).toMatch(/within 7 planning days/);
  expect(departureDateError("2026-09-04", "2026-09-07")).toBe("");
});

test("a build is blocked only by dates that cannot produce a plan", () => {
  const today = "2026-09-01";
  expect(travelDateBlocker("2026-09-04", "2026-09-07", today)).toBe("");
  expect(travelDateBlocker("2026-08-30", "2026-09-02", today)).toMatch(/from today forward/);
  expect(travelDateBlocker("2026-09-04", "2026-09-02", today)).toMatch(/on or after your arrival/);
  expect(travelDateBlocker("2026-09-04", "2026-09-14", today)).toMatch(/7 planning days or fewer/);
  expect(travelDateBlocker("", "", today)).toMatch(/Choose arrival and departure dates/);
});

test("the inline date message stays quiet until a field is genuinely wrong", () => {
  const today = "2026-09-01";
  // A half-filled range is normal mid-edit and must not shout at the visitor.
  expect(travelDateEditMessage("2026-09-04", "", today)).toBe("");
  expect(travelDateEditMessage("", "", today)).toBe("");
  expect(travelDateEditMessage("2026-09-04", "2026-09-07", today)).toBe("");

  expect(travelDateEditMessage("2026-09-04", "2026-09-02", today)).toMatch(/on or after your arrival/);
  expect(travelDateEditMessage("2026-09-04", "2026-09-14", today)).toMatch(/7 planning days or fewer/);
  expect(travelDateEditMessage("2026-08-28", "2026-08-30", today)).toMatch(/from today forward/);
});
