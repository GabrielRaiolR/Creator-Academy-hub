import type { Metadata } from "next";
import { LessonEditor } from "@/components/lessons/lesson-editor";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { isBlobConfigured, maxUploadMegabytes } from "@/lib/config";
import { emptyRichText } from "@/lib/content/rich-text";
import { localePath, locales, type Locale } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { getNextLessonOrder } from "@/lib/queries/lessons";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/aulas/nova">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.editor.createTitle };
}

export default async function NewLessonPage({ params }: PageProps<"/[locale]/admin/aulas/nova">) {
  const { segment, t } = await getLocaleContext(params);
  await requireAdmin(segment);
  const order = await getNextLessonOrder();

  const translations = Object.fromEntries(
    locales.map((locale) => [locale, { title: "", summary: "", content: emptyRichText() }]),
  ) as Record<Locale, { title: string; summary: string; content: ReturnType<typeof emptyRichText> }>;

  return (
    <div className="mx-auto max-w-4xl">
      <TextLink href={localePath(segment, "/admin/aulas")} direction="back" className="mb-8">
        {t.admin.lessons.title}
      </TextLink>
      <PageHeader title={t.admin.editor.createTitle} description={t.admin.editor.subtitle} />
      <LessonEditor
        status="DRAFT"
        initial={{ slug: "", order, youtubeUrl: "", translations }}
        resources={[]}
        blobConfigured={isBlobConfigured()}
        maxMegabytes={maxUploadMegabytes()}
      />
    </div>
  );
}
