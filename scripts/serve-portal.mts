/**
 * Builds and serves one portal build out of the apimatic-dx-portal-v2 repo, so
 * Playwright has something to point a browser at.
 *
 * This is the scripted version of what you'd run by hand in apps/docs:
 *
 *   pnpm generate-docs -- --customer-build ./test-specs/customer-build/slack/
 *   pnpm run dev
 *
 * Playwright's `webServer` runs this (see playwright.config.ts). Run it directly
 * if you'd rather keep a portal up across several test runs:
 *
 *   pnpm portal:serve                 # uses PORTAL / PORTAL_PORT from .env
 *   pnpm portal:serve --no-generate   # skip generation, serve what's already there
 *   pnpm portal:generate              # generate only, don't serve
 *
 * The portal repo's own two commands are also mirrored as scripts here, so you
 * can drive everything from this directory and never cd into the portal repo:
 *
 *   pnpm generate-docs -- --customer-build ./test-builds/slack
 *   pnpm dev
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

const skipGenerate = process.argv.includes("--no-generate");
const generateOnly = process.argv.includes("--generate-only");
const cwd = portalDocsDir();
const portal = portalConfig();
// `--customer-build <path>` overrides the registry, matching the flag the portal
// repo's own generate-docs takes.
const buildDir = portalBuildDir(argValue("--customer-build"));
const port = portalPort();

/** Runs a pnpm script in the portal repo and resolves when it exits 0. */
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

console.log(`[serve-portal] portal repo : ${cwd}`);
console.log(`[serve-portal] portal      : ${portalName()} (${portal.label})`);
console.log(`[serve-portal] build dir   : ${buildDir}`);
console.log(`[serve-portal] port        : ${port}`);

if (skipGenerate) {
  console.log("[serve-portal] --no-generate: serving existing generated/ output");
} else {
  // Note: generating overwrites apps/docs/app/theme.css, which is tracked in the
  // portal repo. Expect a dirty working tree there after a run.
  await run(["generate-docs", "--", "--customer-build", buildDir]);
}

if (generateOnly) {
  console.log("[serve-portal] --generate-only: generated, not serving");
} else {
  // Port goes through the environment: pnpm forwards `--` to the script itself,
  // so `pnpm run dev -- --port N` reaches `next dev` as a stray positional and
  // Next reads it as a project directory. `next dev` honours PORT.
  //
  // `next dev` takes over this process so Playwright can kill it on teardown.
  await run(["run", "dev"], { PORT: String(port) });
}
