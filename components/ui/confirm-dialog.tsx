"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, type ButtonVariant } from "./button";

type ConfirmDialogProps = {
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  /** Resolve to `false` to keep the dialog open (e.g. when the action failed). */
  onConfirm: () => Promise<boolean | void>;
  renderTrigger: (open: () => void) => ReactNode;
};

/** Native <dialog> styled as a ring card; every destructive action goes through it. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  renderTrigger,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const confirm = () =>
    startTransition(async () => {
      const result = await onConfirm();
      if (result !== false) close();
    });

  return (
    <>
      {renderTrigger(open)}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-zinc-800 shadow-ring backdrop:bg-zinc-900/40 backdrop:backdrop-blur-sm"
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) close();
        }}
        onClose={() => setIsOpen(false)}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={close} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button variant={confirmVariant} size="sm" onClick={confirm} pending={pending}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
