import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">{icon}</div>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
