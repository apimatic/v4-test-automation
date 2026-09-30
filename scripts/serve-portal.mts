/**
 * Generates a portal with the APIMatic CLI and serves the static output, so
 * Playwright has something to point a browser at.
 *
 * Two stages, the same two commands you'd run by hand:
 *
 *   1. apimatic portal generate --input test-builds/<name>   -> <build>/portal
 *   2. http-server -c-1 --cors                               (inside portal/)
 *
 * `-c-1` disables caching, so a regenerated portal is served immediately rather
 * than from a stale cache — which would otherwise show up as a snapshot that
 * mysteriously refuses to change.
 *
 * Playwright's `webServer` runs this with no arguments (see playwright.config.ts).
 * Run it directly to keep a portal up across several test runs:
 *
 *   pnpm portal:serve                  # generate, then serve
 *   pnpm portal:serve --no-generate    # serve what's already generated
 *   pnpm portal:generate               # generate only, don't serve
 */

import { spawn } from "node:child_process";
import process from "node:process";
import dotenv from "dotenv";
import {
  buildDir,
  generatedDir,
  portalConfig,
  portalName,
  portalPort,
  requireGeneratedDir,
} from "../utils/env.ts";

dotenv.config({ quiet: true });

const has = (flag: string) => process.argv.includes(flag);

const skipGenerate = has("--no-generate");
const generateOnly = has("--generate-only");

const portal = portalConfig();
const input = buildDir();
const output = generatedDir();
const port = portalPort();

/**
 * Runs a command and resolves when it exits 0.
 *
 * `shell: true` on Windows because both `apimatic` and `http-server` are .cmd
 * shims, and Node refuses to spawn a .cmd without a shell.
 */
function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

console.log(`[serve-portal] portal    : ${portalName()} (${portal.label})`);
console.log(`[serve-portal] build in  : ${input}`);
console.log(`[serve-portal] output    : ${output}`);
console.log(`[serve-portal] port      : ${port}`);

// ---- 1. generate
if (skipGenerate) {
  console.log("[serve-portal] --no-generate: serving the existing portal/ output");
} else {
  // --force so a regenerate doesn't stop to ask about overwriting, which would
  // hang CI. The destination defaults to <input>/portal, which is what
  // generatedDir() resolves to — keep the two in step.
  await run("apimatic", ["portal", "generate", "--input", input, "--force"]);
}

if (generateOnly) {
  console.log("[serve-portal] --generate-only: stopping after generate");
  process.exit(0);
}

// ---- 2. serve
// Fails with a clear message if generation was skipped and there's nothing there.
const root = requireGeneratedDir();

// `-a 127.0.0.1` to match the baseURL: binding all interfaces isn't needed, and
// pinning IPv4 avoids the localhost/::1 mismatch that reads as connection refused.
await run("http-server", [root, "-p", String(port), "-a", "127.0.0.1", "-c-1", "--cors", "--silent"]);
