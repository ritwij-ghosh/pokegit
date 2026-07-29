/**
 * Regression: mobile "Copy image" must call clipboard.write with a Promise
 * ClipboardItem *before* the capture resolves (Safari user-gesture rule).
 *
 *   node scripts/test-mobile-copy.mjs
 */

import { chromium, webkit } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PATH = process.env.TEST_PATH ?? "/torvalds";

/**
 * @param {string} name
 * @param {import('playwright').BrowserType} browserType
 */
async function runWithBrowser(name, browserType) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    /** @type {{ writeCalls: number, sawPromiseValue: boolean, writeBeforeBlobResolved: boolean }} */
    const state = {
      writeCalls: 0,
      sawPromiseValue: false,
      writeBeforeBlobResolved: false,
    };
    // @ts-expect-error test probe
    window.__copyProbe = state;

    window.ClipboardItem = class {
      /**
       * @param {Record<string, Blob | Promise<Blob>>} items
       */
      constructor(items) {
        this._items = items;
        this.types = Object.keys(items);
        for (const value of Object.values(items)) {
          if (value && typeof value.then === "function") {
            state.sawPromiseValue = true;
          }
        }
      }
      /**
       * @param {string} type
       */
      getType(type) {
        return Promise.resolve(this._items[type]).then((value) =>
          value instanceof Blob ? value : new Blob([value], { type }),
        );
      }
    };

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async (items) => {
          state.writeCalls += 1;
          let blobResolved = false;
          await Promise.all(
            items.map(async (item) => {
              const pending = item.getType(item.types[0]);
              const raced = await Promise.race([
                pending.then((blob) => {
                  blobResolved = true;
                  return { blob, early: false };
                }),
                Promise.resolve({ blob: null, early: true }),
              ]);
              if (raced.early && !blobResolved) {
                state.writeBeforeBlobResolved = true;
              }
              await pending;
            }),
          );
        },
        writeText: async () => {},
      },
    });
  });

  await page.goto(`${BASE}${PATH}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const shareBtn = page.getByRole("button", { name: /share card/i }).first();
  await shareBtn.click();
  await page.getByRole("menuitem", { name: /copy image/i }).click();

  const status = page.getByRole("status");
  await status.waitFor({ state: "visible", timeout: 25000 });
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[role="status"]');
      const text = el?.textContent?.trim() ?? "";
      return text !== "" && text !== "Working...";
    },
    { timeout: 25000 },
  );
  const statusText = (await status.textContent())?.trim() ?? "";

  const probeState = await page.evaluate(() => window.__copyProbe);
  await browser.close();

  const okStatuses = new Set([
    "Copied to clipboard",
    "Ready to share",
    "Saved",
  ]);

  if (!okStatuses.has(statusText)) {
    throw new Error(
      `[${name}] expected success status, got ${JSON.stringify(statusText)} probe=${JSON.stringify(probeState)}`,
    );
  }

  if (!probeState?.sawPromiseValue) {
    throw new Error(
      `[${name}] ClipboardItem was not given a Promise (Safari gesture pattern broken)`,
    );
  }

  if ((probeState?.writeCalls ?? 0) < 1) {
    throw new Error(`[${name}] clipboard.write was never called`);
  }

  if (!probeState.writeBeforeBlobResolved) {
    throw new Error(
      `[${name}] clipboard.write ran only after the image Promise resolved (gesture will expire on iOS)`,
    );
  }

  console.log(`✓ ${name}: "${statusText}"`, probeState);
}

/** @type {[string, import('playwright').BrowserType][]} */
const engines = [["chromium-mobile", chromium]];

// Prefer WebKit when its browser binary is installed (closest to iOS Safari).
try {
  engines.unshift(["webkit-mobile", webkit]);
} catch {
  // optional
}

let failed = 0;
for (const [name, type] of engines) {
  try {
    await runWithBrowser(name, type);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Executable doesn't exist")) {
      console.warn(`↷ ${name}: browser binary not installed, skipping`);
      continue;
    }
    failed += 1;
    console.error(`✗ ${name}:`, message);
  }
}

if (failed) process.exit(1);
console.log("mobile copy regression passed");
