import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Ring card: white surface, rounded-2xl, the design system's layered ring shadow. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-white shadow-ring", className)} {...props} />;
}

type CardSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CardSection({ title, description, actions, children, className }: CardSectionProps) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}
