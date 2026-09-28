"use client";

import { StatusScreen } from "@/components/layout/status-screen";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";

export default function LessonNotFound() {
  const { segment, t } = useI18n();
  return (
    <StatusScreen
      code="404"
      title={t.lessons.notFoundTitle}
      description={t.lessons.notFoundText}
      actions={
        <ButtonLink href={localePath(segment, "/aulas")} variant="dark">
          {t.lessons.backToLessons}
        </ButtonLink>
      }
    />
  );
}
