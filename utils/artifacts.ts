import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * Helpers for the artifact suite: read what `src/apimatic.json` DECLARES, read
 * what `apimatic portal generate` actually PRODUCED, and compare the two.
 *
 * Nothing here opens a browser. These are filesystem checks against a
 * generated bundle — one the test generated itself (see scenario.ts), so the
 * suite never needs the portal served.
 */

// ---------------------------------------------------------------------------
// What was declared
// ---------------------------------------------------------------------------

/** A language entry under `languages` in apimatic.json. */
export type DeclaredLanguage = {
  name: string;
  /** publishing.package.version */
  version?: string;
  /** The package identifier, whatever the language calls it. */
  packageName?: string;
  repositoryUrl?: string;
};

export type ApimaticConfig = {
  portal?: {
    site?: { name?: string; description?: string };
    brand?: {
      logo?: { light?: string; dark?: string };
      favicon?: string;
      colors?: { primary?: { light?: string; dark?: string } };
      colorMode?: string;
    };
    navigation?: { links?: Array<{ label: string; url: string }> };
    ai?: { pageActions?: boolean };
  };
  languages?: Record<string, unknown>;
  plugin?: {
    pluginId?: string;
    pluginName?: string;
    pluginVersion?: string;
    license?: string;
  };
};

/**
 * Normalises the per-language publishing block, because each language spells
 * its package identifier differently: npm uses `name`, PyPI `name`, NuGet
 * `packageId`. Tests shouldn't have to know that.
 */
export function declaredLanguages(config: ApimaticConfig): DeclaredLanguage[] {
  const languages = config.languages ?? {};
  return Object.entries(languages).map(([name, raw]) => {
    const publishing = (raw as Record<string, any>)?.publishing ?? {};
    const pkgConfig = publishing.packageConfiguration ?? {};
    return {
      name,
      version: publishing.package?.version,
      packageName: pkgConfig.name ?? pkgConfig.packageId,
      repositoryUrl: publishing.source?.repositoryUrl,
    };
  });
}

// ---------------------------------------------------------------------------
// What was produced
// ---------------------------------------------------------------------------

/**
 * One generated portal: the `src/` it was built from and the `portal/` the CLI
 * wrote next to it. `generateScenario()` in scenario.ts hands you one of these.
 *
 * Read the declared side through `config()`, not the committed build — a
 * scenario edits its copy, and that copy is the contract for its output.
 */
export class GeneratedPortal {
  /** The folder holding `src/` and `portal/`. */
  readonly root: string;
  readonly srcDir: string;
  readonly outDir: string;

  // Plain fields rather than `constructor(readonly root)`: Node runs this file
  // with type stripping, which doesn't support parameter properties.
  constructor(root: string) {
    this.root = root;
    this.srcDir = path.join(root, "src");
    this.outDir = path.join(root, "portal");
  }

  /** The apimatic.json this portal was generated from, scenario changes included. */
  config(): ApimaticConfig {
    return JSON.parse(fs.readFileSync(path.join(this.srcDir, "apimatic.json"), "utf-8"));
  }

  declaredLanguages(): DeclaredLanguage[] {
    return declaredLanguages(this.config());
  }

  /** Absolute path inside the generated portal. */
  path(...segments: string[]): string {
    return path.join(this.outDir, ...segments);
  }

  exists(...segments: string[]): boolean {
    return fs.existsSync(this.path(...segments));
  }

  read(...segments: string[]): string {
    return fs.readFileSync(this.path(...segments), "utf-8");
  }

  /**
   * A text file read for comparison against a baseline, with the formatting
   * noise taken out — see `normalizeText()`.
   */
  readNormalized(...segments: string[]): string {
    return normalizeText(this.read(...segments));
  }

