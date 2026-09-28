import { notFound } from "next/navigation";

/** Unknown paths inside a locale render the localized 404 instead of Next's default page. */
export default function CatchAll() {
  notFound();
}
