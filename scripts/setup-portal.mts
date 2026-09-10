/**
 * Clones the portal app into `.portal/` so this repo can render portals without
 * anyone configuring a path to it.
 *
 * The V2 portal can't be a normal dependency: `apps/docs` is `"private": true`
 * so it's never published to npm, no container image is published either, and
 * `generate-docs` lives inside the portal repo's source. Rendering a portal
 * therefore needs that source — the most this repo can do is fetch it itself,
 * at a version it pins.
 *
 *   pnpm setup:portal              # clone/update to the pinned ref, then install
 *   pnpm setup:portal --no-install # just the checkout
 *   PORTAL_REF=apimatic-docs pnpm setup:portal   # track a branch instead
 *
 * Already have a checkout? Point PORTAL_REPO at it and the clone, install and
 * package build are all skipped — but the standalone patch still runs, because
 * without it `next start` won't serve. That's the mode the portal repo's own CI
 * uses to test a pull request's code:
 *
 *   PORTAL_REPO=<portal checkout> pnpm setup:portal
 *
 * Note it edits `apps/docs/next.config.ts` in that checkout, so expect a dirty
 * file if you point it at a clone you're working in.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { managedPortalDir, portalSource } from "../utils/env.ts";

dotenv.config({ quiet: true });

const skipInstall = process.argv.includes("--no-install");
const source = portalSource();
const ref = process.env.PORTAL_REF?.trim() || source.ref;

/**
 * Where the portal app lives for this run.
 *
 * With PORTAL_REPO set we're pointed at a checkout somebody else owns — your
 * working clone, or the portal repo's own CI checkout of the pull request. We
 * don't clone or install into that; but the standalone patch still has to be
 * applied, or `next start` won't serve.
 */
const ownClone = process.env.PORTAL_REPO?.trim();
const dir = ownClone ? path.resolve(ownClone) : managedPortalDir();

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      // pnpm is a .cmd shim on Windows, which needs a shell to resolve.
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

/** Non-zero exit is an answer, not a crash — used to probe whether a fetch works. */
function tryRun(cmd: string, args: string[], cwd: string): Promise<boolean> {
  return run(cmd, args, cwd).then(
    () => true,
    () => false,
  );
}

/**
 * The portal repo is private, so CI needs a credential. Supply one as
 * PORTAL_REPO_TOKEN (a PAT or an App installation token with read access) and
 * it's woven into the fetch URL.
 *
 * The URL is passed straight to `git fetch` rather than stored as a remote, so
 * the token never lands in `.portal/.git/config`.
 */
function fetchUrl(): string {
  const token = process.env.PORTAL_REPO_TOKEN?.trim();
  if (!token) return source.repo;
  return source.repo.replace("https://", `https://x-access-token:${token}@`);
}

if (ownClone) {
  console.log(`[setup-portal] PORTAL_REPO is set — using ${dir} as-is, no checkout`);
  if (!existsSync(path.join(dir, "apps", "docs", "package.json"))) {
    throw new Error(
      `PORTAL_REPO="${ownClone}" does not look like the apimatic-dx-portal-v2 repo — ` +
        `expected ${path.join(dir, "apps", "docs", "package.json")}.`,
    );
  }
} else {
  // Log the plain URL — never the authenticated one.
  console.log(`[setup-portal] repo : ${source.repo}`);
  console.log(`[setup-portal] ref  : ${ref}${ref === source.ref ? " (pinned)" : " (override)"}`);
  console.log(
    `[setup-portal] auth : ${process.env.PORTAL_REPO_TOKEN?.trim() ? "PORTAL_REPO_TOKEN" : "none (relying on your git credentials)"}`,
  );
  console.log(`[setup-portal] into : ${dir}`);

  if (!existsSync(path.join(dir, ".git"))) {
    await fs.mkdir(dir, { recursive: true });
    await run("git", ["init", "--quiet"], dir);
  }
}

