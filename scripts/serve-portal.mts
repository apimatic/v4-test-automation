/**
 * Builds and serves one portal build out of the portal app in `.portal/`, so
 * Playwright has something to point a browser at.
 *
 * Three stages, mirroring the portal's own scripts:
 *
 *   1. generate-docs   the build fixture -> generated/docs/** (.mdx + meta.json)
 *   2. build           next build — prerenders every page
 *   3. start           next start — serves the prerendered output
 *
 * It's a production build on purpose. `next dev` compiles routes on demand, so
 * the first hit on the `/docs/[[...slug]]` SSG route is slow and variable, which
 * is no basis for pixel comparison. `next build` does that work once, up front,
 * and then every page answers in milliseconds.
 * The rendering is identical: switching the suite from dev to production moved
 * zero baselines.
 *
 * Playwright's `webServer` runs this with no arguments (see playwright.config.ts).
 * Run it directly to keep a portal up across several test runs:
 *
 *   pnpm portal:serve      # all three stages
 *   pnpm generate-docs -- --customer-build ./test-builds/petstore
 *   pnpm build             # stage 2 only
 *   pnpm start             # stage 3 only
 *   pnpm dev               # next dev instead, for poking at the portal by hand
 */

import { spawn } from "node:child_process";
import process from "node:process";
import dotenv from "dotenv";
import {
  portalBuildDir,
  portalConfig,
  portalDocsDir,
  portalName,
  portalPort,
} from "../utils/env.ts";

dotenv.config({ quiet: true });

/** Reads `--flag <value>` off the command line. */
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const has = (flag: string) => process.argv.includes(flag);

const devMode = has("--dev");
const skipGenerate = has("--no-generate");
const skipBuild = has("--no-build") || devMode;
const generateOnly = has("--generate-only");
const buildOnly = has("--build-only");

const cwd = portalDocsDir();
const portal = portalConfig();
// `--customer-build <path>` overrides the registry, matching the flag the
// portal's own generate-docs takes.
const buildDir = portalBuildDir(argValue("--customer-build"));
const port = portalPort();

/** Runs a pnpm script in the portal app and resolves when it exits 0. */
function run(args: string[], env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, ...env },
      // pnpm is a .cmd shim on Windows, which needs a shell to resolve.
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`pnpm ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

console.log(`[serve-portal] portal app : ${cwd}`);
console.log(`[serve-portal] portal     : ${portalName()} (${portal.label})`);
console.log(`[serve-portal] build dir  : ${buildDir}`);
console.log(`[serve-portal] port       : ${port}`);
console.log(
  `[serve-portal] mode       : ${devMode ? "next dev" : "next build + next start"}`,
);

// ---- 1. generate
if (skipGenerate) {
  console.log("[serve-portal] --no-generate: using the existing generated/ output");
} else {
  // Note: generating overwrites apps/docs/app/theme.css, which is tracked in the
  // portal repo. Expect a dirty working tree in .portal/ after a run.
  await run(["generate-docs", "--", "--customer-build", buildDir]);
}
if (generateOnly) {
  console.log("[serve-portal] --generate-only: stopping after generate");
  process.exit(0);
}

// ---- 2. build
if (skipBuild) {
  console.log(`[serve-portal] ${devMode ? "--dev" : "--no-build"}: skipping next build`);
} else {
  await run(["run", "build"]);
}
if (buildOnly) {
  console.log("[serve-portal] --build-only: stopping after build");
  process.exit(0);
}

// ---- 3. serve
//
// Binding 0.0.0.0 is not cosmetic. Left alone Next binds `localhost`, which on
// the Windows CI runner resolved to ::1 only: a probe against 127.0.0.1 got
// connection refused while the server sat there reporting "Ready". It passes
// locally regardless because Windows dual-stacks the `::` socket — exactly the
// kind of difference that only shows up in CI.
//
// `pnpm exec next` rather than the portal's `pnpm run start`, because the flag
// has to reach Next directly: `pnpm run start -- -H 0.0.0.0` makes pnpm hand the
// `--` to the script, and Next reads it as a project directory. `start`/`dev` in
// the portal are exactly `next start`/`next dev`, so nothing is lost.
//
// `next start` only works here because setup:portal turns off the portal's
// `output: 'standalone'` — see disableStandaloneOutput() for why.
await run([
  "exec",
  "next",
  devMode ? "dev" : "start",
  "--hostname",
  "0.0.0.0",
  "--port",
  String(port),
]);
