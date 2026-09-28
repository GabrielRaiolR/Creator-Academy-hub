import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { RichTextDoc } from "@/lib/content/rich-text";
import type { Locale } from "@/lib/i18n/config";
import { user } from "./auth";

export const lessonStatuses = ["DRAFT", "PUBLISHED"] as const;
export type LessonStatus = (typeof lessonStatuses)[number];

export const lessonStatus = pgEnum("lesson_status", lessonStatuses);

export const lesson = pgTable(
  "lesson",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    status: lessonStatus("status").default("DRAFT").notNull(),
    order: integer("sort_order").default(0).notNull(),
    youtubeUrl: text("youtube_url"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("lesson_status_order_idx").on(table.status, table.order)],
);

export const lessonTranslation = pgTable(
  "lesson_translation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    locale: text("locale").$type<Locale>().notNull(),
    title: text("title").default("").notNull(),
    summary: text("summary"),
    content: jsonb("content").$type<RichTextDoc>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("lesson_translation_lesson_locale_uq").on(table.lessonId, table.locale)],
);

/** PDF materials. `locale = null` means the file is shared between languages. */
export const lessonResource = pgTable(
  "lesson_resource",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    locale: text("locale").$type<Locale>(),
    name: text("name").notNull(),
    blobPath: text("blob_path").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("lesson_resource_lesson_id_idx").on(table.lessonId)],
);

export const lessonRelations = relations(lesson, ({ many }) => ({
  translations: many(lessonTranslation),
  resources: many(lessonResource),
}));

export const lessonTranslationRelations = relations(lessonTranslation, ({ one }) => ({
  lesson: one(lesson, { fields: [lessonTranslation.lessonId], references: [lesson.id] }),
}));

export const lessonResourceRelations = relations(lessonResource, ({ one }) => ({
  lesson: one(lesson, { fields: [lessonResource.lessonId], references: [lesson.id] }),
}));
