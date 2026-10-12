import { describe, expect, test } from "vite-plus/test";
import { LANGUAGES } from "../DS1/0-face/languages";
import { languageValidator, languageValidatorFor } from "../DS1/0-face/language-validator";

// What Convex checks a union of literals against: one of its members' values
function accepts(validator: { members: { value: unknown }[] }, value: unknown): boolean {
  return validator.members.some((member) => member.value === value);
}

describe("languageValidator", () => {
  test("is a union of one literal per language in the list", () => {
    expect(languageValidator.kind).toBe("union");
    expect(languageValidator.members.map((member) => member.kind)).toEqual(
      LANGUAGES.map(() => "literal")
    );
    expect(languageValidator.members.map((member) => member.value)).toEqual([...LANGUAGES]);
  });

  test("accepts every language and rejects anything else", () => {
    for (const code of LANGUAGES) {
      expect(accepts(languageValidator, code), code).toBe(true);
    }
    for (const other of ["xx", "pt-br", "EN", "", null]) {
      expect(accepts(languageValidator, other), String(other)).toBe(false);
    }
  });
});

describe("languageValidatorFor", () => {
  test("accepts only the subset", () => {
    const validator = languageValidatorFor(["en", "da", "nb", "pt-BR", "da"]);
    expect(validator.members.map((member) => member.value)).toEqual(["en", "da", "nb", "pt-BR"]);
    expect(accepts(validator, "nb")).toBe(true);
    expect(accepts(validator, "no")).toBe(false);
  });

  test("refuses an empty subset and codes outside the list", () => {
    expect(() => languageValidatorFor([])).toThrow();
    expect(() => languageValidatorFor(["xx" as never])).toThrow(/xx/);
  });
});
