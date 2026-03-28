import { AppShell } from "@/components/layout/app-shell";
import { CreateClassForm } from "@/components/teacher/create-class-form";
import { CsvStudentUploadForm } from "@/components/teacher/csv-student-upload-form";
import { EnrollStudentForm } from "@/components/teacher/enroll-student-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherClasses } from "@/lib/data";

export default async function TeacherClassesPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, classes] = await Promise.all([
    getOrCreateGlobalConfig(),
    getTeacherClasses(user.id, user.role === "ADMIN")
  ]);

  return (
    <AppShell
      role="teacher"
      userName={user.name}
      schoolName={theme.schoolName}
      logoUrl={theme.logoUrl}
      isAdmin={user.role === "ADMIN"}
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Class Management</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Create sections, track roster, and connect labs to each class.
          </p>
        </div>
        <CreateClassForm />
      </section>

      <section className="space-y-4">
        {classes.length === 0 ? (
          <Card>
            <CardTitle>No classes yet</CardTitle>
            <CardDescription>Create your first section to begin publishing labs.</CardDescription>
          </Card>
        ) : (
          classes.map((classroom) => (
            <Card key={classroom.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{classroom.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {classroom.courseCode} • Section {classroom.section}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="accent">{classroom.enrollments.length} students</Badge>
                  <Badge variant="neutral">{classroom.labs.length} labs</Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Enrolled students</p>
                  <div className="mt-2 space-y-2">
                    {classroom.enrollments.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No students enrolled yet.</p>
                    ) : (
                      classroom.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{enrollment.student.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {enrollment.student.studentId ? `ID: ${enrollment.student.studentId} • ` : ""}
                            {enrollment.student.email ?? enrollment.student.username}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <EnrollStudentForm classId={classroom.id} />
                  <CsvStudentUploadForm classId={classroom.id} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Attached labs</p>
                  <div className="mt-2 space-y-2">
                    {classroom.labs.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No labs attached yet.</p>
                    ) : (
                      classroom.labs.map((lab) => (
                        <div key={lab.id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{lab.title}</p>
                          <p className="text-slate-600 dark:text-slate-300">{lab.steps.length} steps</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </AppShell>
  );
}
