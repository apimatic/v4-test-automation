import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { buildDirOf, portalName } from "./env.ts";
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

export type ScenarioOptions = {
  /**
   * Which build under test-builds/ to copy. Defaults to the one PORTAL selects;
   * name it when a suite is tied to one build, like the nav.json suite.
   */
  build?: string;
};

/**
 * Copies the build, applies `changes`, and generates a portal from the result.
 * Pass no changes to generate the build exactly as committed. Throws, with
 * the tail of the CLI's output, when the CLI refuses the build.
 *
 * Call `portal.cleanup()` in an `afterAll` when you're done with it. Set
 * KEEP_SCENARIOS=1 to keep the temp folders around for a look after the run.
 */
export async function generateScenario(
  name: string,
  changes: ScenarioChanges = {},
  options: ScenarioOptions = {},
): Promise<GeneratedPortal> {
  const root = copyBuild(name, changes, options);

  try {
    const { command, code, output } = await runGenerate(root);
    if (code !== 0) {
      throw new Error(
        `${command} exited with code ${code}. Last of its output:\n` + tail(output, 30),
      );
    }
    return new GeneratedPortal(root, cleanOutput(output));
  } catch (error) {
    // The test never gets a portal to clean up, so do it here.
    removeRoot(root);
    throw error;
  }
}

/** Makes the temp scenario folder: a copy of the build's `src/`, with `changes` applied. */
function copyBuild(name: string, changes: ScenarioChanges, options: ScenarioOptions): string {
  const build = options.build ?? portalName();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `v4-${build}-${slug(name)}-`));
  const src = path.join(root, "src");
  try {
    fs.cpSync(path.join(buildDirOf(build), "src"), src, { recursive: true });
    applyChanges(src, changes);
  } catch (error) {
    removeRoot(root);
    throw error;
  }
  return root;
}

function removeRoot(root: string): void {
  if (process.env.KEEP_SCENARIOS) {
    console.log(`[scenario] kept ${root}`);
    return;
  }
  fs.rmSync(root, { recursive: true, force: true });
}

/**
 * Applies a scenario's changes to a copy of `src/`. Exported for tests that
 * upload the edited copy to the API instead of generating it with the CLI.
 */
export function applyChanges(src: string, changes: ScenarioChanges): void {
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
function runGenerate(
  input: string,
): Promise<{ command: string; code: number | null; output: string }> {
  const command = `apimatic portal generate --input "${input}" --force`;
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("exit", (code) => resolve({ command, code, output }));
  });
}

/** CLI output with colour codes stripped, each line trimmed, blank lines dropped. */
function cleanOutput(output: string): string {
  return output
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

/** The last `lines` lines of CLI output, with colour codes and spinner frames stripped. */
function tail(output: string, lines: number): string {
  return cleanOutput(output).split("\n").slice(-lines).join("\n");
}

/**
 * The CLI's output is a column of blocks, each opened by a symbol:
 *
 *   ▲  a warning — the build carries on
 *   ■  the build was refused; the reasons follow as `│  • …` lines
 *   ◇ ● └ …  progress and results
 *
 * A `│` line continues whichever block is open. This splits the output into
 * those blocks so a test can ask for the warnings alone.
 */
function cliBlocks(output: string): Array<{ symbol: string; lines: string[] }> {
  const blocks: Array<{ symbol: string; lines: string[] }> = [];
  let open: { symbol: string; lines: string[] } | undefined;
  for (const line of output.split("\n")) {
    if (line.startsWith("│")) {
      const text = line.slice(1).trim();
      if (open && text) open.lines.push(text);
      continue;
    }
    open = { symbol: line[0], lines: [line.slice(1).trim()] };
    blocks.push(open);
  }
  return blocks;
}

/**
 * Each `▲` warning as one string. A warning that lists things continues on
 * `│` lines, which are joined back on with newlines.
 */
export function cliWarnings(output: string): string[] {
  return cliBlocks(output)
    .filter((b) => b.symbol === "▲")
    .map((b) => b.lines.join("\n"));
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
