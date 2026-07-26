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
  return blob;
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

export async function copyBlobToClipboard(blob: Blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard images are not supported in this browser");
  }

  // Safari wants a Promise-typed ClipboardItem value.
  const item = new ClipboardItem({
    [blob.type || "image/png"]: Promise.resolve(blob),
  });
  await navigator.clipboard.write([item]);
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
