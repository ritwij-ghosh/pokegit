import { toBlob, toPng } from "html-to-image";

const CAPTURE = {
  pixelRatio: 2,
  cacheBust: true,
  /**
   * Skip the holo sheen pseudo-element paint quirks by keeping styles, but
   * filter out anything that is not part of the card face if needed later.
   */
} as const;

export async function captureElementPng(
  element: HTMLElement,
  options: { pixelRatio?: number; width?: number; height?: number } = {},
): Promise<string> {
  await document.fonts.ready;
  return toPng(element, {
    ...CAPTURE,
    pixelRatio: options.pixelRatio ?? CAPTURE.pixelRatio,
    width: options.width,
    height: options.height,
  });
}

export async function captureElementBlob(
  element: HTMLElement,
  options: { pixelRatio?: number } = {},
): Promise<Blob> {
  await document.fonts.ready;
  const blob = await toBlob(element, {
    ...CAPTURE,
    pixelRatio: options.pixelRatio ?? CAPTURE.pixelRatio,
  });
  if (!blob) throw new Error("Failed to capture image");
  return ensurePngBlob(blob);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    downloadDataUrl(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ensurePngBlob(blob: Blob): Blob {
  if (blob.type === "image/png") return blob;
  return new Blob([blob], { type: "image/png" });
}

/**
 * Write a PNG to the clipboard.
 *
 * Safari (esp. iOS) requires `clipboard.write` to run in the same turn as the
 * user gesture. Pass a Promise when the image still needs capturing — do not
 * await the capture before calling this.
 */
export async function copyBlobToClipboard(blobOrPromise: Blob | Promise<Blob>) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard images are not supported in this browser");
  }

  const pngPromise = Promise.resolve(blobOrPromise).then(ensurePngBlob);

  try {
    // Prefer Promise-typed items so write() stays gesture-bound on WebKit.
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngPromise }),
    ]);
    return;
  } catch (promiseStyleError) {
    // Some engines reject Promise values in ClipboardItem; resolve then retry.
    // Chromium is usually still permissive after a short async gap.
    try {
      const blob = await pngPromise;
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch {
      throw promiseStyleError;
    }
  }
}

/** Native share sheet with a PNG file. Returns false if unavailable / failed. */
export async function shareImageFile(
  blob: Blob,
  filename: string,
): Promise<"shared" | "cancelled" | "unavailable"> {
  if (typeof navigator.share !== "function") return "unavailable";

  const file = new File([ensurePngBlob(blob)], filename, { type: "image/png" });
  if (
    typeof navigator.canShare === "function" &&
    !navigator.canShare({ files: [file] })
  ) {
    return "unavailable";
  }

  try {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    return "unavailable";
  }
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand("copy");
  input.remove();
  if (!ok) throw new Error("Failed to copy link");
}

export function sharePageUrl(username: string): string {
  if (typeof window === "undefined") return `/${username}`;
  return `${window.location.origin}/${encodeURIComponent(username)}`;
}
