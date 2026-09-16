import type { Locator, Page } from "@playwright/test";

/**
 * Helpers that make a Next.js docs page hold still long enough to be worth
 * comparing pixel-by-pixel. Without these, snapshots fail on things nobody
 * cares about: a font swapping in, a code block getting highlighted a frame
 * late, a caret blinking.
 */

/**
 * Max diff we tolerate before calling it a regression. Matches the V1 suite.
 *
 * Know what this does and does not catch. It's a ratio of *differing pixels*,
 * and a pixel only counts as differing once it passes Playwright's per-pixel
 * `threshold` (default 0.2, YIQ colour distance). So two things slip through:
 *
 *  * a subtle recolour anywhere — repainting the whole header #ffffff -> #fff3cd
 *    was measured at zero differing pixels, because no single pixel moved far
 *    enough to count;
 *  * any change confined to under 3% of the image — on a 1920x1080 page that's
 *    ~62k pixels, roughly a third of the header's area.
 *
 * A structural break is caught easily: hiding the sidebar and reddening the
 * header came out at 178,929 pixels (ratio 0.09). If you need to catch brand
 * colour drift, tighten `threshold` on that specific assertion rather than
 * lowering this ratio globally — the ratio is what absorbs font-rasterisation
 * noise, and dropping it makes every test flaky.
 */
export const MAX_DIFF_PIXEL_RATIO = 0.03;

/**
 * Regions that change between runs for reasons unrelated to the portal's looks.
 * Playwright paints a solid box over each one instead of comparing it.
 *
 * Empty for now — the petstore portal's chrome renders deterministically. Add a
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
