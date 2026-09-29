import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Input "well" from the design system search bar: zinc-50 fill, zinc-200 edge, rounded-xl. */
const control =
  "block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-primary/50 focus:bg-white focus:ring-2 focus:ring-blue-primary/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-red-50/40";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        control,
        "h-11 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[position:right_0.9rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

type FieldProps = {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, optionalLabel, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium tracking-tight text-zinc-900">
        {label}
        {optionalLabel ? <span className="ml-1.5 font-normal text-zinc-400">({optionalLabel})</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-center text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** aria props wiring a control to its Field hint/error. */
export function fieldAria(id: string, error?: unknown, hint?: unknown) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "warning"; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-center text-sm leading-relaxed",
        tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      {children}
    </div>
  );
}

type SwitchProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode };

export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start justify-between gap-4", className)}>
      <span>
        <span className="block text-sm font-medium tracking-tight text-zinc-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-6 w-10 rounded-full bg-zinc-200 transition-colors peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-primary/50 peer-disabled:opacity-50" />
        <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
