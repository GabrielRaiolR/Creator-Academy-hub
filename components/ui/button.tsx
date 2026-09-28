import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium tracking-tight whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Hero button: radial blue gradient with inner highlights.
  primary: "bg-primary-gradient text-white shadow-primary hover:-translate-y-0.5 active:translate-y-0",
  // Bevel button: translucent dark gradient with a light hairline.
  secondary: "hairline hairline-bevel bg-bevel text-black/60 shadow-bevel hover:text-black/80 hover:-translate-y-0.5",
  // Dark chip.
  dark: "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-black hover:-translate-y-0.5",
  ghost: "text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900",
  danger: "bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pending?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  pending = false,
  icon,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Spinner /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function ButtonLink({ variant = "secondary", size = "md", icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

type IconButtonProps = ComponentProps<"button"> & { label: string };

/** Square-ish icon control used in tables and toolbars. */
export function IconButton({ label, className, children, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
