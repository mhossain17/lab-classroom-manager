import type { Metadata } from "next";
import { ReactNode } from "react";
import { getOrCreateGlobalConfig } from "@/lib/data";
import { getThemeCssVars } from "@/lib/theme";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Classroom Manager - Labs",
  description: "AI-assisted lab support and classroom guidance for engineering classrooms"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = await getOrCreateGlobalConfig();

  return (
    <html lang="en" className={theme.darkMode ? "dark" : ""} suppressHydrationWarning>
      <body style={getThemeCssVars(theme)}>{children}</body>
    </html>
  );
}
