import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const prettierExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".json5",
  ".jsx",
  ".liquid",
  ".md",
  ".mjs",
  ".scss",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

const addPaths = (paths, output) => {
  for (const path of paths.split("\n")) {
    if (path) output.add(path);
  }
};

const getEventBaseSha = () => {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !existsSync(eventPath)) return null;

  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const sha = event.pull_request?.base?.sha ?? event.before;

  return sha && !/^0+$/.test(sha) ? sha : null;
};

const changedPaths = new Set();
const baseSha = getEventBaseSha();

if (baseSha) {
  addPaths(git("diff", "--name-only", "--diff-filter=ACMR", `${baseSha}...HEAD`), changedPaths);
}

addPaths(git("diff", "--name-only", "--diff-filter=ACMR"), changedPaths);
addPaths(git("diff", "--cached", "--name-only", "--diff-filter=ACMR"), changedPaths);
addPaths(git("ls-files", "--others", "--exclude-standard"), changedPaths);

const formattablePaths = [...changedPaths]
  .filter((path) => {
    const dotIndex = path.lastIndexOf(".");
    return dotIndex >= 0 && prettierExtensions.has(path.slice(dotIndex));
  })
  .sort();

if (formattablePaths.length === 0) {
  console.log("No changed files require Prettier validation.");
  process.exit(0);
}

console.log(`Checking Prettier formatting for ${formattablePaths.length} changed file(s).`);

const result = spawnSync("prettier", ["--check", "--ignore-unknown", "--", ...formattablePaths], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
