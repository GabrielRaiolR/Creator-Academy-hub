"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { ActionResult, FieldErrors } from "@/lib/actions/result";
import { translate, type MessageKey } from "@/lib/i18n/messages";

/**
 * Standard feedback for Server Action results: toast on success/failure and
 * translated per-field errors for the form.
 */
export function useActionFeedback() {
  const { t } = useI18n();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handle<T>(result: ActionResult<T>, successKey?: MessageKey): result is { ok: true; data: T } {
    if (result.ok) {
      setFieldErrors({});
      if (successKey) toast.success(translate(t, successKey));
      return true;
    }
    setFieldErrors(result.fieldErrors ?? {});
    toast.error(translate(t, result.error));
    return false;
  }

  const errorFor = (field: string) => {
    const key = fieldErrors[field];
    return key ? translate(t, key) : undefined;
  };

  return { handle, errorFor, setFieldErrors };
}
