import { spawn, spawnSync, type ChildProcess } from "node:child_process";

/**
 * Serves a scenario's generated portal for the browser suites.
 *
 * The visual project's web server serves the committed build. A scenario
 * generates its own portal into a temp folder, so it needs a server of its
 * own — the same `http-server` command scripts/serve-portal.mts runs, on a
 * port of its own so the two never collide.
 *
 * Start it in the scenario's `beforeAll`, stop it in `afterAll`. Workers are
 * pinned to 1, so one scenario server runs at a time and the port is reused.
 */

const DEFAULT_SCENARIO_PORT = 8090;

export function scenarioPort(): number {
  const raw = process.env.SCENARIO_PORT?.trim();
  const port = raw ? Number(raw) : DEFAULT_SCENARIO_PORT;
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`SCENARIO_PORT must be a positive integer, got "${raw}"`);
  }
  return port;
}

/** Where a scenario's portal is served. 127.0.0.1 for the same reason as env.ts's baseURL(). */
export function scenarioBaseURL(): string {
  return `http://127.0.0.1:${scenarioPort()}`;
}

export type ServedPortal = { stop: () => Promise<void> };

/** Serves `dir` on the scenario port and resolves once it answers. */
export async function serveDir(dir: string): Promise<ServedPortal> {
  const port = scenarioPort();

  // A leftover server from an aborted run would answer for this one, and the
  // test would quietly screenshot the wrong portal.
  if (await answers(port)) {
    throw new Error(
      `Port ${port} is already serving something. Stop it, or set SCENARIO_PORT to a free port.`,
    );
  }

  // One command string through a shell, as in scenario.ts: http-server is a
  // .cmd shim on Windows. The only variable part is our own temp path, quoted.
  const child = spawn(
    `http-server "${dir}" -p ${port} -a 127.0.0.1 -c-1 --silent`,
    // detached on POSIX makes the shell a process-group leader, so stop() can
    // take http-server down with it.
    { shell: true, stdio: "ignore", detached: process.platform !== "win32" },
  );

  const deadline = Date.now() + 30_000;
  while (!(await answers(port))) {
    if (child.exitCode !== null) {
      throw new Error(`http-server exited with code ${child.exitCode} before serving ${dir}`);
    }
    if (Date.now() > deadline) {
      stop(child);
      throw new Error(`http-server didn't start serving ${dir} on port ${port} within 30s`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return {
    // Waits for the port to go quiet, so the next scenario's leftover-server
    // check doesn't trip over this one still shutting down.
    stop: async () => {
      stop(child);
      const until = Date.now() + 10_000;
      while ((await answers(port)) && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    },
  };
}

async function answers(port: number): Promise<boolean> {
  try {
    await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1_000) });
    return true;
  } catch {
    return false;
  }
}

/**
 * Kills the shell and the http-server it started. Killing only the shell
 * would leave http-server holding the port for the next scenario.
 */
function stop(child: ChildProcess): void {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  }
}
