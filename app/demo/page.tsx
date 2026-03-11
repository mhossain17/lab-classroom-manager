import Link from "next/link";
import { ActivityType, UserRole } from "@prisma/client";
import { quickLoginAsAction } from "@/lib/actions/index";
import { getOrCreateGlobalConfig } from "@/lib/data";
import { prisma } from "@/lib/prisma";

async function getDemoSnapshot() {
  const [users, classCount, labCount, openHelpCount, openAlertCount, progressCounts, recentActivity] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    }),
    prisma.class.count(),
    prisma.lab.count(),
    prisma.helpRequest.count({ where: { resolved: false } }),
    prisma.teacherAlert.count({ where: { isActive: true } }),
    prisma.studentLabProgress.groupBy({
      by: ["status"],
      _count: {
        status: true
      }
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const students = users.filter((user) => user.role === UserRole.STUDENT);
  const teachers = users.filter((user) => user.role !== UserRole.STUDENT);

  return {
    users,
    students,
    teachers,
    classCount,
    labCount,
    openHelpCount,
    openAlertCount,
    progressCounts,
    recentActivity
  };
}

const activityLabels: Record<ActivityType, string> = {
  VIEWED_LAB: "Viewed lab",
  UPDATED_PROGRESS: "Updated progress",
  SUBMITTED_HELP_REQUEST: "Submitted help request",
  RECEIVED_AI_GUIDANCE: "Received AI guidance",
  RESOLVED_HELP_REQUEST: "Resolved help request"
};

export default async function DemoPage() {
  const [{ theme }, snapshot] = await Promise.all([getOrCreateGlobalConfig(), getDemoSnapshot()]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-white to-brand-secondary/10 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Demo Control Center</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{theme.schoolName}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Use this page to quickly switch roles and smoke-test student, AI, and teacher workflows.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/login" className="rounded-lg bg-brand-primary px-3 py-2 font-semibold text-white">
              Open Standard Login
            </Link>
            <Link href="/student" className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Student Dashboard
            </Link>
            <Link href="/teacher" className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Teacher Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Users</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.users.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Classes</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.classCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Labs</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.labCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Open Help</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.openHelpCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active Alerts</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.openAlertCount}</p>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Login: Teacher/Admin</h2>
            <div className="space-y-3">
              {snapshot.teachers.map((user) => (
                <form key={user.id} action={quickLoginAsAction} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      @{user.username} • {user.role.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      name="redirectTo"
                      value="/teacher"
                      className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
                    >
                      Open Teacher Dashboard
                    </button>
                    <button
                      type="submit"
                      name="redirectTo"
                      value="/teacher/settings"
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Open Settings
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Login: Students</h2>
            <div className="space-y-3">
              {snapshot.students.map((user) => (
                <form key={user.id} action={quickLoginAsAction} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      name="redirectTo"
                      value="/student"
                      className="rounded-lg bg-brand-secondary px-3 py-2 text-sm font-semibold text-white"
                    >
                      Open Student Dashboard
                    </button>
                    <button
                      type="submit"
                      name="redirectTo"
                      value="/student/progress"
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Open My Progress
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feature Smoke Test Checklist</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
              <li>Login as a student and open a lab from the dashboard.</li>
              <li>Open Start Here and verify recap/objective/materials render.</li>
              <li>Update progress (step + status) and save.</li>
              <li>Open AI Help, submit an issue, and verify guidance response.</li>
              <li>Check "My Progress" reflects stuck/waiting status changes.</li>
              <li>Login as teacher and verify the student appears in monitoring.</li>
              <li>Open teacher dashboard and confirm queue + bottleneck + alerts update.</li>
              <li>Resolve a help request and confirm status clears in student view.</li>
              <li>Open settings and change colors/school name to test branding propagation.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Progress Status Snapshot</h2>
            <div className="mt-3 space-y-2 text-sm">
              {snapshot.progressCounts.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-300">No student progress rows yet.</p>
              ) : (
                snapshot.progressCounts.map((row) => (
                  <div key={row.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{row.status.replaceAll("_", " ")}</span>
                    <span className="text-slate-600 dark:text-slate-300">{row._count.status}</span>
                  </div>
                ))
              )}
            </div>

            <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="mt-2 space-y-2">
              {snapshot.recentActivity.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{item.user.name}</p>
                  <p className="text-slate-600 dark:text-slate-300">{activityLabels[item.type]}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
