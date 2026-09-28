"use client";

import { CheckCircle2, Circle, Eye, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Field, FormAlert, Input, Textarea, fieldAria } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import type { LessonStatus } from "@/db/schema/lessons";
import { saveLessonAction } from "@/lib/actions/lessons";
import { isRichTextEmpty, type RichTextDoc } from "@/lib/content/rich-text";
import { localePath, locales, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getPublishIssues, type PublishIssue } from "@/lib/lessons/publish";
import { isValidSlug, slugify } from "@/lib/slug";
import type { LessonIntent } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { parseYouTubeId } from "@/lib/youtube";
import { ResourceManager, type EditorResource } from "./resource-manager";
import { RichTextEditor } from "./rich-text-editor";

export type EditorTranslation = { title: string; summary: string; content: RichTextDoc };

export type LessonEditorValues = {
  slug: string;
  order: number;
  youtubeUrl: string;
  translations: Record<Locale, EditorTranslation>;
};

type LessonEditorProps = {
  lessonId?: string;
  status: LessonStatus;
  initial: LessonEditorValues;
  resources: EditorResource[];
  blobConfigured: boolean;
  maxMegabytes: number;
};

function isTranslationComplete(translation: EditorTranslation) {
  return Boolean(translation.title.trim()) && !isRichTextEmpty(translation.content);
}

/** A draft only needs a valid address. Fill one in so saving can unlock PDF uploads. */
function withDraftSlug(current: LessonEditorValues): LessonEditorValues {
  if (isValidSlug(current.slug.trim())) return current;
  const fromTitle = slugify(current.translations[locales[0]].title);
  const fromSlug = slugify(current.slug);
  const slug = [fromTitle, fromSlug].find((candidate) => isValidSlug(candidate)) ?? `rascunho-${Date.now().toString(36)}`;
  return { ...current, slug };
}

