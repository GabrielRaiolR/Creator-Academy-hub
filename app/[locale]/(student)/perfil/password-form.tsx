"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAria } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { changePasswordAction } from "@/lib/actions/profile";

const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const { t } = useI18n();
  const [values, setValues] = useState(empty);
  const [pending, startTransition] = useTransition();
  const { handle, errorFor } = useActionFeedback();

  const set = (field: keyof typeof empty) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (handle(result, "profile.passwordChanged")) setValues(empty);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Field label={t.profile.currentPassword} htmlFor="current-password" error={errorFor("currentPassword")}>
        <Input
          {...fieldAria("current-password", errorFor("currentPassword"))}
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={set("currentPassword")}
          required
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={t.profile.newPassword} htmlFor="new-password" error={errorFor("newPassword")}>
          <Input
            {...fieldAria("new-password", errorFor("newPassword"))}
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={set("newPassword")}
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
        <Field label={t.profile.confirmPassword} htmlFor="confirm-password" error={errorFor("confirmPassword")}>
          <Input
            {...fieldAria("confirm-password", errorFor("confirmPassword"))}
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={set("confirmPassword")}
            required
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="dark" pending={pending}>
          {pending ? t.common.saving : t.profile.changePassword}
        </Button>
      </div>
    </form>
  );
}
