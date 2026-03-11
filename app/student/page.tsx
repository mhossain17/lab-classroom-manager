import Link from "next/link";
import { BookOpen, LifeBuoy, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentDashboardData } from "@/lib/data";

export default async function StudentDashboardPage() {
  const user = await requireRole(["STUDENT"]);
  const [{ theme }, enrollments] = await Promise.all([getOrCreateGlobalConfig(), getStudentDashboardData(user.id)]);

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Today</p>
          <CardTitle className="mt-1">Independent Lab Flow</CardTitle>
          <CardDescription>Open your active lab, check Start Here, update progress, and request help only when needed.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Need help quickly?</CardTitle>
          <CardDescription>
            Use AI troubleshooting first to reduce wait time and get step-by-step diagnostics.
          </CardDescription>
          <Link href="/student/progress" className="mt-4 inline-block text-sm font-semibold text-brand-primary">
            View my full progress
          </Link>
        </Card>
        <Card>
          <CardTitle>Class expectation</CardTitle>
          <CardDescription>
            Record where you are honestly. Teacher interventions are prioritized from this dashboard.
          </CardDescription>
        </Card>
      </section>

      <section className="space-y-5">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{enrollment.class.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {enrollment.class.courseCode} • Section {enrollment.class.section}
                </p>
              </div>
              <Badge variant="accent">{enrollment.class.labs.length} Active Labs</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {enrollment.class.labs.map((lab) => {
                const progress = lab.progressRecords[0];
                const currentStep = progress?.currentStep;

                return (
                  <Card key={lab.id} className="border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Lab</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{lab.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lab.objective}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusPill status={progress?.status ?? "NOT_STARTED"} />
                      {currentStep ? (
                        <Badge variant="neutral">
                          Step {currentStep.order}: {currentStep.title}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Choose a step to start</Badge>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <Link href={`/student/labs/${lab.id}`}>
                        <Button type="button" className="w-full" size="sm">
                          <PlayCircle className="mr-1 h-4 w-4" />
                          Open Lab
                        </Button>
                      </Link>
                      <Link href={`/student/labs/${lab.id}/instructions`}>
                        <Button type="button" variant="ghost" className="w-full" size="sm">
                          <BookOpen className="mr-1 h-4 w-4" />
                          Start Here
                        </Button>
                      </Link>
                      <Link href={`/student/labs/${lab.id}/help`}>
                        <Button type="button" variant="secondary" className="w-full" size="sm">
                          <LifeBuoy className="mr-1 h-4 w-4" />
                          Get Help
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        ))}

        {enrollments.length === 0 ? (
          <Card>
            <CardTitle>No classes found</CardTitle>
            <CardDescription>
              You are not enrolled in a class yet. Ask your teacher to add your account to the correct section.
            </CardDescription>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}
