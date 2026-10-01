"use client";

import { MessageSquarePlus } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { createLessonNoteAction, deleteLessonNoteAction, updateLessonNoteAction } from "@/lib/actions/notes";
import {
  anchorNotes,
  flattenRichText,
  NOTE_CONTEXT,
  NOTE_QUOTE_MAX,
  type StoredNote,
} from "@/lib/content/note-anchor";
import { sanitizeRichText } from "@/lib/content/rich-text";
import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";
import { RichText } from "./rich-text";

type AnchorRect = { top: number; left: number; bottom: number; width: number; height: number };

type Composer =
  | { mode: "create"; quote: string; prefix: string; suffix: string; position: number; rect: AnchorRect }
  | { mode: "edit"; note: StoredNote; rect: AnchorRect };

function subscribeToNothing() {
  return () => {};
}

function toRect(rect: DOMRect): AnchorRect {
  return { top: rect.top, left: rect.left, bottom: rect.bottom, width: rect.width, height: rect.height };
}

function pointOffset(node: Node, offset: number): number | null {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const span = element?.closest<HTMLElement>("[data-offset]");
  if (!span) return null;
  const base = Number(span.dataset.offset);
  if (!Number.isFinite(base)) return null;
  if (node.nodeType === Node.TEXT_NODE) return base + offset;
  return base;
}

function place(rect: AnchorRect, width: number, height: number) {
  const margin = 12;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = rect.top - height - margin;
  if (top < margin) top = Math.min(rect.bottom + margin, window.innerHeight - height - margin);
  return { top, left };
}

