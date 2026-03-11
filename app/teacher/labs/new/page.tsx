import { AppShell } from "@/components/layout/app-shell";
import { LabBuilderForm } from "@/components/teacher/lab-builder-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherClasses } from "@/lib/data";

export default async function NewLabPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, classes] = await Promise.all([getOrCreateGlobalConfig(), getTeacherClasses(user.id)]);

  return (
    <AppShell role="teacher" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lab Builder</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Build classroom-ready labs with structured steps, troubleshooting prompts, and escalation guidance.
        </p>
      </section>

      {classes.length === 0 ? (
        <Card>
          <CardTitle>Create a class first</CardTitle>
          <CardDescription>You need at least one class before publishing a lab.</CardDescription>
        </Card>
      ) : (
        <LabBuilderForm
          classes={classes.map((item) => ({
            id: item.id,
            name: item.name,
            section: item.section,
            courseCode: item.courseCode
          }))}
        />
      )}
    </AppShell>
  );
}
