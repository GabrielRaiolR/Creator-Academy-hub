"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { translate } from "@/lib/i18n/messages";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <FormAlert>{translate(t, state.error)}</FormAlert> : null}

      <Field label={t.auth.email} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          key={state.email}
          aria-invalid={state.error ? true : undefined}
        />
      </Field>

      <Field label={t.auth.password} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
        />
      </Field>

      <Button type="submit" variant="primary" pending={pending} className="mt-1 w-full">
        {pending ? t.auth.submitting : t.auth.submit}
      </Button>
    </form>
  );
}
