"use client";

import { useActionState } from "react";
import { enrollStudentAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial = { ok: false, message: "" };

export function EnrollStudentForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState(enrollStudentAction, initial);

  return (
    <form action={action} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <input type="hidden" name="classId" value={classId} />
      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Add student by username</label>
      <div className="flex gap-2">
        <Input name="username" placeholder="student username" required />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          Add
        </Button>
      </div>
      {state.message ? (
        <p className={`text-xs ${state.ok ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
