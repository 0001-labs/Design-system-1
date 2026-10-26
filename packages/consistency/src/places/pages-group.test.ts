import { describe, expect, it } from "vite-plus/test";
import { chosenRow, clip, DESCRIPTION_LIMIT, groupPages, languageName, languagesOf, lengthNote, pageRows, pathIn, pickerImages, shareCard, shareFields, shortTitle, siteFile, splitPath, TITLE_LIMIT, type Language, type PageSummary } from "./pages-group";

// Ported from the sites' own editor's tests (team-cms/tests/app-pages.test.ts, deleted 26 October 2026).
// CPH Raft's languages: Danish at the root, English under /en/, German under /de/.
const languages: Language[] = [
  { code: "da", name: "Dansk", prefix: "" },
  { code: "en", name: "English", prefix: "/en" },
  { code: "de", name: "Deutsch", prefix: "/de" },
];

const page = (path: string, lang: string, title = "", edited = 0, at?: number): PageSummary => ({ path, lang, title, fields: 4, edited, lastEdit: at ? { editor: `${lang}@example.com`, at } : null });

describe("pages across their languages", () => {
  it("takes the language prefix off a path", () => {
    expect(splitPath("/en/blueraft/", languages)).toMatchObject({ language: { code: "en" }, base: "/blueraft/" });
    expect(splitPath("/blueraft/", languages)).toMatchObject({ language: { code: "da" }, base: "/blueraft/" });
    expect(splitPath("/de/", languages)).toMatchObject({ language: { code: "de" }, base: "/" });
    expect(splitPath("/", languages)).toMatchObject({ language: { code: "da" }, base: "/" });
  });

  it("does not take a prefix that only begins a word", () => {
    expect(splitPath("/entry/", languages)).toMatchObject({ language: { code: "da" }, base: "/entry/" });
  });

  it("trusts the manifest's language", () => {
    expect(splitPath("/de/job/", languages, "de").base).toBe("/job/");
  });

  it("writes a page's address in a language", () => {
    expect(pathIn("/blueraft/", languages[1])).toBe("/en/blueraft/");
    expect(pathIn("/", languages[0])).toBe("/");
  });

  it("groups a page's languages into one row, the front page first", () => {
    const groups = groupPages(
      [page("/en/blueraft/", "en", "Blue Raft", 1, 200), page("/job/", "da", "Job"), page("/blueraft/", "da", "Blå Raft", 2, 100), page("/", "da", "Forside"), page("/de/blueraft/", "de", "Blaues Floß")],
      languages,
    );
    expect(groups.map(group => group.base)).toEqual(["/", "/blueraft/", "/job/"]);
    const raft = groups[1];
    expect(raft.pages.map(each => each.language.code)).toEqual(["da", "en", "de"]);
    expect(raft.title).toBe("Blå Raft");
    expect(raft.edited).toBe(3);
    expect(raft.lastEdit).toEqual({ editor: "en@example.com", at: 200 });
  });
});

describe("a page's short title", () => {
  it("shortens a title to its first part", () => {
    expect(shortTitle("Blue Raft | CPH Raft")).toBe("Blue Raft");
    expect(shortTitle("Om os - CPH Raft - København")).toBe("Om os");
    expect(shortTitle("Job")).toBe("Job");
    expect(shortTitle("Ja-tak")).toBe("Ja-tak");
  });

  it("keeps the whole title when nothing comes before the mark", () => {
    expect(shortTitle(" | CPH Raft")).toBe("| CPH Raft");
    expect(shortTitle("- Forside")).toBe("- Forside");
  });
});

describe("the Pages list", () => {
  const groups = groupPages(
    [page("/", "da", "Forside | CPH Raft"), page("/en/", "en", "Home | CPH Raft", 1200, 300), page("/blueraft/", "da", "Blå Raft - CPH Raft", 2, 100), page("/en/blueraft/", "en", "Blue Raft | CPH Raft", 1, 200), page("/job/", "da", "Job")],
    languages,
  );

  it("shows each page in the chosen language, its short title and address", () => {
    const rows = pageRows(groups, languages[1]);
    expect(rows.map(row => [row.name, row.path, row.language.code])).toEqual([
      ["Home", "/en/", "en"],
      ["Blue Raft", "/en/blueraft/", "en"],
      ["Job", "/job/", "da"],
    ]);
    expect(rows[1].title).toBe("Blue Raft | CPH Raft");
  });

  it("counts the words edited across the languages, quietly, and none as nothing", () => {
    const rows = pageRows(groups, languages[0]);
    expect(rows.map(row => row.edited)).toEqual(["1,200", "3", ""]);
    expect(rows[1].lastEdit).toEqual({ editor: "en@example.com", at: 200 });
    expect(rows[2].lastEdit).toBeNull();
  });

  it("chooses the page asked for, else the first", () => {
    const rows = pageRows(groups, languages[0]);
    expect(chosenRow(rows, "/job/")?.base).toBe("/job/");
    expect(chosenRow(rows, null)?.base).toBe("/");
    expect(chosenRow(rows, "/gone/")?.base).toBe("/");
    expect(chosenRow([], null)).toBeNull();
  });
});

