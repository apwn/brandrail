import { access, readFile } from "node:fs/promises";
import path from "node:path";

const packages = ["spec", "sdk", "mcp", "cli"];
const expectedTag = process.env.GITHUB_REF_NAME?.startsWith("v") ? process.env.GITHUB_REF_NAME.slice(1) : null;
const versions = new Set();

for (const directory of packages) {
  const root = path.resolve("packages", directory);
  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  versions.add(manifest.version);
  if (manifest.private) throw new Error(`${manifest.name} is unexpectedly private`);
  for (const field of ["description", "license", "homepage", "bugs", "repository", "engines"]) {
    if (!manifest[field]) throw new Error(`${manifest.name} is missing package metadata: ${field}`);
  }
  await access(path.join(root, "LICENSE"));
  await access(path.join(root, "README.md"));
  if (manifest.main) await access(path.join(root, manifest.main));
  for (const target of Object.values(manifest.bin ?? {})) await access(path.join(root, target));
}

if (versions.size !== 1) throw new Error(`publishable package versions diverge: ${[...versions].join(", ")}`);
const [version] = versions;
if (expectedTag && expectedTag !== version) throw new Error(`release tag v${expectedTag} does not match package version ${version}`);
console.log(`release preflight ready: ${packages.length} packages at ${version}`);
