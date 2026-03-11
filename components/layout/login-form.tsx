"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type LoginUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

const initialState = { ok: false, message: "" };

export function LoginForm({ users }: { users: LoginUser[] }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Classroom Access</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Choose your identity</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          For MVP use, select a seeded account and enter directly.
        </p>
      </div>

      <div>
        <label htmlFor="userId" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Student or Teacher Profile
        </label>
        <Select id="userId" name="userId" required>
          <option value="">Select profile</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role.toLowerCase()})
            </option>
          ))}
        </Select>
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Signing in..." : "Enter Classroom App"}
      </Button>
    </form>
  );
}
