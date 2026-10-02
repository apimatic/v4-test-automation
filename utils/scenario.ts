import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { test } from "@playwright/test";
import { buildDir, portalName } from "./env.ts";
import { GeneratedPortal, type ApimaticConfig } from "./artifacts.ts";

/**
 * Generates a portal from a modified copy of the build, for the artifact suite.
 *
 *   1. copy test-builds/<name>/src  -> <temp>/src
 *   2. apply the scenario's changes to the copy
 *   3. apimatic portal generate --input <temp>   -> <temp>/portal
 *
 * The vendored build is never touched — every scenario starts from a fresh
 * copy, so one scenario's edits can't leak into the next one, or into the
 * portal the visual suite serves.
 *
 * Each generation is a real CLI run (~35s, ~13 MB), so give a scenario its own
 * `test.describe` with a `beforeAll`, and let every test in it read the same
 * output rather than generating per test.
 */

/** What a scenario changes in its copy of `src/`. All paths are relative to `src/`. */
export type ScenarioChanges = {
  /** Edit apimatic.json. Mutate the object you're given; it's written back for you. */
  config?: (config: ApimaticConfig) => void;
  /** Files to create or overwrite, as `{ "content/guides/new.md": "# New" }`. */
  files?: Record<string, string>;
  /** Files or folders to delete, e.g. `["spec/APIMATIC-META.json"]`. */
  remove?: string[];
};

/**
 * Copies the build, applies `changes`, and generates a portal from the result.
 * Pass no changes to generate the build exactly as committed.
 *
 * Call `portal.cleanup()` in an `afterAll` when you're done with it. Set
 * KEEP_SCENARIOS=1 to keep the temp folders around for a look after the run.
 */
export async function generateScenario(
  name: string,
  changes: ScenarioChanges = {},
): Promise<GeneratedPortal> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `v4-${portalName()}-${slug(name)}-`));
  const src = path.join(root, "src");

  try {
    fs.cpSync(path.join(buildDir(), "src"), src, { recursive: true });
    applyChanges(src, changes);
    await runGenerate(root);
  } catch (error) {
    const saved = saveBuildLog(root, name);
    // The test never gets a portal to clean up, so do it here.
    if (!process.env.KEEP_SCENARIOS) fs.rmSync(root, { recursive: true, force: true });
    if (saved && error instanceof Error) error.message += `\n\nFull build log saved to ${saved}`;
    throw error;
  }
  return new GeneratedPortal(root);
}

function applyChanges(src: string, changes: ScenarioChanges): void {
  // Guards against a typo in a scenario quietly editing nothing (or something
  // outside the copy) — a scenario that changed nothing would still pass.
  const inSrc = (relative: string) => {
    const full = path.resolve(src, relative);
    if (!full.startsWith(src + path.sep)) {
      throw new Error(`Scenario path "${relative}" points outside src/`);
    }
    return full;
  };

  for (const relative of changes.remove ?? []) {
    const full = inSrc(relative);
    if (!fs.existsSync(full)) {
      throw new Error(`Scenario removes "${relative}", but the build has no such file`);
    }
    fs.rmSync(full, { recursive: true });
  }

  for (const [relative, content] of Object.entries(changes.files ?? {})) {
    const full = inSrc(relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  // Config last, so a scenario can both add a file and point apimatic.json at it.
  if (changes.config) {
    const configPath = path.join(src, "apimatic.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as ApimaticConfig;
    changes.config(config);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

/**
 * Runs the CLI with its output captured rather than streamed: its spinner
 * redraws hundreds of times and would bury the test report. On failure the
 * tail of the output goes into the error, which is the part that says why.
 *
 * One command string through a shell, because `apimatic` is a .cmd shim on
 * Windows and Node won't spawn one without a shell — and passing an args array
 * alongside `shell` is deprecated, since the args aren't escaped. The only
 * variable part is our own temp path, quoted.
 */
function runGenerate(input: string): Promise<void> {
  const command = `apimatic portal generate --input "${input}" --force`;
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(
        new Error(
          `${command} exited with code ${code}. Last of its output:\n` +
            tail(output, 30),
        ),
      );
    });
  });
}

/**
 * When a build fails, the CLI writes its full log to
 * `<input>/portal/apimatic-debug/build.log`. That folder is temp and about to
 * be deleted, so copy the log into the project's output folder, where CI
 * uploads it. Returns where it went, or undefined if the CLI wrote no log.
 */
function saveBuildLog(root: string, name: string): string | undefined {
  const log = path.join(root, "portal", "apimatic-debug", "build.log");
  if (!fs.existsSync(log)) return undefined;

  const dest = path.join(test.info().project.outputDir, "build-logs", `${slug(name)}.log`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(log, dest);
  return dest;
}

/** The last `lines` lines of CLI output, with colour codes and spinner frames stripped. */
function tail(output: string, lines: number): string {
  return output
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-lines)
    .join("\n");
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
