import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardSection } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { getUserById } from "@/lib/queries/users";
import { UserForm } from "../user-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/alunos/[id]">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.students.editTitle };
}

export default async function EditStudentPage({ params }: PageProps<"/[locale]/admin/alunos/[id]">) {
  const { segment, t } = await getLocaleContext(params);
  const admin = await requireAdmin(segment);
  const { id } = await params;
  const target = await getUserById(id);
  if (!target) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <TextLink href={localePath(segment, "/admin/alunos")} direction="back" className="mb-8">
        {t.admin.students.title}
      </TextLink>
      <PageHeader title={target.name} description={t.admin.students.editSubtitle} />
      <CardSection title={t.admin.students.accountTitle}>
        <UserForm
          mode="edit"
          id={target.id}
          isSelf={target.id === admin.id}
          initial={{
            name: target.name,
            email: target.email,
            preferredLocale: target.preferredLocale,
            role: target.role,
            active: target.active,
          }}
        />
      </CardSection>
    </div>
  );
}
