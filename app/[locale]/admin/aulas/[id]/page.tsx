import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonEditor, type EditorTranslation } from "@/components/lessons/lesson-editor";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { isBlobConfigured, maxUploadMegabytes } from "@/lib/config";
import { emptyRichText, sanitizeRichText } from "@/lib/content/rich-text";
import { localePath, locales, type Locale } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { getLessonForEditor } from "@/lib/queries/lessons";
import { idSchema } from "@/lib/validations";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/aulas/[id]">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.editor.editTitle };
}

export default async function EditLessonPage({ params }: PageProps<"/[locale]/admin/aulas/[id]">) {
  const { segment, locale, t } = await getLocaleContext(params);
  await requireAdmin(segment);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const lesson = await getLessonForEditor(id);
  if (!lesson) notFound();

  const translations = Object.fromEntries(
    locales.map((item) => {
      const row = lesson.translations.find((translation) => translation.locale === item);
      const value: EditorTranslation = {
        title: row?.title ?? "",
        summary: row?.summary ?? "",
        content: sanitizeRichText(row?.content) ?? emptyRichText(),
      };
      return [item, value];
    }),
  ) as Record<Locale, EditorTranslation>;

  const heading = translations[locale].title || translations[locales[0]].title || t.admin.editor.editTitle;

  return (
    <div className="mx-auto max-w-4xl">
      <TextLink href={localePath(segment, "/admin/aulas")} direction="back" className="mb-8">
        {t.admin.lessons.title}
      </TextLink>
      <PageHeader title={heading} description={t.admin.editor.subtitle} />
      <LessonEditor
        lessonId={lesson.id}
        status={lesson.status}
        initial={{
          slug: lesson.slug,
          order: lesson.order,
          youtubeUrl: lesson.youtubeUrl ?? "",
          translations,
        }}
        resources={lesson.resources.map((resource) => ({
          id: resource.id,
          name: resource.name,
          size: resource.size,
          locale: resource.locale as Locale | null,
        }))}
        blobConfigured={isBlobConfigured()}
        maxMegabytes={maxUploadMegabytes()}
      />
    </div>
  );
}
