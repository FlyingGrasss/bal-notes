import { describe, expect, it } from "vitest";
import { noteInputSchema, quoteInputSchema } from "../lib/validation";
import { safePath, slugify } from "../lib/utils";

describe("URL and slug helpers", () => {
  it("creates Turkish-safe slugs", () => {
    expect(slugify("Türk Dili ve Edebiyatı")).toBe("turk-dili-ve-edebiyati");
  });

  it("accepts only same-origin relative paths", () => {
    expect(safePath("/notlar?id=1")).toBe("/notlar?id=1");
    expect(safePath("//evil.example/path")).toBe("/");
    expect(safePath("https://evil.example")).toBe("/");
  });
});

describe("submission validation", () => {
  const base = { title: "Geometri tekrar notları", description: "", gradeLevel: "TEN" as const };

  it("requires exactly one shared or custom subject", () => {
    expect(noteInputSchema.safeParse({ ...base, subjectId: "subject-1", customSubject: null }).success).toBe(true);
    expect(noteInputSchema.safeParse({ ...base, subjectId: null, customSubject: "Astronomi" }).success).toBe(true);
    expect(noteInputSchema.safeParse({ ...base, subjectId: null, customSubject: null }).success).toBe(false);
    expect(noteInputSchema.safeParse({ ...base, subjectId: "subject-1", customSubject: "Astronomi" }).success).toBe(false);
  });

  it("enforces quote length and teacher attribution", () => {
    expect(quoteInputSchema.safeParse({ teacherName: "Fatih Hoca", quote: "3.3 ezber olur", context: "", gradeLevel: null }).success).toBe(true);
    expect(quoteInputSchema.safeParse({ teacherName: "F", quote: "kısa", context: "", gradeLevel: null }).success).toBe(false);
  });
});
