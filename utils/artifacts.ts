import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { apimaticConfigPath, requireGeneratedDir } from "./env.ts";

/**
 * Helpers for the artifact suite: read what `src/apimatic.json` DECLARES, read
 * what `apimatic portal generate` actually PRODUCED, and compare the two.
 *
 * Nothing here opens a browser. These are filesystem checks against the
 * generated bundle, which is why they can run before the portal is ever served.
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

export function readApimaticConfig(): ApimaticConfig {
  return JSON.parse(fs.readFileSync(apimaticConfigPath(), "utf-8")) as ApimaticConfig;
}

/**
 * Normalises the per-language publishing block, because each language spells
 * its package identifier differently: npm uses `name`, PyPI `name`, NuGet
 * `packageId`. Tests shouldn't have to know that.
 */
export function declaredLanguages(config = readApimaticConfig()): DeclaredLanguage[] {
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

/** Absolute path inside the generated portal. */
export function generated(...segments: string[]): string {
  return path.join(requireGeneratedDir(), ...segments);
}

export function generatedExists(...segments: string[]): boolean {
  return fs.existsSync(generated(...segments));
}

export function readGenerated(...segments: string[]): string {
  return fs.readFileSync(generated(...segments), "utf-8");
}

/** Every file under the generated portal, as repo-relative POSIX-ish paths. */
export function generatedFiles(subdir = ""): string[] {
  const root = generated(subdir);
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
export function sdkArchives(): Record<string, string> {
  const dir = generated("__downloads", "sdk");
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".zip"))
      .map((f) => [path.basename(f, ".zip"), path.join(dir, f)]),
  );
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
