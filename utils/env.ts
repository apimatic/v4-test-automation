import fs from "node:fs";
import path from "node:path";
import { getPortal, type PortalConfig } from "../config/portals.ts";
import portalSourceJson from "../config/portal-source.json" with { type: "json" };

/**
 * Single place that reads the env vars from `.env`, so the config, the
 * serve script and the tests all agree on what "the portal under test" means.
 */

export const DEFAULT_PORT = 3000;

/** This repo's root. Build fixtures under test-builds/ resolve against it. */
const REPO_ROOT = path.resolve(import.meta.dirname, "..");

export type PortalSource = { repo: string; ref: string; refName?: string };

/** Which portal app we render against — see config/portal-source.json. */
export function portalSource(): PortalSource {
  return portalSourceJson as PortalSource;
}

/**
 * Where `pnpm setup:portal` puts its clone of the portal app. Gitignored, and
 * the default location `portalDocsDir()` looks in.
 */
export function managedPortalDir(): string {
  return path.join(REPO_ROOT, ".portal");
}

export function portalName(): string {
  return process.env.PORTAL?.trim() || "slack";
}

export function portalConfig(): PortalConfig {
  return getPortal(portalName());
}

/**
 * Absolute path to the build we generate the portal from.
 *
 * Absolute, not relative: `generate-docs` runs with its cwd set to the portal
 * repo's apps/docs, so a path relative to this repo would resolve against the
 * wrong root.
 *
 * `explicitPath` comes from `--customer-build <path>` on the command line and
 * wins over the registry, so you can point at a build that isn't registered yet.
 * It's resolved against YOUR cwd, which is what you'd expect when you type it.
 */
export function portalBuildDir(explicitPath?: string): string {
  const dir = explicitPath
    ? path.resolve(explicitPath)
    : path.join(REPO_ROOT, portalConfig().buildDir);
  const buildFile = path.join(dir, "APIMATIC-BUILD.json");
  if (!fs.existsSync(buildFile)) {
    throw new Error(
      explicitPath
        ? `--customer-build "${explicitPath}" is not a portal build — no ${buildFile}.`
        : `Portal build "${portalName()}" is missing — expected ${buildFile}. ` +
          `Builds live in test-builds/; see test-builds/README.md.`,
    );
  }
  return dir;
}

export function portalPort(): number {
  const raw = process.env.PORTAL_PORT?.trim();
  const port = raw ? Number(raw) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORTAL_PORT must be a positive integer, got "${raw}"`);
  }
  return port;
}

/** True when we're pointed at an already-deployed portal instead of a local dev server. */
export function usingExternalPortal(): boolean {
  return Boolean(process.env.PORTAL_BASE_URL?.trim());
}

export function baseURL(): string {
  const external = process.env.PORTAL_BASE_URL?.trim();
  if (external) return external.replace(/\/$/, "");
  // 127.0.0.1, not localhost: the server is started with --hostname 0.0.0.0
  // (IPv4), and `localhost` resolves to ::1 first on Windows CI runners, where
  // that mismatch shows up as a flat connection refused.
  return `http://127.0.0.1:${portalPort()}`;
}

/**
 * Absolute path to the apps/docs workspace inside the portal app — the cwd for
 * both `pnpm generate-docs` and `pnpm run dev`.
 *
 * Defaults to the clone `pnpm setup:portal` manages in `.portal/`, so a fresh
 * checkout of this repo needs no path configuration. `PORTAL_REPO` overrides it
 * when you'd rather drive a clone you're already working in.
 */
export function portalDocsDir(): string {
  const override = process.env.PORTAL_REPO?.trim();
  const root = override ? path.resolve(override) : managedPortalDir();
  const docsDir = path.join(root, "apps", "docs");

  if (!fs.existsSync(path.join(docsDir, "package.json"))) {
    throw new Error(
      override
        ? `PORTAL_REPO="${override}" does not look like the apimatic-dx-portal-v2 repo — ` +
          `expected to find ${path.join(docsDir, "package.json")}.`
        : `The portal app isn't set up yet — expected ${docsDir}.
` +
          `Run \`pnpm setup:portal\` to clone it (pinned in config/portal-source.json), ` +
          `or set PORTAL_REPO in .env to a clone you already have.`,
    );
  }

  // A checkout without node_modules will fail deep inside `next dev` with
  // something unhelpful; say so here instead.
  if (!override && !fs.existsSync(path.join(root, "node_modules"))) {
    throw new Error(
      `The portal app at ${root} has no node_modules — run \`pnpm setup:portal\`.`,
    );
  }

  return docsDir;
}