export function LessonEditor({ lessonId, status, initial, resources, blobConfigured, maxMegabytes }: LessonEditorProps) {
  const { segment, t } = useI18n();
  const router = useRouter();
  const { handle, errorFor } = useActionFeedback();
  const [pendingIntent, setPendingIntent] = useState<LessonIntent | null>(null);
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [activeLocale, setActiveLocale] = useState<Locale>(locales[0]);
  const [slugTouched, setSlugTouched] = useState(Boolean(lessonId));
  const [issues, setIssues] = useState<PublishIssue[]>([]);
  const baseId = useId();
  const e = t.admin.editor;

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const videoId = values.youtubeUrl.trim() ? parseYouTubeId(values.youtubeUrl.trim()) : null;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setTranslation = (locale: Locale, patch: Partial<EditorTranslation>) =>
    setValues((current) => {
      const translations = { ...current.translations, [locale]: { ...current.translations[locale], ...patch } };
      const autoSlug = !slugTouched && locale === locales[0] && patch.title !== undefined;
      return { ...current, translations, slug: autoSlug ? slugify(patch.title ?? "") : current.slug };
    });

  const describeIssue = (issue: PublishIssue) =>
    "locale" in issue
      ? format(e.issues[issue.code], { language: t.languages[issue.locale] })
      : e.issues[issue.code];

  const submit = (intent: LessonIntent) => {
    const payload = intent === "save" && status !== "PUBLISHED" ? withDraftSlug(values) : values;
    if (payload.slug !== values.slug) {
      setValues(payload);
      setSlugTouched(true);
    }

    if (intent === "publish") {
      const localIssues = getPublishIssues({ slug: payload.slug, translations: payload.translations });
      setIssues(localIssues);
      if (localIssues.length) {
        const firstLocale = localIssues.find((issue) => issue.code !== "INVALID_SLUG");
        if (firstLocale && "locale" in firstLocale) setActiveLocale(firstLocale.locale);
        return;
      }
    }

    setPendingIntent(intent);
    startTransition(async () => {
      const result = await saveLessonAction({ ...payload, id: lessonId, intent });
      setPendingIntent(null);
      if (!result.ok) setIssues(result.issues ?? []);
      const successKey = intent === "publish" ? "admin.editor.published" : intent === "unpublish" ? "admin.editor.unpublished" : "admin.editor.saved";
      if (!handle(result, successKey)) return;

      setIssues([]);
      setSaved(payload);
      setSlugTouched(true);
      if (!lessonId) {
        router.replace(localePath(segment, `/admin/aulas/${result.data.id}`));
      } else {
        router.refresh();
      }
    });
  };

  const busy = pendingIntent !== null;
  const published = status === "PUBLISHED";

  const actions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {lessonId ? (
        <Link
          href={localePath(segment, `/aulas/${saved.slug}`)}
          className={buttonClasses("ghost", "md")}
          target="_blank"
        >
          <Eye aria-hidden className="size-4" strokeWidth={1.5} />
          {e.preview}
        </Link>
      ) : null}
      {published ? (
        <Button variant="ghost" onClick={() => submit("unpublish")} pending={pendingIntent === "unpublish"} disabled={busy}>
          {e.unpublish}
        </Button>
      ) : null}
      <Button
        variant={published ? "primary" : "secondary"}
        onClick={() => submit("save")}
        pending={pendingIntent === "save"}
        disabled={busy}
      >
        {pendingIntent === "save" ? t.common.saving : published ? e.saveChanges : e.saveDraft}
      </Button>
      {published ? null : (
        <Button variant="primary" onClick={() => submit("publish")} pending={pendingIntent === "publish"} disabled={busy}>
          {pendingIntent === "publish" ? e.publishing : e.publish}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={published ? "success" : "warning"}>{t.admin.lessonStatus[status]}</Badge>
        {dirty ? (
          <span role="status" className="text-xs font-medium text-amber-600">
            {e.unsavedChanges}
          </span>
        ) : null}
      </div>

      {issues.length > 0 ? (
        <FormAlert tone="warning">
          <p className="font-semibold">{e.publishBlockedTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {issues.map((issue) => (
              <li key={`${issue.code}-${"locale" in issue ? issue.locale : ""}`}>{describeIssue(issue)}</li>
            ))}
          </ul>
        </FormAlert>
      ) : null}

      <CardSection title={e.generalTitle} description={e.generalSubtitle}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_10rem]">
          <Field label={e.slug} htmlFor={`${baseId}-slug`} hint={format(e.slugHint, { slug: values.slug || "…" })} error={errorFor("slug")}>
            <Input
              {...fieldAria(`${baseId}-slug`, errorFor("slug"), true)}
              value={values.slug}
              lang="en"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => {
                setSlugTouched(true);
                setValues((current) => ({ ...current, slug: event.target.value.toLowerCase() }));
              }}
              maxLength={120}
            />
          </Field>
          <Field label={e.order} htmlFor={`${baseId}-order`} hint={e.orderHint} error={errorFor("order")}>
            <Input
              {...fieldAria(`${baseId}-order`, errorFor("order"), true)}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={Number.isFinite(values.order) ? values.order : ""}
              onChange={(event) => setValues((current) => ({ ...current, order: event.target.valueAsNumber }))}
            />
          </Field>
        </div>
        <Field
          className="mt-5"
          label={e.youtubeUrl}
          htmlFor={`${baseId}-youtube`}
          optionalLabel={t.common.optional}
          hint={videoId ? e.youtubeDetected : e.youtubeHint}
          error={errorFor("youtubeUrl") ?? (values.youtubeUrl.trim() && !videoId ? t.validation.youtube : undefined)}
        >
          <div className="relative">
            <PlayCircle
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2",
                videoId ? "text-blue-primary" : "text-zinc-400",
              )}
              strokeWidth={1.5}
            />
            <Input
              {...fieldAria(`${baseId}-youtube`, errorFor("youtubeUrl"), true)}
              type="url"
              inputMode="url"
              lang="en"
              className="pl-10"
              placeholder="https://www.youtube.com/watch?v=…"
              value={values.youtubeUrl}
              onChange={(event) => setValues((current) => ({ ...current, youtubeUrl: event.target.value }))}
            />
          </div>
        </Field>
      </CardSection>

      <CardSection title={e.contentTitle} description={e.contentSubtitle}>
        <div role="tablist" aria-label={e.contentTitle} className="mb-6 flex gap-1 rounded-full bg-zinc-100 p-1 sm:inline-flex">
          {locales.map((locale) => {
            const complete = isTranslationComplete(values.translations[locale]);
            const selected = locale === activeLocale;
            return (
              <button
                key={locale}
                type="button"
                role="tab"
                id={`${baseId}-tab-${locale}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${locale}`}
                onClick={() => setActiveLocale(locale)}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors sm:flex-none",
                  selected ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
                )}
              >
                <span lang={locale}>{t.languages[locale]}</span>
                {complete ? (
                  <CheckCircle2 aria-label={e.complete} className="size-4 text-emerald-500" strokeWidth={2} />
                ) : (
                  <Circle aria-label={e.incomplete} className="size-4 text-zinc-300" strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>

        {locales.map((locale) => {
          const translation = values.translations[locale];
          const id = `${baseId}-${locale}`;
          const titleError = errorFor(`translations.${locale}.title`);
          const summaryError = errorFor(`translations.${locale}.summary`);
          const contentError = errorFor(`translations.${locale}.content`);
          return (
            <div
              key={locale}
              role="tabpanel"
              id={`${baseId}-panel-${locale}`}
              aria-labelledby={`${baseId}-tab-${locale}`}
              hidden={locale !== activeLocale}
              className="flex flex-col gap-5"
            >
              <Field label={e.titleLabel} htmlFor={`${id}-title`} error={titleError}>
                <Input
                  {...fieldAria(`${id}-title`, titleError)}
                  lang={locale}
                  value={translation.title}
                  onChange={(event) => setTranslation(locale, { title: event.target.value })}
                  maxLength={200}
                />
              </Field>
              <Field
                label={e.summaryLabel}
                htmlFor={`${id}-summary`}
                optionalLabel={t.common.optional}
                hint={e.summaryHint}
                error={summaryError}
              >
                <Textarea
                  {...fieldAria(`${id}-summary`, summaryError, true)}
                  lang={locale}
                  rows={2}
                  value={translation.summary}
                  onChange={(event) => setTranslation(locale, { summary: event.target.value })}
                  maxLength={600}
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <span id={`${id}-content-label`} className="text-sm font-medium tracking-tight text-zinc-900">
                  {e.bodyLabel}
                </span>
                <RichTextEditor
                  value={translation.content}
                  onChange={(content) => setTranslation(locale, { content })}
                  lang={locale}
                  labelledBy={`${id}-content-label`}
                  invalid={Boolean(contentError)}
                />
                {contentError ? <p className="text-xs font-medium text-red-600">{contentError}</p> : null}
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900">{e.materialsTitle}</h3>
                <p className="mt-1 mb-4 text-xs leading-relaxed text-zinc-500">{e.materialsSubtitle}</p>
                {lessonId ? (
                  <ResourceManager
                    lessonId={lessonId}
                    locale={locale}
                    resources={resources}
                    blobConfigured={blobConfigured}
                    maxMegabytes={maxMegabytes}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center">
                    <p className="text-sm text-zinc-500">{e.saveFirst}</p>
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={() => submit("save")}
                      pending={pendingIntent === "save"}
                      disabled={busy}
                    >
                      {e.saveFirstAction}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardSection>

      <div className="sticky bottom-4 z-20 rounded-2xl bg-white/90 p-3 shadow-ring backdrop-blur-md">{actions}</div>
    </div>
  );
}
