import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { buildDirOf } from "../../../utils/env.ts";
import { declaredLanguages, normalizeText, type ApimaticConfig } from "../../../utils/artifacts.ts";
import { authKey, generateArtifacts } from "../../../utils/portal-artifacts-api.ts";

/**
 * Stage 1: the code samples codegen-v2 generates through the Portal Artifacts
 * API, for builds made to exercise request-level examples (apimatic-common#1409).
 *
 * Each build has one operation per case, and each operation's description says
 * whether its sample should carry the authored example (values prefixed
 * AUTHORED-) or a generated placeholder. The 3.0 and 3.1 builds cover the
 * cases specific to each OpenAPI version.
 *
 * Per build, one generation (see utils/portal-artifacts-api.ts), then:
 *   - every operation in the spec has a code sample in every declared
 *     language, and no sample exists for an operation the spec doesn't have
 *   - each language's samples match the committed baseline
 *
 * Baselines live in portal-snapshots/artifacts/codegen/code-samples/<build>/<language>.md:
 * one section per operation, sorted, so a diff points at the operation whose
 * sample changed. Create or accept them with `pnpm test:code-samples:update`,
 * and check a changed sample against its operation's description in the spec
 * before committing.
 *
 * Needs APIMATIC_AUTH_KEY (in .env locally). Every run starts a real
 * generation per build on that key's account.
 */

const BUILDS = ["codegen-oas30", "codegen-oas31"];
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

/** code-samples/<language>.json: path -> HTTP method (upper case) -> sample fields. */
type CodeSamples = { paths?: Record<string, Record<string, Record<string, unknown>>> };

test.describe("Codegen — code samples from the Portal Artifacts API @artifacts", () => {
  test.skip(!authKey, "Set APIMATIC_AUTH_KEY to call the Portal Artifacts API");

  for (const build of BUILDS) {
    test.describe(build, () => {
      const src = path.join(buildDirOf(build), "src");
      let config: ApimaticConfig;
      /** Where the downloaded artifacts zip was extracted. */
      let artifactsDir: string;

      test.beforeAll(async ({ playwright }, testInfo) => {
        // Nothing to change, so the committed build is uploaded as is.
        config = JSON.parse(fs.readFileSync(path.join(src, "apimatic.json"), "utf-8"));
        artifactsDir = await generateArtifacts(playwright, testInfo, src);
      });

      test("every operation has a code sample in every language", () => {
        const declared = specOperations(src);
        const problems: string[] = [];

        for (const { name: language } of declaredLanguages(config)) {
          const file = path.join(artifactsDir, "code-samples", `${language}.json`);
          if (!fs.existsSync(file)) {
            problems.push(`${language}: code-samples/${language}.json is missing from the download`);
            continue;
          }
          const produced = sampleOperations(readSamples(file));
          const missing = declared.filter((op) => !produced.includes(op));
          const extra = produced.filter((op) => !declared.includes(op));
          if (missing.length) problems.push(`${language}: no sample for ${missing.join(", ")}`);
          if (extra.length) problems.push(`${language}: sample for an operation not in the spec: ${extra.join(", ")}`);
        }

        expect(problems, `${declared.length} operations in the spec`).toEqual([]);
      });

      // One test per language, so a run reports every language that changed
      // rather than stopping at the first.
      for (const language of ["typescript", "python", "csharp"]) {
        test(`${language} code samples match the baseline`, () => {
          test.skip(
            !declaredLanguages(config).some((l) => l.name === language),
            `${language} isn't declared in apimatic.json`,
          );

          const file = path.join(artifactsDir, "code-samples", `${language}.json`);
          expect(fs.existsSync(file), `code-samples/${language}.json is missing from the download`).toBe(true);

          expect(samplesAsMarkdown(readSamples(file), language)).toMatchSnapshot([
            "code-samples",
            build,
            `${language}.md`,
          ]);
        });
      }
    });
  }
});

/** Every operation the build's specs declare, as "METHOD /path", sorted. */
function specOperations(src: string): string[] {
  const specDir = path.join(src, "spec");
  const operations = fs
    .readdirSync(specDir)
    .filter((f) => /\.(ya?ml|json)$/i.test(f))
    .flatMap((f) => {
      // YAML is a superset of JSON, so one parser covers both.
      const spec = parseYaml(fs.readFileSync(path.join(specDir, f), "utf-8"));
      return Object.entries<Record<string, unknown>>(spec?.paths ?? {}).flatMap(([route, item]) =>
        Object.keys(item ?? {})
          .filter((key) => HTTP_METHODS.includes(key.toLowerCase()))
          .map((method) => `${method.toUpperCase()} ${route}`),
      );
    });
  return operations.sort();
}

function readSamples(file: string): CodeSamples {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

/** Every operation a code-samples file has a sample for, as "METHOD /path", sorted. */
function sampleOperations(samples: CodeSamples): string[] {
  return Object.entries(samples.paths ?? {})
    .flatMap(([route, methods]) => Object.keys(methods).map((method) => `${method.toUpperCase()} ${route}`))
    .sort();
}

/**
 * Turns a code-samples JSON into markdown for the baseline: one section per
 * operation, sorted, each holding its sample as a code block. Fields other
 * than `Example` get their own labelled block, so a field the API adds or
 * drops shows up in the diff.
 */
function samplesAsMarkdown(samples: CodeSamples, language: string): string {
  const sections: string[] = [];
  for (const operation of sampleOperations(samples)) {
    const [method, route] = operation.split(" ");
    const methods = samples.paths![route];
    const fields = methods[method] ?? methods[method.toLowerCase()] ?? {};

    const blocks = Object.entries(fields).map(([field, value]) => {
      const body = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      const label = field === "Example" ? "" : `<!-- field: ${field} -->\n\n`;
      return `${label}${fenced(body, field === "Example" ? language : "")}`;
    });
    sections.push(`## ${operation}\n\n${blocks.join("\n\n")}\n`);
  }
  return normalizeText(sections.join("\n"));
}

/** A fenced code block, with a fence longer than any backtick run inside it. */
function fenced(body: string, language: string): string {
  const longest = Math.max(2, ...(body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return `${fence}${language}\n${body.trimEnd()}\n${fence}`;
}
