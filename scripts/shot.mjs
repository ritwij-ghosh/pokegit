/**
 * Dev-only screenshot helper for visual iteration on the card and pages.
 *
 *   node scripts/shot.mjs /torvalds out.png [width] [height] [selector]
 */

import { chromium } from "playwright";

const [, , path = "/", out = "shot.png", width = "1280", height = "900", selector] =
  process.argv;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});

await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

if (selector) {
  await page.locator(selector).screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: !process.env.NO_FULL_PAGE });
}

await browser.close();
console.log(`wrote ${out}`);
