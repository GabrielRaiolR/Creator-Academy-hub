export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 120;

export function isValidSlug(value: string): boolean {
  return value.length > 0 && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}

/** "Minha Primeira Aula!" → "minha-primeira-aula". Non-Latin scripts produce an empty string. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}
