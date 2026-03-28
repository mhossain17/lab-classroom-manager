import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { toggleLabActiveAction } from "@/lib/actions/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherLabs } from "@/lib/data";
import { splitLines } from "@/lib/utils";

export default async function TeacherLabsPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, labs] = await Promise.all([
    getOrCreateGlobalConfig(),
    getTeacherLabs(user.id, user.role === "ADMIN")
  ]);

  return (
    <AppShell
      role="teacher"
      userName={user.name}
      schoolName={theme.schoolName}
      logoUrl={theme.logoUrl}
      isAdmin={user.role === "ADMIN"}
    >
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lab Management</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Publish and update class-ready engineering labs.</p>
        </div>
        <Link href="/teacher/labs/new">
          <Button type="button">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Lab Builder
          </Button>
        </Link>
      </section>

      <section className="space-y-4">
        {labs.length === 0 ? (
          <Card>
            <CardTitle>No labs yet</CardTitle>
            <CardDescription>Create your first lab from the builder.</CardDescription>
          </Card>
        ) : (
          labs.map((lab) => (
            <Card key={lab.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
                    {lab.class.name} • {lab.class.section}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{lab.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{lab.objective}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={lab.isActive ? "success" : "neutral"}>{lab.isActive ? "Active" : "Inactive"}</Badge>
                  <Badge variant="accent">{lab.steps.length} steps</Badge>
                  <Badge variant="neutral">{lab.progressRecords.length} student records</Badge>
                  <form action={toggleLabActiveAction}>
                    <input type="hidden" name="labId" value={lab.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {lab.isActive ? "Archive" : "Activate"}
                    </Button>
                  </form>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
                  <p className="font-semibold text-slate-700 dark:text-slate-100">Materials</p>
                  <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">
                    {splitLines(lab.materials)
                      .slice(0, 4)
                      .map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
                  <p className="font-semibold text-slate-700 dark:text-slate-100">First 3 steps</p>
                  <ol className="mt-1 list-decimal pl-5 text-slate-600 dark:text-slate-300">
                    {lab.steps.slice(0, 3).map((step) => (
                      <li key={step.id}>
                        {step.title}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </AppShell>
  );
}
