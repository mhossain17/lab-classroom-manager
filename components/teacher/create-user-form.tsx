"use client";

import { UserRole } from "@prisma/client";
import { useActionState } from "react";
import { createUserAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initial = { ok: false, message: "" };

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create User</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue={UserRole.STUDENT}>
            <option value={UserRole.STUDENT}>Student</option>
            <option value={UserRole.TEACHER}>Teacher</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="studentId">Student ID (required for students)</Label>
          <Input id="studentId" name="studentId" placeholder="S12345" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="student@school.edu" />
        </div>
        <div>
          <Label htmlFor="username">Username (optional)</Label>
          <Input id="username" name="username" placeholder="auto-generated if blank" />
        </div>
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
