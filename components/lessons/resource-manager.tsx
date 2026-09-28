"use client";

import { upload } from "@vercel/blob/client";
import { FileText, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert, Select } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { deleteResourceAction, registerResourceAction } from "@/lib/actions/resources";
import type { Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { formatBytes } from "@/lib/utils";

export type EditorResource = { id: string; name: string; size: number; locale: Locale | null };

type ResourceManagerProps = {
  lessonId: string;
  locale: Locale;
  resources: EditorResource[];
  blobConfigured: boolean;
  maxMegabytes: number;
};

function safeFileName(name: string) {
  const base = name
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "material"}.pdf`;
}

/**
 * PDFs for one translation tab (plus shared ones). The browser uploads straight to the
 * private Blob store with a short-lived token; the server then verifies and registers the file.
 */
export function ResourceManager({ lessonId, locale, resources, blobConfigured, maxMegabytes }: ResourceManagerProps) {
  const { locale: uiLocale, t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scopeId = useId();
  const { handle } = useActionFeedback();
  const [scope, setScope] = useState<"locale" | "shared">("locale");
  const [progress, setProgress] = useState<number | null>(null);
  const r = t.admin.resources;

  const visible = resources.filter((resource) => resource.locale === locale || resource.locale === null);

  const onFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" && file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error(r.invalidType);
      return;
    }
    if (file.size > maxMegabytes * 1024 * 1024) {
      toast.error(format(r.tooLarge, { size: maxMegabytes }));
      return;
    }

    setProgress(0);
    try {
      const blob = await upload(`lessons/${lessonId}/${safeFileName(file.name)}`, file, {
        access: "private",
        contentType: "application/pdf",
        handleUploadUrl: "/api/admin/uploads",
        clientPayload: JSON.stringify({ lessonId }),
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      const result = await registerResourceAction({
        lessonId,
        locale: scope === "shared" ? null : locale,
        name: file.name,
        pathname: blob.pathname,
      });
      if (handle(result, "admin.resources.uploaded")) router.refresh();
    } catch (error) {
      console.error("[upload]", error);
      toast.error(r.failed);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    const success = handle(await deleteResourceAction(id), "admin.resources.deleted");
    if (success) router.refresh();
    return success;
  };

  return (
    <div className="flex flex-col gap-4">
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center text-sm text-zinc-500">
          {r.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((resource) => (
            <li key={resource.id} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-primary/10 text-blue-primary">
                <FileText aria-hidden className="size-4" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <a
                  href={`/api/resources/${resource.id}/download`}
                  className="block truncate text-sm font-medium text-zinc-900 hover:text-blue-dark"
                >
                  {resource.name}
                </a>
                <span className="block text-xs text-zinc-500">
                  {formatBytes(resource.size, uiLocale)} ·{" "}
                  {resource.locale ? t.languages[resource.locale] : r.shared}
                </span>
              </span>
              <ConfirmDialog
                title={r.deleteTitle}
                description={r.deleteText}
                confirmLabel={t.common.delete}
                onConfirm={() => remove(resource.id)}
                renderTrigger={(open) => (
                  <IconButton label={t.common.delete} onClick={open} className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
                  </IconButton>
                )}
              />
            </li>
          ))}
        </ul>
      )}

      {blobConfigured ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={scopeId} className="text-sm font-medium tracking-tight text-zinc-900">
              {r.scope}
            </label>
            <Select
              id={scopeId}
              value={scope}
              onChange={(event) => setScope(event.target.value as "locale" | "shared")}
              disabled={progress !== null}
            >
              <option value="locale">{t.languages[locale]}</option>
              <option value="shared">{r.sharedLong}</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <Button
              variant="secondary"
              pending={progress !== null}
              icon={<Upload aria-hidden className="size-4" strokeWidth={1.5} />}
              onClick={() => inputRef.current?.click()}
            >
              {progress !== null ? format(r.uploading, { progress }) : r.upload}
            </Button>
          </div>
        </div>
      ) : (
        <FormAlert tone="warning">{r.notConfigured}</FormAlert>
      )}
      {blobConfigured ? <p className="text-xs text-zinc-500">{format(r.maxSize, { size: maxMegabytes })}</p> : null}
    </div>
  );
}
