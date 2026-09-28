import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-zinc-200/70", className)} />;
}

/** Generic page placeholder used by loading.tsx files. */
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="mb-5 h-7 w-40 rounded-full" />
      <Skeleton className="mb-4 h-12 w-2/3 max-w-lg" />
      <Skeleton className="mb-12 h-5 w-full max-w-xl" />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[2rem] bg-zinc-200 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-h-56 flex-col gap-3 bg-white p-8">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
