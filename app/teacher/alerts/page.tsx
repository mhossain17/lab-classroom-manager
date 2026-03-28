import { AppShell } from "@/components/layout/app-shell";
import { AlertsList } from "@/components/teacher/alerts-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherAlertsData } from "@/lib/data";

export default async function TeacherAlertsPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, alerts] = await Promise.all([
    getOrCreateGlobalConfig(),
    getTeacherAlertsData(user.id, user.role === "ADMIN")
  ]);

  const active = alerts.filter((alert) => alert.isActive);
  const resolved = alerts.filter((alert) => !alert.isActive);

  return (
    <AppShell
      role="teacher"
      userName={user.name}
      schoolName={theme.schoolName}
      logoUrl={theme.logoUrl}
      isAdmin={user.role === "ADMIN"}
    >
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Intervention Alerts</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Prioritize support based on repeated friction and class-wide patterns.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="danger">{active.length} Active</Badge>
          <Badge variant="neutral">{resolved.length} Resolved</Badge>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Dismiss or resolve after intervention.</CardDescription>
          <div className="mt-4">
            <AlertsList alerts={active} />
          </div>
        </Card>

        <Card>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>Most recent resolved or inactive alerts.</CardDescription>
          <div className="mt-4 space-y-2">
            {resolved.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No resolved alerts yet.</p>
            ) : (
              resolved.slice(0, 20).map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{alert.title}</p>
                  <p className="text-slate-600 dark:text-slate-300">{alert.message}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
