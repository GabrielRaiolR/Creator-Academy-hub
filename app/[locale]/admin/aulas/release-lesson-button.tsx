"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { useActionFeedback } from "@/components/ui/use-action-feedback";
import { grantLessonAction, revokeLessonAction } from "@/lib/actions/grants";
import { localeNames, type Locale } from "@/lib/i18n/config";

export type ReleaseStudent = { id: string; name: string; email: string; preferredLocale: Locale };
export type ReleaseGrant = { id: string; name: string; email: string };

export function ReleaseLessonButton({
  lessonId,
  students,
  grants,
}: {
  lessonId: string;
  students: ReleaseStudent[];
  grants: ReleaseGrant[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { handle } = useActionFeedback();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const titleId = useId();
  const selectId = useId();
  const l = t.admin.lessons;
  const available = students.filter((student) => !grants.some((grant) => grant.id === student.id));
  const selectedId = available.some((student) => student.id === studentId) ? studentId : (available[0]?.id ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const grant = () =>
    startTransition(async () => {
      if (!selectedId) return;
      const student = students.find((item) => item.id === selectedId);
      if (handle(await grantLessonAction(lessonId, selectedId), "admin.lessons.released")) {
        if (student) setStudentId(available.find((item) => item.id !== student.id)?.id ?? "");
        router.refresh();
      }
    });

  const revoke = (userId: string) =>
    startTransition(async () => {
      if (handle(await revokeLessonAction(lessonId, userId), "admin.lessons.revoked")) router.refresh();
    });

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
        {l.release}
        {grants.length > 0 ? <span className="text-zinc-400">{grants.length}</span> : null}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-[min(100%,28rem)] rounded-2xl bg-white p-6 text-zinc-900 shadow-ring backdrop:bg-zinc-950/40"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setIsOpen(false);
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {l.releaseTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{l.releaseText}</p>

        {students.length === 0 ? (
          <p className="mt-5 text-sm text-zinc-700">{l.releaseNoStudents}</p>
        ) : (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium tracking-tight">
                {l.releaseStudent}
              </label>
              <Select id={selectId} value={selectedId} onChange={(event) => setStudentId(event.target.value)} disabled={available.length === 0}>
                {available.length === 0 ? <option value="">{l.releaseAllGranted}</option> : null}
                {available.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {localeNames[student.preferredLocale]} · {student.email}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="primary" onClick={grant} pending={pending} disabled={available.length === 0 || !selectedId}>
              {l.release}
            </Button>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">{l.releaseCurrent}</p>
          {grants.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{l.releaseEmpty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-100">
              {grants.map((grant) => (
                <li key={grant.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{grant.name}</span>
                    <span className="block truncate text-xs text-zinc-500">{grant.email}</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => revoke(grant.id)} disabled={pending}>
                    {l.releaseRevoke}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="dark" onClick={() => setIsOpen(false)}>
            {t.common.close}
          </Button>
        </div>
      </dialog>
    </>
  );
}
