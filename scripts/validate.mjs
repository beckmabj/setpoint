import { existsSync, readFileSync } from "node:fs";

const skills = ["finn-spec", "finn-build", "finn-review"];
for (const skill of skills) {
  const path = `.claude/skills/${skill}/SKILL.md`;
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const text = readFileSync(path, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error(`${path} has invalid frontmatter`);
  const fields = frontmatter[1].split("\n").filter(Boolean);
  if (fields.length !== 2) throw new Error(`${path} frontmatter must contain only name and description`);
  if (!fields.includes(`name: ${skill}`)) throw new Error(`${path} has the wrong name`);
  if (/\bTEAM\b/.test(text)) throw new Error(`${path} contains a hard-coded TEAM placeholder`);
}

for (const file of [
  "scripts/preflight.mjs",
  "scripts/setup.mjs",
  "scripts/github-labels.mjs",
  ".linear-loop.example.json",
  ".mcp.json",
]) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
}

process.stdout.write(`Validated ${skills.length} Claude skills and loop support files.\n`);
