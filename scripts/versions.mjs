import fs from "node:fs";
import { execFileSync } from "node:child_process";

export function syncVersions(write = false) {
  const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  if (!/^\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$/.test(version)) {
    throw new Error(`Not a release version: ${version}`);
  }
  // scripts/release.mjs passes the version it leaves, so a release version is replaced too.
  const previous = process.env.RELEASE_FROM;
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const references = new RegExp(
    `\\b(?:\\d+\\.\\d+\\.\\d+-(?:alpha|beta|rc)\\.\\d+${previous ? `|${escape(previous)}` : ""})(?![-\\w]|\\.\\d)`,
    "g",
  );
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const changed = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let before = fs.readFileSync(file, "utf8");
    let after = before;
    if (/(^|\/)package(?:-lock)?\.json$/.test(file)) {
      const data = JSON.parse(before);
      data.version = version;
      if (data.packages?.[""]) data.packages[""].version = version;
      after = JSON.stringify(data, null, 2) + "\n";
    } else if (!file.endsWith(".lock") && /\.(md|css|html|astro|mdx)$/.test(file)) {
      after = before.replace(references, version);
    }
    if (before !== after) {
      changed.push(file);
      if (write) fs.writeFileSync(file, after);
    }
  }
  if (!write && changed.length) throw new Error(`Version mismatches: ${changed.join(", ")}`);
  console.log(`${write ? "Aligned" : "Verified"} release references: ${version}`);
  return changed;
}

if (process.argv[1]?.endsWith("versions.mjs")) syncVersions(process.argv.includes("--write"));
