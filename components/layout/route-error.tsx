"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";
import { StatusScreen } from "./status-screen";

/** Shared body for error.tsx boundaries. */
export function RouteError({ error, reset, homePath = "" }: { error: Error & { digest?: string }; reset: () => void; homePath?: string }) {
  const { segment, t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code={error.digest ? `#${error.digest}` : undefined}
      title={t.errors.pageTitle}
      description={t.errors.pageText}
      actions={
        <>
          <Button variant="dark" onClick={reset}>
            {t.common.retry}
          </Button>
          <ButtonLink href={localePath(segment, homePath)} variant="ghost">
            {t.common.backHome}
          </ButtonLink>
        </>
      }
    />
  );
}
