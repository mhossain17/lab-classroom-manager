"use client";

import { useActionState } from "react";
import { createClassAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial = { ok: false, message: "" };

export function CreateClassForm() {
  const [state, action, pending] = useActionState(createClassAction, initial);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Class</h3>

      <div>
        <Label htmlFor="name">Class Name</Label>
        <Input id="name" name="name" required placeholder="Engineering Fundamentals" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="courseCode">Course Code</Label>
          <Input id="courseCode" name="courseCode" required placeholder="ENGR-101" />
        </div>
        <div>
          <Label htmlFor="section">Section</Label>
          <Input id="section" name="section" required placeholder="A1" />
        </div>
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating..." : "Create Class"}
      </Button>
    </form>
  );
}
