"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, fieldAria } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { updateProfileAction } from "@/lib/actions/profile";
import { locales, localeToSegment, switchLocaleInPath, type Locale } from "@/lib/i18n/config";

export function ProfileForm({ name, email, preferredLocale }: { name: string; email: string; preferredLocale: Locale }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState({ name, preferredLocale });
  const [pending, startTransition] = useTransition();
  const { handle, errorFor } = useActionFeedback();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!handle(result, "profile.profileSaved")) return;
      if (values.preferredLocale !== locale) {
        router.push(switchLocaleInPath(pathname, localeToSegment(values.preferredLocale)));
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Field label={t.profile.name} htmlFor="profile-name" error={errorFor("name")}>
        <Input
          {...fieldAria("profile-name", errorFor("name"))}
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          required
          maxLength={120}
        />
      </Field>

      <Field label={t.profile.email} htmlFor="profile-email" hint={t.profile.emailHint}>
        <Input {...fieldAria("profile-email", undefined, true)} type="email" value={email} readOnly disabled />
      </Field>

      <Field
        label={t.profile.preferredLanguage}
        htmlFor="profile-locale"
        hint={t.profile.preferredLanguageHint}
        error={errorFor("preferredLocale")}
      >
        <Select
          {...fieldAria("profile-locale", errorFor("preferredLocale"), true)}
          value={values.preferredLocale}
          onChange={(event) =>
            setValues((current) => ({ ...current, preferredLocale: event.target.value as Locale }))
          }
        >
          {locales.map((option) => (
            <option key={option} value={option} lang={option}>
              {t.languages[option]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="dark" pending={pending}>
          {pending ? t.common.saving : t.profile.saveProfile}
        </Button>
      </div>
    </form>
  );
}
