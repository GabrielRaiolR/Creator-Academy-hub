import type { Metadata } from "next";
import { CardSection } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { UserForm } from "../user-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/alunos/novo">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.students.createTitle };
}

export default async function NewStudentPage({ params }: PageProps<"/[locale]/admin/alunos/novo">) {
  const { segment, t } = await getLocaleContext(params);
  await requireAdmin(segment);

  return (
    <div className="mx-auto max-w-2xl">
      <TextLink href={localePath(segment, "/admin/alunos")} direction="back" className="mb-8">
        {t.admin.students.title}
      </TextLink>
      <PageHeader title={t.admin.students.createTitle} description={t.admin.students.createSubtitle} />
      <CardSection title={t.admin.students.accountTitle}>
        <UserForm mode="create" />
      </CardSection>
    </div>
  );
}
