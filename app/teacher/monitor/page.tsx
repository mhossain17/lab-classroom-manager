import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherMonitoringData } from "@/lib/data";
import { minutesSince } from "@/lib/utils";

export default async function TeacherMonitoringPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, rows] = await Promise.all([getOrCreateGlobalConfig(), getTeacherMonitoringData(user.id)]);

  return (
    <AppShell role="teacher" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Monitoring</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Live student-by-student view for intervention timing and bottleneck detection.
        </p>
      </section>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Student</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Class / Lab</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Current Step</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Attempts</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const waitingMinutes = minutesSince(row.lastUpdated);
              return (
                <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{row.student.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.lab.class.name} ({row.lab.class.section})
                    <div className="text-xs text-slate-500 dark:text-slate-400">{row.lab.title}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.currentStep ? `Step ${row.currentStep.order}: ${row.currentStep.title}` : "Not selected"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusPill status={row.status} />
                      {row.waitingForHelp && waitingMinutes > 8 ? <Badge variant="danger">Wait {waitingMinutes}m</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.troubleshootingAttempts}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(row.lastUpdated).toLocaleString()}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">
                  No progress rows yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
