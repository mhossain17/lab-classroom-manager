import { AppShell } from "@/components/layout/app-shell";
import { AppSettingsForm } from "@/components/teacher/app-settings-form";
import { ThemeSettingsForm } from "@/components/teacher/theme-settings-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherSettingsData } from "@/lib/data";

export default async function TeacherSettingsPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const [{ theme }, settingsData] = await Promise.all([getOrCreateGlobalConfig(), getTeacherSettingsData(user.id)]);

  if (!settingsData?.settings || !settingsData.theme) {
    return (
      <AppShell role="teacher" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
        <Card>
          <CardTitle>Settings unavailable</CardTitle>
          <CardDescription>Could not load settings for this account.</CardDescription>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell role="teacher" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Branding & Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Customize school identity, AI behavior, and alert thresholds.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ThemeSettingsForm theme={settingsData.theme} />
        <AppSettingsForm settings={settingsData.settings} />
      </section>
    </AppShell>
  );
}
