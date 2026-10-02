#!/usr/bin/env node
// Release helper: bumps version across all files and optionally commits/tags.
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

type BumpType = "patch" | "minor" | "major" | "prerelease";

function runGit(args: string[], allowFailure = false): void {
  const result = spawnSync("git", args, { stdio: "inherit" });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`git ${args[0]} failed with exit code ${result.status ?? 1}`);
  }
}

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, any>;
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function bumpSemver(version: string, type: BumpType, preid = "alpha"): string {
  // Basic semver bump supporting pre-release. For complex cases prefer semver lib.
  const pre = /-(.*)$/.exec(version)?.[1] ?? null;
  const [major, minor, patch] = version
    .replace(/-.*/, "")
    .split(".")
    .map((n) => parseInt(n, 10));
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    throw new Error(`Invalid version: ${version}`);
  }

  let nextMajor = major,
    nextMinor = minor,
    nextPatch = patch;
  let nextPre: string | null = null;

  if (type === "major") {
    nextMajor += 1;
    nextMinor = 0;
    nextPatch = 0;
  } else if (type === "minor") {
    nextMinor += 1;
    nextPatch = 0;
  } else if (type === "patch") {
    nextPatch += 1;
  } else if (type === "prerelease") {
    // If already pre, increment numeric suffix or append .0
    if (pre && pre.startsWith(preid)) {
      const m = new RegExp(`^${preid}(?:\\.(\\d+))?$`).exec(pre);
      const n = m?.[1] ? parseInt(m[1], 10) + 1 : 0;
      return `${major}.${minor}.${patch}-${preid}.${n}`;
    }
    return `${major}.${minor}.${patch}-${preid}.0`;
  }

  return `${nextMajor}.${nextMinor}.${nextPatch}`;
}

function updateCssVersion(cssPath: string, version: string): boolean {
  if (!fs.existsSync(cssPath)) return false;
  let css = fs.readFileSync(cssPath, "utf8");
  // Replace existing version comment or add one at the top
  if (css.startsWith("/* version ")) {
    css = css.replace(/^\/\* version [^\*]+\*\//, `/* version ${version} */`);
  } else {
    css = `/* version ${version} */\n\n${css}`;
  }
  fs.writeFileSync(cssPath, css, "utf8");
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const type = (args[0] as BumpType) || "patch";
  const preidArg = args.find((a) => a.startsWith("--preid="));
  const preid = preidArg ? preidArg.split("=")[1] : "alpha";
  const noGit = args.includes("--no-git");
  const push = args.includes("--push");

  if (!["patch", "minor", "major", "prerelease"].includes(type)) {
    console.error(
      "Usage: vp run release:patch|release:minor|release:major|release:pre:alpha [--no-git] [--push]"
    );
    process.exit(1);
  }

  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = readJson(pkgPath);
  const current = pkg.version as string;
  const next = bumpSemver(current, type, preid);

  pkg.version = next;
  writeJson(pkgPath, pkg);
  console.log(`✓ Version bumped: ${current} -> ${next}`);

  // Update version in CSS file (DS1/1-root/one.css)
  const cssPath = path.resolve(process.cwd(), "DS1/1-root/one.css");
  if (updateCssVersion(cssPath, next)) {
    console.log(`✓ Updated DS1/1-root/one.css`);
  }

  // Update version in README.md
  const readmePath = path.resolve(process.cwd(), "README.md");
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, "utf8");
    // Update badge version (matches patterns like version-0.1.11-alpha.13-orange)
    readme = readme.replace(
      /version-[\d\.]+(-(?:alpha|beta|rc)\.[\d]+)?-orange/g,
      `version-${next}-orange`
    );
    // Update version text (matches patterns like v0.1.11-alpha.0 or 0.1.11-alpha.13)
    readme = readme.replace(
      /v?[\d\.]+(-(?:alpha|beta|rc)\.[\d]+)/g,
      (match) => {
        // Only replace if it looks like our version pattern (has prerelease tag)
        if (/-(?:alpha|beta|rc)\.\d+/.test(match)) {
          return match.startsWith("v") ? `v${next}` : next;
        }
        return match;
      }
    );
    // Update "Current Status" version header
    readme = readme.replace(
      /## Current Status: v[\d\.]+(-(?:alpha|beta|rc)\.[\d]+)?/g,
      `## Current Status: v${next}`
    );
    // Update "Note: Currently published as alpha version" text
    readme = readme.replace(
      /alpha version `[\d\.]+(-(?:alpha|beta|rc)\.[\d]+)?`/g,
      `alpha version \`${next}\``
    );
    fs.writeFileSync(readmePath, readme, "utf8");
    console.log(`✓ Updated README.md`);
  }

  // Update version in docs/npm-publishing.md
  const docsPath = path.resolve(process.cwd(), "docs/npm-publishing.md");
  if (fs.existsSync(docsPath)) {
    let docs = fs.readFileSync(docsPath, "utf8");
    docs = docs.replace(
      /design-system-1@[\d\.]+(-(?:alpha|beta|rc)\.[\d]+)?/g,
      `design-system-1@${next}`
    );
    fs.writeFileSync(docsPath, docs, "utf8");
    console.log(`✓ Updated docs/npm-publishing.md`);
  }

  console.log(`\n🎉 All files updated to version ${next}`);

  if (!noGit) {
    runGit(["add", "package.json", "README.md", "docs/npm-publishing.md", "DS1/1-root/one.css"]);
    runGit(["commit", "-m", `release: v${next}`], true);
    runGit(["tag", "-a", `v${next}`, "-m", `release: v${next}`], true);
    console.log(`\n✓ Git commit and tag created`);
    if (push) {
      runGit(["push"]);
      runGit(["push", "--tags"]);
      console.log(`✓ Pushed to remote`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
