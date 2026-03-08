import { describe, it, expect } from "vitest";
import { generateSkillMd } from "../lib/skills.js";

describe("generateSkillMd", () => {
  it("generates valid SKILL.md content", () => {
    const md = generateSkillMd("web-scraper", "Scrape websites for data");
    expect(md).toContain("name: web-scraper");
    expect(md).toContain("version: 0.1.0");
    expect(md).toContain("description: Scrape websites for data");
    expect(md).toContain("# web-scraper");
    expect(md).toContain("---");
  });
});
