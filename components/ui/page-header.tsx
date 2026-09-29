import type { ReactNode } from "react";
import { Eyebrow } from "./badge";

/** Section header pattern from the design system: eyebrow, h1, lead and trailing actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="text-3xl font-medium tracking-tighter text-balance text-zinc-900 md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-base leading-relaxed text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
