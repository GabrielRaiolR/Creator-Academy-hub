/** Upload limits for lesson materials. Configure with MAX_UPLOAD_SIZE_MB. */
export const PDF_MIME_TYPE = "application/pdf";

export function maxUploadMegabytes(): number {
  const value = Number(process.env.MAX_UPLOAD_SIZE_MB);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 500) : 20;
}

export function maxUploadBytes(): number {
  return Math.floor(maxUploadMegabytes() * 1024 * 1024);
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Blob pathnames are namespaced per lesson so the server can check ownership. */
export function lessonBlobPrefix(lessonId: string): string {
  return `lessons/${lessonId}/`;
}
