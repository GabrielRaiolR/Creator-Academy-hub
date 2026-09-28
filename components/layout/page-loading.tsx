"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PageSkeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  const { t } = useI18n();
  return <PageSkeleton label={t.common.loading} />;
}
