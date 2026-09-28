"use client";

import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { deleteLessonAction, moveLessonAction } from "@/lib/actions/lessons";
import { localePath } from "@/lib/i18n/config";

const linkIcon =
  "inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900";

export function LessonRowActions({
  id,
  slug,
  isFirst,
  isLast,
}: {
  id: string;
  slug: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { segment, t } = useI18n();
  const router = useRouter();
  const { handle } = useActionFeedback();
  const [pending, startTransition] = useTransition();
  const l = t.admin.lessons;

  const move = (direction: "up" | "down") =>
    startTransition(async () => {
      if (handle(await moveLessonAction(id, direction))) router.refresh();
    });

  const remove = async () => {
    const success = handle(await deleteLessonAction(id), "admin.lessons.deleted");
    if (success) router.refresh();
    return success;
  };

  return (
    <div className="flex shrink-0 items-center gap-0.5 self-end md:self-auto" aria-busy={pending || undefined}>
      <IconButton label={l.moveUp} onClick={() => move("up")} disabled={isFirst || pending}>
        <ArrowUp aria-hidden className="size-4" strokeWidth={1.5} />
      </IconButton>
      <IconButton label={l.moveDown} onClick={() => move("down")} disabled={isLast || pending}>
        <ArrowDown aria-hidden className="size-4" strokeWidth={1.5} />
      </IconButton>
      <Link href={localePath(segment, `/aulas/${slug}`)} className={linkIcon} aria-label={l.preview} title={l.preview}>
        <Eye aria-hidden className="size-4" strokeWidth={1.5} />
      </Link>
      <Link
        href={localePath(segment, `/admin/aulas/${id}`)}
        className={linkIcon}
        aria-label={t.common.edit}
        title={t.common.edit}
      >
        <Pencil aria-hidden className="size-4" strokeWidth={1.5} />
      </Link>
      <ConfirmDialog
        title={l.deleteTitle}
        description={l.deleteText}
        confirmLabel={t.common.delete}
        onConfirm={remove}
        renderTrigger={(open) => (
          <IconButton label={t.common.delete} onClick={open} className="hover:bg-red-50 hover:text-red-600">
            <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
          </IconButton>
        )}
      />
    </div>
  );
}
