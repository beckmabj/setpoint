#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseLabelList } from "./github-labels.mjs";

if (!existsSync(".linear-loop.json")) {
  copyFileSync(".linear-loop.example.json", ".linear-loop.json");
  process.stdout.write("Created .linear-loop.json; replace its placeholders.\n");
}

for (const label of [
  ["loop-approved", "2DA44E", "Finn Loop review passed at the recorded SHA"],
  ["loop-changes-requested", "D73A4A", "Finn Loop found must-fix issues"],
  ["needs-human-review", "FBCA04", "Finn Loop requires a human decision"],
]) {
  const [name, color, description] = label;
  const existing = execFileSync("gh", ["label", "list", "--search", name, "--json", "name"], {
    encoding: "utf8",
  });
  if (!parseLabelList(existing).some((candidate) => candidate.name === name)) {
    execFileSync("gh", ["label", "create", name, "--color", color, "--description", description], {
      stdio: "inherit",
    });
  }
}

process.stdout.write(
  "GitHub labels are ready. Confirm Linear labels agent-ready and blocked exist before starting the loop.\n",
);
