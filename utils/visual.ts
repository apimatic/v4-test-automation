import type { Locator, Page } from "@playwright/test";

/**
 * Helpers that make a Next.js docs page hold still long enough to be worth
 * comparing pixel-by-pixel. Without these, snapshots fail on things nobody
 * cares about: a font swapping in, a code block getting highlighted a frame
 * late, a caret blinking.
 */

/** Max diff we tolerate before calling it a regression. Matches the V1 suite. */
export const MAX_DIFF_PIXEL_RATIO = 0.03;

/**
 * Regions that change between runs for reasons unrelated to the portal's looks.
 * Playwright paints a solid box over each one instead of comparing it.
 *
 * Empty for now — the slack portal's chrome renders deterministically. Add a
 * selector here the moment a snapshot starts failing on churn rather than a
 * real change, and say in a comment what churns.
 */
export function dynamicRegions(_page: Page): Locator[] {
  return [];
}

/**
 * Wait for everything that shifts layout after first paint: in-flight requests,
 * web fonts, and React committing the highlighted code blocks.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle").catch(() => {
    // networkidle never arrives if something long-polls; the waits below are
    // the ones that actually decide whether the pixels have settled.
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Two frames — one for React to commit, one for the browser to paint it.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/** Standard options for a page-level snapshot. */
export function snapshotOptions(page: Page, fullPage = false) {
  return {
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    fullPage,
    // Freeze CSS transitions/animations so they can't smear a frame.
    animations: "disabled" as const,
    // Hide the blinking text caret.
    caret: "hide" as const,
    mask: dynamicRegions(page),
  };
}