describe("search and sharing", () => {
  it("counts a title and a description against what search shows", () => {
    expect(TITLE_LIMIT).toBe(60);
    expect(DESCRIPTION_LIMIT).toBe(155);
    expect(lengthNote("Blue Raft", 60)).toEqual({ count: 9, limit: 60, over: false, words: "9 of 60" });
    expect(lengthNote("  æøå  ", 60).count).toBe(3);
    expect(lengthNote("x".repeat(60), 60).over).toBe(false);
    expect(lengthNote("x".repeat(61), 60)).toMatchObject({ over: true, words: "61 of 60" });
    expect(lengthNote("x".repeat(1200), 155).words).toBe("1,200 of 155");
  });

  it("cuts words at a space, as a share does, with no ellipsis", () => {
    expect(clip("Short", 60)).toBe("Short");
    expect(clip("Rent a raft in Copenhagen with CPH RAFT, and sail", 30)).toBe("Rent a raft in Copenhagen");
    expect(clip("x".repeat(40), 10)).toBe("x".repeat(10));
    expect(Array.from(clip("a ".repeat(100), 60)).length).toBeLessThanOrEqual(60);
  });

  it("finds the title, description and share image among a page's fields", () => {
    const fields = [
      { kind: "text" as const, tag: "h1", label: "h1" },
      { kind: "meta" as const, tag: "title", label: "Title" },
      { kind: "meta" as const, tag: "meta", label: "Description" },
      { kind: "image" as const, tag: "image", label: "Share image" },
    ];
    expect(shareFields(fields)).toEqual({ title: fields[1], description: fields[2], image: fields[3] });
    expect(shareFields([fields[0]])).toEqual({ title: undefined, description: undefined, image: undefined });
  });

  it("writes the share card's words as a link preview shows them", () => {
    expect(shareCard("Blue Raft - Floating glamping", "Rent Blue Raft.", "https://www.cphraft.dk")).toEqual({ host: "cphraft.dk", title: "Blue Raft - Floating glamping", description: "Rent Blue Raft." });
    expect(shareCard("", "", "not a url")).toEqual({ host: "", title: "Untitled", description: "" });
    const long = shareCard("T".repeat(80), "d ".repeat(120), "https://cphraft.0001.dev");
    expect(Array.from(long.title).length).toBeLessThanOrEqual(60);
    expect(long.title).toBe("T".repeat(60));
    expect(Array.from(long.description).length).toBeLessThanOrEqual(155);
  });

  it("lists the site's pictures to choose from once each, paths on the site only, with the one in use", () => {
    expect(pickerImages(["/photos/a.jpg", "/photos/b.jpg", "/photos/a.jpg"])).toEqual(["/photos/a.jpg", "/photos/b.jpg"]);
    expect(pickerImages(["https://evil.example/x.jpg", "//evil.example/x.jpg", "javascript:alert(1)", "photos/c.jpg", 3, null, "/photos/d.jpg"])).toEqual(["/photos/d.jpg"]);
    expect(pickerImages(["/photos/a.jpg"], "/photos/home.jpg")).toEqual(["/photos/a.jpg", "/photos/home.jpg"]);
    expect(pickerImages(["/photos/a.jpg"], "/photos/a.jpg")).toEqual(["/photos/a.jpg"]);
    expect(pickerImages(undefined)).toEqual([]);
  });
});

describe("the site's languages, read from its pages", () => {
  it("puts the front page's language at the root, the others under the prefix their pages share", () => {
    expect(languagesOf([page("/en/", "en"), page("/", "da"), page("/om/", "da"), page("/en/about/", "en"), page("/de/", "de")])).toEqual([
      { code: "da", name: "Dansk", prefix: "" },
      { code: "en", name: "English", prefix: "/en" },
      { code: "de", name: "Deutsch", prefix: "/de" },
    ]);
  });

  it("gives a language whose pages share no first part no prefix", () => {
    expect(languagesOf([page("/", "en"), page("/about/", "en")])).toEqual([{ code: "en", name: "English", prefix: "" }]);
    expect(languagesOf([])).toEqual([]);
  });

  it("names a language in its own words, in sentence case", () => {
    expect(languageName("da")).toBe("Dansk");
    expect(languageName("")).toBe("Every language");
  });

  it("shows a site picture through the owner gateway", () => {
    expect(siteFile("10VNDG", "/photos/a b.jpg")).toBe("/api/consistency/sites/10VNDG/files/photos/a%20b.jpg");
  });
});
