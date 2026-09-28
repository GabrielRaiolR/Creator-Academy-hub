import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import type { MessageKey } from "@/lib/i18n/messages";
import type { PublishIssue } from "@/lib/lessons/publish";
import { AccessError } from "@/lib/permissions";

export type FieldErrors = Partial<Record<string, MessageKey>>;

export type ActionFailure = {
  ok: false;
  error: MessageKey;
  fieldErrors?: FieldErrors;
  issues?: PublishIssue[];
};

export type ActionResult<T = undefined> = { ok: true; data: T } | ActionFailure;

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: MessageKey, extra?: Omit<ActionFailure, "ok" | "error">): ActionFailure {
  return { ok: false, error, ...extra };
}

/** Zod schemas use message keys (`validation.*`) as their error messages. */
export function fromZodError(error: z.ZodError): ActionFailure {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || "_form";
    if (fieldErrors[field]) continue;
    fieldErrors[field] = issue.message.startsWith("validation.")
      ? (issue.message as MessageKey)
      : "validation.invalid";
  }
  return fail("errors.form", { fieldErrors });
}

/**
 * Wraps a Server Action body: access errors become translated failures, framework
 * control flow (redirect/notFound) is re-thrown, anything else is logged and hidden.
 */
export async function runAction<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AccessError) {
      return fail(error.code === "UNAUTHORIZED" ? "errors.unauthorized" : "errors.forbidden");
    }
    console.error("[action]", error);
    return fail("errors.generic");
  }
}
