import { z } from "zod";
import { roles } from "@/db/schema/auth";
import { locales } from "@/lib/i18n/config";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug";
import { parseYouTubeId } from "@/lib/youtube";

// Error messages are dictionary keys, translated on the client.

export const localeSchema = z.enum(locales, "validation.invalid");

const name = z.string().trim().min(1, "validation.required").max(120, "validation.tooLong");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "validation.required")
  .max(254, "validation.tooLong")
  .pipe(z.email("validation.email"));

export const password = z.string().min(8, "validation.passwordMin").max(128, "validation.passwordMax");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "validation.required").max(128, "validation.passwordMax"),
  next: z.string().max(500).optional(),
});

export const createUserSchema = z.object({
  name,
  email,
  preferredLocale: localeSchema,
  role: z.enum(roles, "validation.invalid"),
  password,
});

export const updateUserSchema = createUserSchema.extend({
  id: z.string().min(1),
  password: z.union([z.literal(""), password]),
  active: z.boolean(),
});

export const profileSchema = z.object({ name, preferredLocale: localeSchema });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.required").max(128, "validation.passwordMax"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

const translationSchema = z.object({
  title: z.string().trim().max(200, "validation.tooLong"),
  summary: z.string().trim().max(600, "validation.tooLong"),
  // Structure is enforced by sanitizeRichText on the server.
  content: z.unknown(),
});

export const lessonIntents = ["save", "publish", "unpublish"] as const;
export type LessonIntent = (typeof lessonIntents)[number];

export const lessonInputSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(SLUG_MAX_LENGTH, "validation.tooLong")
    .regex(SLUG_PATTERN, "validation.slug"),
  order: z.number("validation.order").int("validation.order").min(0, "validation.order").max(100_000, "validation.order"),
  youtubeUrl: z
    .string()
    .trim()
    .max(500, "validation.tooLong")
    .refine((value) => value === "" || parseYouTubeId(value) !== null, "validation.youtube"),
  translations: z.record(localeSchema, translationSchema),
  intent: z.enum(lessonIntents),
});

export type LessonInput = z.input<typeof lessonInputSchema>;

export const resourceInputSchema = z.object({
  lessonId: z.uuid(),
  locale: localeSchema.nullable(),
  name: z.string().trim().min(1).max(200),
  pathname: z.string().min(1).max(500),
});

export const idSchema = z.uuid();
