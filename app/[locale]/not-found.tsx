"use client";

import { Frame } from "@/components/layout/frame";
import { StatusScreen } from "@/components/layout/status-screen";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";

export default function NotFound() {
  const { segment, t } = useI18n();
  return (
    <Frame>
      <main id="main" className="flex flex-1 items-center justify-center px-6">
        <StatusScreen
          code="404"
          title={t.errors.notFoundTitle}
          description={t.errors.notFoundText}
          actions={
            <ButtonLink href={localePath(segment)} variant="dark">
              {t.common.backHome}
            </ButtonLink>
          }
        />
      </main>
    </Frame>
  );
}
