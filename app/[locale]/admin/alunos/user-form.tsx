"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Switch, fieldAria } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import type { Role } from "@/db/schema/auth";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import { localePath, locales, type Locale } from "@/lib/i18n/config";

type UserFormValues = {
  name: string;
  email: string;
  preferredLocale: Locale;
  role: Role;
  password: string;
  active: boolean;
};

type UserFormProps =
  | { mode: "create" }
  | { mode: "edit"; id: string; isSelf: boolean; initial: Omit<UserFormValues, "password"> };

const roleOptions: Role[] = ["STUDENT", "ADMIN"];

export function UserForm(props: UserFormProps) {
  const { segment, locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { handle, errorFor } = useActionFeedback();
  const [values, setValues] = useState<UserFormValues>(
    props.mode === "edit"
      ? { ...props.initial, password: "" }
      : { name: "", email: "", preferredLocale: locale, role: "STUDENT", password: "", active: true },
  );
  const s = t.admin.students;
  const isSelf = props.mode === "edit" && props.isSelf;
  const listPath = localePath(segment, "/admin/alunos");

  const set = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createUserAction({
          name: values.name,
          email: values.email,
          preferredLocale: values.preferredLocale,
          role: values.role,
          password: values.password,
        });
        if (handle(result, "admin.students.created")) {
          router.push(listPath);
          router.refresh();
        }
        return;
      }
      const result = await updateUserAction({ ...values, id: props.id });
      if (handle(result, "admin.students.updated")) {
        set("password", "");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={s.name} htmlFor="user-name" error={errorFor("name")}>
          <Input
            {...fieldAria("user-name", errorFor("name"))}
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            autoComplete="off"
            maxLength={120}
            required
          />
        </Field>
        <Field label={s.email} htmlFor="user-email" error={errorFor("email")}>
          <Input
            {...fieldAria("user-email", errorFor("email"))}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            maxLength={254}
            required
          />
        </Field>
        <Field label={s.preferredLanguage} htmlFor="user-locale" error={errorFor("preferredLocale")}>
          <Select
            {...fieldAria("user-locale", errorFor("preferredLocale"))}
            value={values.preferredLocale}
            onChange={(event) => set("preferredLocale", event.target.value as Locale)}
          >
            {locales.map((option) => (
              <option key={option} value={option} lang={option}>
                {t.languages[option]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={s.role} htmlFor="user-role" hint={s.roleHint} error={errorFor("role")}>
          <Select
            {...fieldAria("user-role", errorFor("role"), true)}
            value={values.role}
            onChange={(event) => set("role", event.target.value as Role)}
            disabled={isSelf}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {t.admin.roles[role]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label={props.mode === "create" ? s.initialPassword : s.newPassword}
        htmlFor="user-password"
        hint={props.mode === "create" ? s.initialPasswordHint : s.newPasswordHint}
        error={errorFor("password")}
      >
        <Input
          {...fieldAria("user-password", errorFor("password"), true)}
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => set("password", event.target.value)}
          minLength={8}
          maxLength={128}
          required={props.mode === "create"}
        />
      </Field>

      {props.mode === "edit" ? (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
          <Switch
            id="user-active"
            label={s.accountActive}
            description={s.accountActiveHint}
            checked={values.active}
            onChange={(event) => set("active", event.target.checked)}
            disabled={isSelf}
          />
        </div>
      ) : null}

      {isSelf ? <FormAlert tone="warning">{s.cannotChangeOwnAccess}</FormAlert> : null}

      <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={listPath} variant="ghost">
          {t.common.cancel}
        </ButtonLink>
        <Button type="submit" variant="dark" pending={pending}>
          {pending ? t.common.saving : props.mode === "create" ? s.create : t.common.save}
        </Button>
      </div>
    </form>
  );
}
