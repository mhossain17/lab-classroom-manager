import Link from "next/link";
import { FlaskConical, Lightbulb, Wrench } from "lucide-react";
import { LoginForm } from "@/components/layout/login-form";
import { Card } from "@/components/ui/card";
import { getLoginUsers, getOrCreateGlobalConfig } from "@/lib/data";

export default async function LoginPage() {
  const [users, config] = await Promise.all([getLoginUsers(), getOrCreateGlobalConfig()]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/20 via-white to-brand-secondary/20 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-brand-primary to-brand-secondary p-8 text-white">
          <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 right-0 h-36 w-36 rounded-full bg-brand-accent/40" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Engineering Lab Support</p>
          <h1 className="mt-3 text-3xl font-black leading-tight">{config.theme.schoolName}</h1>
          <p className="mt-4 max-w-xl text-white/90">
            Keep labs moving with Start Here instructions, guided troubleshooting, personalized next steps, and live teacher intervention alerts.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <FlaskConical className="mb-2 h-5 w-5" />
              <p className="text-sm font-semibold">Lab Clarity</p>
              <p className="text-xs text-white/80">Missed directions recap + step flow</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <Wrench className="mb-2 h-5 w-5" />
              <p className="text-sm font-semibold">Troubleshooting Coach</p>
              <p className="text-xs text-white/80">AI + rule-based diagnostics</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <Lightbulb className="mb-2 h-5 w-5" />
              <p className="text-sm font-semibold">Teacher Visibility</p>
              <p className="text-xs text-white/80">Live stuck/waiting alerts</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center">
            <LoginForm users={users} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/presentation" className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white">
              Open Presentation Mode
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Open Demo Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
