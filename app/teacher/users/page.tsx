import { AppShell } from "@/components/layout/app-shell";
import { CreateUserForm } from "@/components/teacher/create-user-form";
import { CsvStudentUploadForm } from "@/components/teacher/csv-student-upload-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminUserManagementData, getOrCreateGlobalConfig } from "@/lib/data";

export default async function AdminUserManagementPage() {
  const user = await requireRole(["ADMIN"]);
  const [{ theme }, data] = await Promise.all([getOrCreateGlobalConfig(), getAdminUserManagementData()]);

  return (
    <AppShell role="teacher" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl} isAdmin>
      <section className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Admin tools for creating accounts and bulk-importing students from CSV into classes.
        </p>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Students</CardTitle>
          <CardDescription>{data.totals.students} total accounts</CardDescription>
        </Card>
        <Card>
          <CardTitle>Teachers</CardTitle>
          <CardDescription>{data.totals.teachers} total accounts</CardDescription>
        </Card>
        <Card>
          <CardTitle>Admins</CardTitle>
          <CardDescription>{data.totals.admins} total accounts</CardDescription>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <CreateUserForm />

        <Card>
          <CardTitle>Bulk Student Import (CSV)</CardTitle>
          <CardDescription>
            Import student ID, first name, last name, and e-mail into a selected class.
          </CardDescription>
          <CsvStudentUploadForm
            classOptions={data.classes.map((item) => ({
              id: item.id,
              name: item.name,
              section: item.section,
              courseCode: item.courseCode
            }))}
          />
        </Card>
      </section>

      <section className="mt-5">
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Student ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Class Enrollments</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((managedUser) => (
                <tr key={managedUser.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{managedUser.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={managedUser.role === "STUDENT" ? "accent" : managedUser.role === "TEACHER" ? "neutral" : "warning"}>
                      {managedUser.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{managedUser.studentId ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{managedUser.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{managedUser.username}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{managedUser.enrollments.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </AppShell>
  );
}