  /** Every file under the generated portal, as POSIX-style relative paths. */
  files(subdir = ""): string[] {
    const root = this.path(subdir);
    if (!fs.existsSync(root)) return [];
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else out.push(path.relative(root, full).split(path.sep).join("/"));
      }
    };
    walk(root);
    return out.sort();
  }

  /** The downloadable SDK archives, keyed by language. */
  sdkArchives(): Record<string, string> {
    const dir = this.path("__downloads", "sdk");
    if (!fs.existsSync(dir)) return {};
    return Object.fromEntries(
      fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".zip"))
        .map((f) => [path.basename(f, ".zip"), path.join(dir, f)]),
    );
  }

  /** Deletes the temp folder. Kept when KEEP_SCENARIOS is set, so you can look inside. */
  cleanup(): void {
    if (process.env.KEEP_SCENARIOS) {
      console.log(`[scenario] kept ${this.root}`);
      return;
    }
    fs.rmSync(this.root, { recursive: true, force: true });
  }
}

/**
 * Takes the formatting noise out of generated text before it's compared.
 *
 * - Line endings: the generator copies the inputs' line endings into its
 *   output, so a build checked out as CRLF (any Windows clone made before
 *   .gitattributes pinned test-builds/ to LF) yields a CRLF file.
 * - Runs of blank lines: generator releases add or drop a blank line around
 *   stripped frontmatter and imports without changing any content.
 *
 * What's left is content, so a diff after this is a real change.
 */
export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Reading inside an archive
// ---------------------------------------------------------------------------

/**
 * Lists the entries of a zip without extracting it.
 *
 * Uses PowerShell's System.IO.Compression rather than adding a zip dependency —
 * the runner is Windows (the visual baselines require it), and this keeps the
 * toolchain to what's already installed.
 */
export function zipEntries(zipPath: string): string[] {
  const script = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $a = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}')
    $a.Entries | ForEach-Object { $_.FullName }
    $a.Dispose()
  `;
  return execFileSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Reads one file out of a zip as text. Returns null when it isn't there. */
export function readZipEntry(zipPath: string, entryName: string): string | null {
  const script = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $a = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}')
    $e = $a.Entries | Where-Object { $_.FullName -eq '${entryName.replace(/'/g, "''")}' } | Select-Object -First 1
    if ($e) { $r = New-Object System.IO.StreamReader($e.Open()); $r.ReadToEnd(); $r.Close() }
    $a.Dispose()
  `;
  const out = execFileSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.trim() ? out : null;
}

/**
 * The package identity an SDK archive actually ships, normalised across the
 * three manifest formats so a test can compare it to what was declared.
 *
 * `version: null` means the manifest carries no version at all, which is a
 * different finding from carrying the wrong one — keep them distinguishable.
 */
export type PackageIdentity = {
  manifest: string;
  packageName: string | null;
  version: string | null;
};

export function packageIdentity(language: string, zipPath: string): PackageIdentity | null {
  const entries = zipEntries(zipPath);

  const npm = entries.find((e) => e === "package.json");
  if (npm) {
    const pkg = JSON.parse(readZipEntry(zipPath, npm) ?? "{}");
    return { manifest: npm, packageName: pkg.name ?? null, version: pkg.version ?? null };
  }

  const pyproject = entries.find((e) => e === "pyproject.toml");
  if (pyproject) {
    const toml = readZipEntry(zipPath, pyproject) ?? "";
    return {
      manifest: pyproject,
      packageName: /^\s*name\s*=\s*"([^"]+)"/m.exec(toml)?.[1] ?? null,
      version: /^\s*version\s*=\s*"([^"]+)"/m.exec(toml)?.[1] ?? null,
    };
  }

  const csproj = entries.find((e) => e.endsWith(".csproj"));
  if (csproj) {
    const xml = readZipEntry(zipPath, csproj) ?? "";
    return {
      manifest: csproj,
      packageName: /<PackageId>([^<]+)<\/PackageId>/.exec(xml)?.[1] ?? null,
      // Deliberately anchored: <LangVersion> and <PackageReference Version="">
      // both contain "Version" and would otherwise match.
      version: /<Version>([^<]+)<\/Version>/.exec(xml)?.[1] ?? null,
    };
  }

  return null;
}
