#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { findConflicts } from "./isolation.mjs";

const linearMcpUrl = "https://mcp.linear.app/mcp";
const failures = [];

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    failures.push(`${command} ${args.join(" ")}: ${error.stderr?.trim() || error.message}`);
    return "";
  }
}

const status = run("git", ["status", "--porcelain"]);
if (status) failures.push(`working tree is dirty:\n${status}`);

const repository = run("gh", ["repo", "view", "--json", "nameWithOwner,defaultBranchRef,url"]);
run("gh", ["auth", "status"]);

let config = null;
if (!existsSync(".linear-loop.json")) {
  failures.push(".linear-loop.json is not configured");
} else {
  config = JSON.parse(readFileSync(".linear-loop.json", "utf8"));
  if (!config.linearTeamKey || config.linearTeamKey === "REPLACE_ME") {
    failures.push("linearTeamKey is not configured");
  }
  if (!config.githubRepository || config.githubRepository === "owner/repository") {
    failures.push("githubRepository is not configured");
  }
}

failures.push(...findConflicts(config, repository ? JSON.parse(repository).nameWithOwner : null));

let linearConfigured = false;
if (!existsSync(".mcp.json")) {
  failures.push(".mcp.json is missing");
} else {
  try {
    linearConfigured = JSON.parse(readFileSync(".mcp.json", "utf8")).mcpServers?.linear?.url === linearMcpUrl;
  } catch {
    failures.push(".mcp.json is not valid JSON");
  }
}
if (existsSync(".mcp.json") && !linearConfigured) {
  failures.push(`.mcp.json must declare the linear server at ${linearMcpUrl}`);
}

if (process.argv.includes("--reviewer") || process.argv.includes("--builder")) {
  const requiredLabels = ["loop-approved", "loop-changes-requested", "needs-human-review"];
  if (repository) {
    let existing = [];
    try {
      existing = JSON.parse(run("gh", ["label", "list", "--limit", "200", "--json", "name"]) || "[]").map(
        (label) => label.name,
      );
    } catch {
      failures.push("could not parse GitHub labels");
    }
    const missing = requiredLabels.filter((label) => !existing.includes(label));
    if (missing.length) failures.push(`missing GitHub labels: ${missing.join(", ")}`);
  }
}

if (failures.length) {
  process.stderr.write(`Finn Loop preflight failed:\n- ${failures.join("\n- ")}\n`);
  process.exit(1);
}

process.stdout.write(`Finn Loop preflight ready.\nLinear team: ${config.linearTeamKey}\n${repository}\n`);
