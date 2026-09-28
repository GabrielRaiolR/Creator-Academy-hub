"use client";

import { RouteError } from "@/components/layout/route-error";

export default function StudentError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />;
}
