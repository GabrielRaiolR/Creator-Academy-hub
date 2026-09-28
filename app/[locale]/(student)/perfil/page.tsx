import type { Metadata } from "next";
import { CardSection } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireUser } from "@/lib/permissions";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/perfil">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.profile.title };
}

export default async function ProfilePage({ params }: PageProps<"/[locale]/perfil">) {
  const { segment, t } = await getLocaleContext(params);
  const user = await requireUser(segment);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t.profile.eyebrow} title={t.profile.title} description={t.profile.subtitle} />
      <div className="flex flex-col gap-6">
        <CardSection title={t.profile.detailsTitle}>
          <ProfileForm name={user.name} email={user.email} preferredLocale={user.preferredLocale} />
        </CardSection>
        <CardSection title={t.profile.passwordTitle} description={t.profile.passwordSubtitle}>
          <PasswordForm />
        </CardSection>
      </div>
    </div>
  );
}
