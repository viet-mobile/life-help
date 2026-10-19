import { describe, expect, it } from "vitest";
import { isSpeakerLabel } from "../../scripts/learn/english-bank/structure-rules";

describe("structure rules: speaker labels versus titles of a text", () => {
  it("person names and speaker ids are labels", () => {
    for (const l of ["Eva: I play badminton.", "A: Thank you.", "B: ______.", "Ms. Han: What color is it?", "Customer: One coffee, please.", "Mr. Park: Hello."]) expect(isSpeakerLabel(l), l).toBe(true);
  });
  it("titles of a text are NOT labels", () => {
    for (const l of ["Calendar note: Sports Day - October 12th", "Read the sign: \"Please be quiet.\"", "Shopping list: carrots 4, milk 2 bottles.", "Menu: Pizza $8, Salad $5", "School lunch: Monday noodles", "Field trip: Meet at the gate at 8:20.", "A letter ends: \"I look forward\"", "A text says: \"Reading helps\""]) expect(isSpeakerLabel(l), l).toBe(false);
  });
});