function Popover({
  rect,
  closing,
  onClosed,
  children,
}: {
  rect: AnchorRect;
  closing: boolean;
  onClosed: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const spot = place(rect, 320, 220);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const boxWidth = el.offsetWidth;
    const boxHeight = el.offsetHeight;
    const next = place(rect, boxWidth, boxHeight);
    el.style.top = `${next.top}px`;
    el.style.left = `${next.left}px`;
    el.style.transformOrigin = next.top < rect.top ? "center bottom" : "center top";
    const field = el.querySelector("textarea");
    if (!closing && field instanceof HTMLTextAreaElement && document.activeElement !== field) {
      field.focus({ preventScroll: true });
    }
  }, [rect, closing]);

  useEffect(() => {
    if (!closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClosed, reduce ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [closing, onClosed]);

  return createPortal(
    <div
      ref={ref}
      data-note-ui
      data-state={closing ? "closed" : "open"}
      style={{ top: spot.top, left: spot.left, transformOrigin: spot.top < rect.top ? "center bottom" : "center top" }}
      className="note-popover fixed z-50"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.animationName === "note-pop-out") onClosed();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function AnnotatedLesson({
  content,
  lang,
  lessonId,
  locale,
  notes: initialNotes,
}: {
  content: unknown;
  lang: string;
  lessonId: string;
  locale: Locale;
  notes: StoredNote[];
}) {
  const { t } = useI18n();
  const { handle } = useActionFeedback();
  const rootRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [toolbar, setToolbar] = useState<{ quote: string; prefix: string; suffix: string; position: number; rect: AnchorRect } | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const isClient = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  const flat = useMemo(() => {
    const doc = sanitizeRichText(content);
    return doc ? flattenRichText(doc) : "";
  }, [content]);

  const { anchored, orphans } = useMemo(() => anchorNotes(flat, notes), [flat, notes]);
  const highlights = anchored.map(({ note, start, end }) => ({ id: note.id, start, end }));

  useEffect(() => {
    if (!toolbar && !composer) return;
    const dismissToolbar = () => setToolbar(null);
    window.addEventListener("scroll", dismissToolbar);
    window.addEventListener("resize", dismissToolbar);
    return () => {
      window.removeEventListener("scroll", dismissToolbar);
      window.removeEventListener("resize", dismissToolbar);
    };
  }, [toolbar, composer]);

  useEffect(() => {
    const onSelect = (event: Event) => {
      if (composer) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-note-ui]")) return;
      const root = rootRef.current;
      const selection = window.getSelection();
      if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) {
        setToolbar(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
        setToolbar(null);
        return;
      }
      const start = pointOffset(range.startContainer, range.startOffset);
      const end = pointOffset(range.endContainer, range.endOffset);
      if (start === null || end === null || start === end) {
        setToolbar(null);
        return;
      }
      const [from, to] = start < end ? [start, end] : [end, start];
      const quote = flat.slice(from, to);
      if (!quote.trim()) {
        setToolbar(null);
        return;
      }
      setToolbar({
        quote,
        prefix: flat.slice(Math.max(0, from - NOTE_CONTEXT), from),
        suffix: flat.slice(to, to + NOTE_CONTEXT),
        position: from,
        rect: toRect(range.getBoundingClientRect()),
      });
    };
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("keyup", onSelect);
    document.addEventListener("touchend", onSelect);
    return () => {
      document.removeEventListener("mouseup", onSelect);
      document.removeEventListener("keyup", onSelect);
      document.removeEventListener("touchend", onSelect);
    };
  }, [composer, flat]);

  useEffect(() => {
    if (!composer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setClosing(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [composer]);

  const finishClose = useCallback(() => {
    setComposer(null);
    setClosing(false);
  }, []);

  function openComposer(next: Composer) {
    setDraft(next.mode === "edit" ? next.note.body : "");
    setClosing(false);
    setComposer(next);
    setToolbar(null);
    window.getSelection()?.removeAllRanges();
  }

  function openExisting(id: string, rect: DOMRect) {
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    openComposer({ mode: "edit", note, rect: toRect(rect) });
  }

  function save() {
    if (!composer) return;
    startTransition(async () => {
      if (composer.mode === "create") {
        const result = await createLessonNoteAction({
          lessonId,
          locale,
          quote: composer.quote,
          prefix: composer.prefix,
          suffix: composer.suffix,
          position: composer.position,
          body: draft,
        });
        if (handle(result, "lessons.notes.saved")) {
          setNotes((current) => [...current, result.data]);
          setClosing(true);
        }
        return;
      }
      const result = await updateLessonNoteAction({ id: composer.note.id, body: draft });
      if (handle(result, "lessons.notes.updated")) {
        const nextBody = draft.trim();
        setNotes((current) => current.map((item) => (item.id === composer.note.id ? { ...item, body: nextBody } : item)));
        setClosing(true);
      }
    });
  }

  const quote = composer?.mode === "create" ? composer.quote : composer?.note.quote;

  return (
    <div
      ref={rootRef}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("[data-open-note]")) event.preventDefault();
      }}
      onClick={(event) => {
        if (window.getSelection() && !window.getSelection()?.isCollapsed) return;
        const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-open-note]");
        const id = trigger?.dataset.openNote;
        if (!id || !trigger) return;
        if (trigger.tagName !== "BUTTON" && trigger.closest("a")) return;
        event.preventDefault();
        openExisting(id, trigger.getBoundingClientRect());
      }}
    >
      <RichText content={content} lang={lang} highlights={highlights} noteLabel={t.lessons.notes.open} />

      {orphans.length > 0 ? (
        <section aria-labelledby="orphan-notes-title" className="mt-10">
          <h2 id="orphan-notes-title" className="text-xl font-semibold tracking-tight text-zinc-900">
            {t.lessons.notes.orphansTitle}
          </h2>
          <p className="mt-1 mb-5 text-sm text-zinc-500">{t.lessons.notes.orphansText}</p>
          <ul className="flex flex-col gap-2">
            {orphans.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-zinc-50 p-4 text-left shadow-ring transition-colors hover:bg-zinc-100"
                  onClick={(event) => openExisting(note.id, event.currentTarget.getBoundingClientRect())}
                >
                  <span className="line-clamp-2 text-sm leading-relaxed text-zinc-500">{note.quote}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-zinc-900">{note.body}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isClient && toolbar && !composer
        ? createPortal(
            <div data-note-ui style={{ top: Math.max(12, toolbar.rect.top - 44), left: toolbar.rect.left + toolbar.rect.width / 2 }} className="fixed z-50 -translate-x-1/2">
              <div className="note-popover" data-state="open">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium tracking-tight text-white shadow-lg shadow-zinc-900/20"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (toolbar.quote.length > NOTE_QUOTE_MAX) {
                    toast.error(translate(t, "lessons.notes.tooLong"));
                    return;
                  }
                  openComposer({ mode: "create", ...toolbar });
                }}
              >
                <MessageSquarePlus aria-hidden className="size-3.5" strokeWidth={1.5} />
                {t.lessons.notes.annotate}
              </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isClient && composer ? (
        <Popover rect={composer.rect} closing={closing} onClosed={finishClose}>
          <div data-note-ui className="w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-white p-4 shadow-ring">
            <blockquote className="line-clamp-4 border-l-2 border-zinc-200 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-500">
              {quote}
            </blockquote>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.lessons.notes.placeholder}
              className="mt-3"
              aria-label={t.lessons.notes.placeholder}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              {composer.mode === "edit" ? (
                <ConfirmDialog
                  title={t.lessons.notes.deleteTitle}
                  description={t.lessons.notes.deleteText}
                  confirmLabel={t.lessons.notes.delete}
                  onConfirm={async () => {
                    const result = await deleteLessonNoteAction({ id: composer.note.id });
                    if (!result.ok) {
                      toast.error(translate(t, result.error));
                      return false;
                    }
                    setNotes((current) => current.filter((item) => item.id !== composer.note.id));
                    setClosing(true);
                    toast.success(translate(t, "lessons.notes.deleted"));
                  }}
                  renderTrigger={(open) => (
                    <Button variant="ghost" size="sm" onClick={open}>
                      {t.lessons.notes.delete}
                    </Button>
                  )}
                />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setClosing(true)} disabled={pending || closing}>
                  {t.common.cancel}
                </Button>
                <Button variant="dark" size="sm" onClick={save} pending={pending} disabled={!draft.trim()}>
                  {t.lessons.notes.save}
                </Button>
              </div>
            </div>
          </div>
        </Popover>
      ) : null}
    </div>
  );
}
