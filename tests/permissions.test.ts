import { describe, expect, it } from "vitest";
import { canViewLesson, isAdmin } from "@/lib/permissions/rules";

const admin = { role: "ADMIN" as const, active: true };
const student = { role: "STUDENT" as const, active: true };
const published = { status: "PUBLISHED" as const };
const draft = { status: "DRAFT" as const };

describe("isAdmin", () => {
  it("accepts only active admins", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin({ ...admin, active: false })).toBe(false);
    expect(isAdmin(student)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});

describe("canViewLesson", () => {
  it("lets students see only published lessons", () => {
    expect(canViewLesson(student, published)).toBe(true);
    expect(canViewLesson(student, draft)).toBe(false);
  });

  it("lets admins preview drafts", () => {
    expect(canViewLesson(admin, draft)).toBe(true);
    expect(canViewLesson(admin, published)).toBe(true);
  });

  it("blocks inactive and anonymous users", () => {
    expect(canViewLesson({ ...student, active: false }, published)).toBe(false);
    expect(canViewLesson({ ...admin, active: false }, draft)).toBe(false);
    expect(canViewLesson(null, published)).toBe(false);
  });
});
