import { Download, FileText } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { formatBytes } from "@/lib/utils";

type Material = { id: string; name: string; size: number; locale: Locale | null };

/** Plain links to the protected download route; the route re-checks the session on every request. */
export function MaterialsList({ materials, locale, t }: { materials: Material[]; locale: Locale; t: Messages }) {
  return (
    <ul className="flex flex-col gap-2">
      {materials.map((material) => (
        <li key={material.id}>
          <a
            href={`/api/resources/${material.id}/download`}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-ring transition-colors hover:bg-zinc-50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-primary/10 text-blue-primary">
              <FileText aria-hidden className="size-5" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-zinc-900">{material.name}</span>
              <span className="block text-xs text-zinc-500">
                PDF · {formatBytes(material.size, locale)}
                {material.locale ? "" : ` · ${t.lessons.allLanguages}`}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-900">
              <span className="hidden sm:inline">{t.lessons.download}</span>
              <Download aria-hidden className="size-4" strokeWidth={1.5} />
              <span className="sr-only sm:hidden">{t.lessons.download}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
