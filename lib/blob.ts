import "server-only";
import { get } from "@vercel/blob";

const PDF_SIGNATURE = "%PDF-";

/** Reads the first bytes of a private blob to confirm it really is a PDF (not just a renamed file). */
export async function hasPdfSignature(pathname: string): Promise<boolean> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return false;

  const reader = result.stream.getReader();
  try {
    const { value } = await reader.read();
    const head = value ? new TextDecoder().decode(value.slice(0, PDF_SIGNATURE.length)) : "";
    return head === PDF_SIGNATURE;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** RFC 6266 Content-Disposition with an ASCII fallback and the UTF-8 name (Bengali file names). */
export function attachmentDisposition(filename: string): string {
  const ascii = filename.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "").trim() || "material.pdf";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
