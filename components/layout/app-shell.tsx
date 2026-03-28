import Image from "next/image";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/layout/logout-button";
import { NavMenu } from "@/components/layout/nav-menu";

type AppShellProps = {
  role: "student" | "teacher";
  userName: string;
  schoolName: string;
  logoUrl?: string | null;
  isAdmin?: boolean;
  children: ReactNode;
};

const navByRole = {
  student: [
    { href: "/student", label: "Dashboard" },
    { href: "/student/progress", label: "My Progress" }
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard" },
    { href: "/teacher/classes", label: "Classes" },
    { href: "/teacher/labs", label: "Labs" },
    { href: "/teacher/monitor", label: "Monitoring" },
    { href: "/teacher/alerts", label: "Alerts" },
    { href: "/teacher/settings", label: "Settings" }
  ]
};

export function AppShell({ role, userName, schoolName, logoUrl, isAdmin = false, children }: AppShellProps) {
  const navItems =
    role === "teacher" && isAdmin
      ? [...navByRole.teacher, { href: "/teacher/users", label: "Users" }]
      : navByRole[role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={`${schoolName} logo`} width={38} height={38} className="rounded-md border border-slate-200" />
            ) : (
              <div className="h-9 w-9 rounded-md bg-brand-primary/20" />
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-primary">AI Lab Support</p>
              <h1 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">{schoolName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{userName}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-3 md:px-8">
          <NavMenu items={navItems} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