// A shallow fetch of exactly the ref we want — far quicker than cloning all of
// history (the repo's pack is ~132 MiB). Works for a branch name or a raw SHA,
// but a server can refuse SHA fetches, so fall back to fetching everything.
if (!ownClone) {
  const url = fetchUrl();
  const shallow = await tryRun("git", ["fetch", "--depth", "1", url, ref], dir);
  if (!shallow) {
    console.log("[setup-portal] shallow fetch of that ref failed — fetching full history");
    // Keep the ref in the refspec: a bare `git fetch <url>` points FETCH_HEAD at
    // the remote's HEAD, which is not the ref we asked for.
    await run("git", ["fetch", url, ref], dir);
  }

  await run("git", ["checkout", "--force", "FETCH_HEAD"], dir);
  await run("git", ["rev-parse", "--short", "HEAD"], dir);
}

/**
 * Turns off `output: 'standalone'` in the checked-out portal config.
 *
 * The portal sets it unconditionally so it can ship a Docker image, and two
 * things follow from that which make it unusable for this suite on Windows:
 *
 *  * `next start` refuses to serve a standalone build — it prints "Ready", warns,
 *    and exits, so nothing listens.
 *  * Running the bundle's own server.js instead dies with `EPERM ... stat
 *    node_modules/.pnpm/next@.../node_modules/react`: pnpm fills the bundle's
 *    node_modules with symlinks that Windows can't stat. (The same build also
 *    warns that link names are "too long".) That path only works on Linux, which
 *    is what the portal's Dockerfile targets.
 *
 * Standalone is a packaging choice, not a rendering one — a normal build serves
 * byte-identical pages, which the baselines confirm. `.portal/` is a disposable
 * checkout this repo manages, so patching it here is cheaper than maintaining a
 * second, Linux-only baseline set.
 *
 * Deliberately loud if the line isn't found: silently skipping would send us
 * back to a three-minute CI timeout with no clue why.
 */
async function disableStandaloneOutput(): Promise<void> {
  const configPath = path.join(dir, "apps", "docs", "next.config.ts");
  const original = await fs.readFile(configPath, "utf-8");
  const marker = "output: 'standalone',";

  if (!original.includes(marker)) {
    if (original.includes("dxv2-test-automation")) {
      console.log("[setup-portal] standalone output already disabled");
      return;
    }
    throw new Error(
      `Could not find \`${marker}\` in ${configPath}. The portal's next.config.ts ` +
        `has changed — check whether standalone output still needs disabling, and ` +
        `update disableStandaloneOutput() in scripts/setup-portal.mts.`,
    );
  }

  await fs.writeFile(
    configPath,
    original.replace(
      marker,
      "// output: 'standalone', // disabled by dxv2-test-automation (setup-portal.mts)",
    ),
    "utf-8",
  );
  console.log("[setup-portal] disabled `output: standalone` so next start can serve");
}

await disableStandaloneOutput();

if (ownClone) {
  console.log(
    "[setup-portal] PORTAL_REPO is set — leaving install and package build to whoever owns it",
  );
} else if (skipInstall) {
  console.log("[setup-portal] --no-install: skipping install and package build");
} else {
  // The portal is a pnpm workspace; install from its root, not apps/docs.
  await run("pnpm", ["install", "--frozen-lockfile"], dir);

  // Installing isn't enough: apps/docs imports workspace packages from their
  // `dist/`, which only exists once they're built. Without this, generate-docs
  // dies with ERR_MODULE_NOT_FOUND on @fumadocs/api-docs.
  //
  // `!docs` builds every workspace package except the app itself — we want the
  // packages, not a production `next build` we'd never serve.
  //
  // Turbo's own idiom for this is `--filter=docs^...`, but the `^` doesn't
  // survive: spawning pnpm needs `shell: true` on Windows (Node refuses to spawn
  // a .cmd otherwise), and cmd.exe eats the caret as an escape character, which
  // silently widens the filter to include `docs`. `!docs` has no such problem in
  // cmd or in non-interactive sh.
  console.log("[setup-portal] building the portal's workspace packages");
  await run("pnpm", ["exec", "turbo", "run", "build", "--filter=!docs"], dir);
}

console.log("[setup-portal] ready — run `pnpm test:visual`");
