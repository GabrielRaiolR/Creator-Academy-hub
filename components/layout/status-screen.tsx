import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/badge";

/** Centered message used by not-found and error boundaries. */
export function StatusScreen({
  code,
  title,
  description,
  actions,
}: {
  code?: string;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-2 py-12 text-center">
      {code ? <Eyebrow className="mb-6">{code}</Eyebrow> : null}
      <h1 className="text-3xl font-medium tracking-tighter text-balance text-zinc-900 md:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-500">{description}</p>
      {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
