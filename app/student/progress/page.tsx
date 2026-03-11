import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentProgressRows } from "@/lib/data";

export default async function StudentProgressPage() {
  const user = await requireRole(["STUDENT"]);
  const [{ theme }, progressRows] = await Promise.all([getOrCreateGlobalConfig(), getStudentProgressRows(user.id)]);

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Lab Progress</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Track pacing across all classes and identify your next action quickly.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Completed</CardTitle>
          <CardDescription>{progressRows.filter((row) => row.status === "COMPLETED").length} labs</CardDescription>
        </Card>
        <Card>
          <CardTitle>In Progress</CardTitle>
          <CardDescription>
            {progressRows.filter((row) => row.status === "IN_PROGRESS" || row.status === "STARTED").length} labs
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Need Attention</CardTitle>
          <CardDescription>
            {progressRows.filter((row) => row.isStuck || row.waitingForHelp || row.status === "STUCK").length} labs
          </CardDescription>
        </Card>
      </section>

      <section className="mt-5 space-y-3">
        {progressRows.length === 0 ? (
          <Card>
            <CardTitle>No progress records yet</CardTitle>
            <CardDescription>Open a lab from your dashboard and save your first status update.</CardDescription>
          </Card>
        ) : (
          progressRows.map((row) => (
            <Card key={row.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
                  {row.lab.class.name} • {row.lab.class.section}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.lab.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {row.currentStep ? `Step ${row.currentStep.order}: ${row.currentStep.title}` : "No step selected"}
                </p>
                {row.notes ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Notes: {row.notes}</p> : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusPill status={row.status} />
                {row.waitingForHelp ? <Badge variant="danger">Waiting for teacher</Badge> : null}
                <Link href={`/student/labs/${row.labId}`} className="text-sm font-semibold text-brand-primary">
                  Open lab
                </Link>
              </div>
            </Card>
          ))
        )}
      </section>
    </AppShell>
  );
}
