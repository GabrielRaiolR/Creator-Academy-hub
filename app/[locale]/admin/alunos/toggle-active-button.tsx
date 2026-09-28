"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { setUserActiveAction } from "@/lib/actions/users";
import { format } from "@/lib/i18n/messages";

/** Deactivation asks for confirmation (it logs the person out); reactivation is immediate. */
export function ToggleActiveButton({ id, name, active }: { id: string; name: string; active: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const { handle } = useActionFeedback();
  const [pending, startTransition] = useTransition();
  const s = t.admin.students;

  const run = async (next: boolean) => {
    const result = await setUserActiveAction(id, next);
    const success = handle(result, next ? "admin.students.activated" : "admin.students.deactivated");
    if (success) router.refresh();
    return success;
  };

  if (!active) {
    return (
      <Button size="sm" variant="secondary" pending={pending} onClick={() => startTransition(async () => void (await run(true)))}>
        {s.activate}
      </Button>
    );
  }

  return (
    <ConfirmDialog
      title={format(s.deactivateTitle, { name })}
      description={s.deactivateText}
      confirmLabel={s.deactivate}
      onConfirm={() => run(false)}
      renderTrigger={(open) => (
        <Button size="sm" variant="ghost" onClick={open} className="text-red-600 hover:bg-red-50 hover:text-red-700">
          {s.deactivate}
        </Button>
      )}
    />
  );
}
