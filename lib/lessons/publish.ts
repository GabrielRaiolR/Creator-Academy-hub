import { isRichTextEmpty, type RichTextDoc } from "@/lib/content/rich-text";
import { locales, type Locale } from "@/lib/i18n/config";
import { isValidSlug } from "@/lib/slug";

export type PublishIssue =
  | { code: "INVALID_SLUG" }
  | { code: "MISSING_TRANSLATION" | "MISSING_TITLE" | "MISSING_CONTENT"; locale: Locale };

export type PublishCandidate = {
  slug: string;
  translations: Partial<Record<Locale, { title: string; content: RichTextDoc } | undefined>>;
};

/** Every supported locale must have a title and a non-empty body before a lesson goes live. */
export function getPublishIssues(candidate: PublishCandidate): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (!isValidSlug(candidate.slug)) issues.push({ code: "INVALID_SLUG" });

  for (const locale of locales) {
    const translation = candidate.translations[locale];
    const missingTitle = !translation?.title.trim();
    const missingContent = isRichTextEmpty(translation?.content);
    if (missingTitle && missingContent) {
      issues.push({ code: "MISSING_TRANSLATION", locale });
      continue;
    }
    if (missingTitle) issues.push({ code: "MISSING_TITLE", locale });
    if (missingContent) issues.push({ code: "MISSING_CONTENT", locale });
  }
  return issues;
}
