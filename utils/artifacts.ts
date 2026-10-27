import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

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
  /** What the CLI printed while generating this portal, colour codes stripped. */
  readonly cliOutput: string;

  // Plain fields rather than `constructor(readonly root)`: Node runs this file
  // with type stripping, which doesn't support parameter properties.
  constructor(root: string, cliOutput = "") {
    this.root = root;
    this.srcDir = path.join(root, "src");
    this.outDir = path.join(root, "portal");
    this.cliOutput = cliOutput;
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

/*
 * The zip helpers below use adm-zip, which reads and writes zips in plain
 * JavaScript, so they behave the same on Windows, Linux and macOS.
 */

/** Lists the entries of a zip without extracting it. */
export function zipEntries(zipPath: string): string[] {
  return new AdmZip(zipPath).getEntries().map((entry) => entry.entryName);
}

/**
 * Zips the contents of a directory (not the directory itself, so its files sit
 * at the zip's root: `apimatic.json`, `content/…`, `spec/…`). Overwrites
 * `zipPath` if it exists.
 *
 * Entry names are built with forward slashes on purpose. A name like
 * `content\index.mdx` is what Windows would give us, and a Linux server
 * unzips that as a flat file name, not a folder.
 */
export function zipDirectory(sourceDir: string, zipPath: string): void {
  const zip = new AdmZip();
  const files = fs
    .readdirSync(sourceDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
  for (const file of files) {
    const entryName = path.relative(sourceDir, file).split(path.sep).join("/");
    zip.addFile(entryName, fs.readFileSync(file));
  }
  fs.rmSync(zipPath, { force: true });
  zip.writeZip(zipPath);
}

/** Extracts a zip into `destDir`, replacing whatever was there. */
export function extractZip(zipPath: string, destDir: string): void {
  fs.rmSync(destDir, { recursive: true, force: true });
  new AdmZip(zipPath).extractAllTo(destDir, true);
}

/** Reads one file out of a zip as UTF-8 text. Returns null when it isn't there. */
export function readZipEntry(zipPath: string, entryName: string): string | null {
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntry(entryName);
  return entry ? zip.readAsText(entry, "utf8") : null;
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
