import { isRichTextEmpty, type RichTextDoc } from "@/lib/content/rich-text";
import { locales, type Locale } from "@/lib/i18n/config";
import { isValidSlug } from "@/lib/slug";

export type PublishIssue =
  | { code: "INVALID_SLUG" | "NO_LANGUAGE" }
  | { code: "MISSING_TRANSLATION" | "MISSING_TITLE" | "MISSING_CONTENT"; locale: Locale };

export type PublishCandidate = {
  slug: string;
  translations: Partial<Record<Locale, { title: string; content: RichTextDoc } | undefined>>;
};

/**
 * A lesson can go live in one language. A language left completely empty is skipped.
 * A language that was started must be finished, and at least one language must be complete.
 */
export function getPublishIssues(candidate: PublishCandidate): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (!isValidSlug(candidate.slug)) issues.push({ code: "INVALID_SLUG" });

  let complete = 0;
  for (const locale of locales) {
    const translation = candidate.translations[locale];
    const missingTitle = !translation?.title.trim();
    const missingContent = isRichTextEmpty(translation?.content);
    if (missingTitle && missingContent) continue;
    if (missingTitle) issues.push({ code: "MISSING_TITLE", locale });
    if (missingContent) issues.push({ code: "MISSING_CONTENT", locale });
    if (!missingTitle && !missingContent) complete += 1;
  }
  if (complete === 0) issues.push({ code: "NO_LANGUAGE" });
  return issues;
}
