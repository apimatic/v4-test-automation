import fs from "node:fs";
import path from "node:path";
import { getPortal, type PortalConfig } from "../config/portals.ts";

/**
 * Single place that reads the env vars, so the config, the scripts and the
 * tests all agree on what "the portal under test" means.
 *
 * The V4 flow is entirely local — there is no portal app to clone or install:
 *
 *   apimatic portal generate     turns test-builds/<name>/src into
 *                                test-builds/<name>/portal (static files)
 *   http-server -c-1 --cors      serves that directory
 *
 * So everything here resolves against this repo. Nothing points outside it.
 */

export const DEFAULT_PORT = 8080;

/** This repo's root. Build fixtures and generated output resolve against it. */
const REPO_ROOT = path.resolve(import.meta.dirname, "..");

export function portalName(): string {
  return process.env.PORTAL?.trim() || "petstore";
}

export function portalConfig(): PortalConfig {
  return getPortal(portalName());
}

/**
 * The build input — the directory holding `src/`, which is what
 * `apimatic portal generate --input` expects.
 */
export function buildDir(): string {
  const dir = path.join(REPO_ROOT, portalConfig().buildDir);
  const config = path.join(dir, "src", "apimatic.json");
  if (!fs.existsSync(config)) {
    throw new Error(
      `Portal build "${portalName()}" is missing or malformed — expected ${config}. ` +
        `Builds live in test-builds/; see test-builds/README.md.`,
    );
  }
  return dir;
}

/**
 * The generated portal — static files, and the thing both the artifact suite
 * and the web server read. `apimatic portal generate` defaults its destination
 * to `<input>/portal`, and we keep that default so the CLI command in the docs
 * is the same one CI runs.
 */
export function generatedDir(): string {
  return path.join(buildDir(), "portal");
}

/** Throws with a usable message when the portal hasn't been generated yet. */
export function requireGeneratedDir(): string {
  const dir = generatedDir();
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    throw new Error(
      `The portal hasn't been generated yet — expected ${path.join(dir, "index.html")}.\n` +
        `Run \`pnpm portal:generate\` first.`,
    );
  }
  return dir;
}

/** The declared configuration: test-builds/<name>/src/apimatic.json. */
export function apimaticConfigPath(): string {
  return path.join(buildDir(), "src", "apimatic.json");
}

export function portalPort(): number {
  const raw = process.env.PORTAL_PORT?.trim();
  const port = raw ? Number(raw) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORTAL_PORT must be a positive integer, got "${raw}"`);
  }
  return port;
}

/** True when we're pointed at an already-hosted portal instead of a local one. */
export function usingExternalPortal(): boolean {
  return Boolean(process.env.PORTAL_BASE_URL?.trim());
}

export function baseURL(): string {
  const external = process.env.PORTAL_BASE_URL?.trim();
  if (external) return external.replace(/\/$/, "");
  // 127.0.0.1 rather than localhost: localhost resolves to ::1 first on Windows
  // CI runners, and that mismatch presents as a flat connection refused.
  return `http://127.0.0.1:${portalPort()}`;
}
