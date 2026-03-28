"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Download, FileText, LifeBuoy, LineChart } from "lucide-react";
import { quickLoginAsAction } from "@/lib/actions/index";
import type { PresentationSnapshot } from "@/lib/data";

type PresentationDeckProps = {
  schoolName: string;
  snapshot: PresentationSnapshot;
};

type TeacherWidgetTab = "queue" | "alerts" | "activity";
type BuildWidgetTab = "labBuilder" | "packetBuilder" | "classCsv" | "settings" | "adminUsers";
type ArchitectureStep = "studentUpdate" | "aiGuidance" | "alerts" | "teacherAction" | "statusClear";

const sectionMeta = [
  { id: "problem", label: "1. Problem + Promise" },
  { id: "snapshot", label: "2. Live Snapshot" },
  { id: "student-flow", label: "3. Student Flow" },
  { id: "teacher-flow", label: "4. Teacher Flow" },
  { id: "build-admin", label: "5. Build + Admin" },
  { id: "outcomes", label: "6. Outcomes + Architecture" }
];

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  STARTED: "Started",
  IN_PROGRESS: "In Progress",
  STUCK: "Stuck",
  WAITING_FOR_HELP: "Waiting for Help",
  COMPLETED: "Completed"
};

const activityLabels: Record<string, string> = {
  VIEWED_LAB: "Viewed lab",
  UPDATED_PROGRESS: "Updated progress",
  SUBMITTED_HELP_REQUEST: "Submitted help request",
  RECEIVED_AI_GUIDANCE: "Received AI guidance",
  RESOLVED_HELP_REQUEST: "Resolved help request"
};

const alertTypeLabels: Record<string, string> = {
  WAITING_TOO_LONG: "Waiting Too Long",
  REPEATED_STUCK: "Repeatedly Stuck",
  LOW_CONFIDENCE_AI: "Low Confidence AI",
  BOTTLENECK_STEP: "Class Bottleneck",
  DIRECT_HELP_REQUEST: "Direct Help Request"
};

function LaunchButton({
  userId,
  redirectTo,
  label,
  variant = "primary"
}: {
  userId: string | null;
  redirectTo: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const className =
    variant === "primary"
      ? "rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
      : variant === "secondary"
        ? "rounded-lg bg-brand-secondary px-3 py-2 text-sm font-semibold text-white"
        : "rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200";

  if (!userId) {
    return (
      <button type="button" disabled className={`${className} cursor-not-allowed opacity-50`}>
        {label}
      </button>
    );
  }

  return (
    <form action={quickLoginAsAction}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" name="redirectTo" value={redirectTo} className={className}>
        {label}
      </button>
    </form>
  );
}

export function PresentationDeck({ schoolName, snapshot }: PresentationDeckProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [studentFlowStep, setStudentFlowStep] = useState(0);
  const [teacherTab, setTeacherTab] = useState<TeacherWidgetTab>("queue");
  const [buildTab, setBuildTab] = useState<BuildWidgetTab>("labBuilder");
  const [architectureStep, setArchitectureStep] = useState<ArchitectureStep>("studentUpdate");

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  const studentFlow = useMemo(() => {
    const labId = snapshot.launchTargets.studentLabId;

    return [
      {
        id: "start-here",
        title: "Start Here",
        route: labId ? `/student/labs/${labId}/instructions` : "/student",
        detail:
          "Students reset quickly with objective, first action, recap, mistakes-to-avoid, and step-by-step expectations.",
        icon: Compass
      },
      {
        id: "progress",
        title: "Progress",
        route: "/student/progress",
        detail:
          "Students update current step/status so teacher triage is based on live, honest classroom signals.",
        icon: LineChart
      },
      {
        id: "ai-help",
        title: "AI Help",
        route: labId ? `/student/labs/${labId}/help` : "/student",
        detail:
          "Guided troubleshooting captures issue + attempts, returns next-step coaching, and escalates when needed.",
        icon: LifeBuoy
      },
      {
        id: "report-workspace",
        title: "Report Workspace",
        route: labId ? `/student/labs/${labId}/report` : "/student",
        detail:
          "Students capture thinking logs, datasheet evidence, schematic text, and report sections during the lab.",
        icon: FileText
      },
      {
        id: "download-export",
        title: "Download Export",
        route: labId ? `/student/labs/${labId}/report/download` : "/student",
        detail: "One click exports packet + student work as markdown for grading, LMS upload, or archival.",
        icon: Download
      }
    ];
  }, [snapshot.launchTargets.studentLabId]);

  const teacherTabConfig = useMemo(
    () => ({
      queue: {
        label: "Needs Teacher Now",
        route: "/teacher",
        detail: "Prioritized unresolved help requests with issue context and one-click resolution."
      },
      alerts: {
        label: "Active Alerts",
        route: "/teacher/alerts",
        detail: "Escalations from repeated stuck patterns, direct requests, low confidence, and bottlenecks."
      },
      activity: {
        label: "Monitoring + Activity",
        route: "/teacher/monitor",
        detail: "Student-by-student status timing and recent activity for intervention pacing."
      }
    }),
    []
  );

  const buildTabConfig = useMemo(() => {
    const teacherLabId = snapshot.launchTargets.teacherLabId;

    return {
      labBuilder: {
        title: "Lab Builder",
        route: "/teacher/labs/new",
        launchUserId: snapshot.launchTargets.teacherUserId,
        description:
          "Publish structured labs with Start Here hub, steps, expected results, troubleshooting prompts, and escalation guidance."
      },
      packetBuilder: {
        title: "AI Packet Builder",
        route: teacherLabId ? `/teacher/labs/${teacherLabId}/builder` : "/teacher/labs",
        launchUserId: snapshot.launchTargets.teacherUserId,
        description:
          "Generate standards-aligned packet content, pre-lab prompts, due date, and rubric from teacher narration."
      },
      classCsv: {
        title: "Classes + CSV Enrollment",
        route: "/teacher/classes",
        launchUserId: snapshot.launchTargets.teacherUserId,
        description:
          "Create sections, enroll by username, and bulk import students from CSV with validation and feedback."
      },
      settings: {
        title: "Branding + App Settings",
        route: "/teacher/settings",
        launchUserId: snapshot.launchTargets.teacherUserId,
        description:
          "Customize school identity, theme colors, logo, AI/fallback mode, and intervention thresholds."
      },
      adminUsers: {
        title: "Admin User Tools",
        route: "/teacher/users",
        launchUserId: snapshot.launchTargets.adminUserId,
        description:
          "Create accounts, review roles/identities, and run class-targeted bulk student imports from one admin surface."
      }
    };
  }, [snapshot.launchTargets.adminUserId, snapshot.launchTargets.teacherLabId, snapshot.launchTargets.teacherUserId]);

  const architectureConfig: Record<
    ArchitectureStep,
    {
      title: string;
      detail: string;
      route: string;
      launchUserId: string | null;
    }
  > = {
    studentUpdate: {
      title: "Student updates status",
      detail: "Student marks step, status, and notes in the lab workspace.",
      route: "/student/progress",
      launchUserId: snapshot.launchTargets.studentUserId
    },
    aiGuidance: {
      title: "AI or fallback guidance",
      detail: "App generates structured troubleshooting guidance and escalation confidence.",
      route: snapshot.launchTargets.studentLabId ? `/student/labs/${snapshot.launchTargets.studentLabId}/help` : "/student",
      launchUserId: snapshot.launchTargets.studentUserId
    },
    alerts: {
      title: "Alert rules evaluate",
      detail: "Rules convert risk signals into deduplicated teacher alerts and queue prioritization.",
      route: "/teacher/alerts",
      launchUserId: snapshot.launchTargets.teacherUserId
    },
    teacherAction: {
      title: "Teacher resolves queue",
      detail: "Teacher resolves request and the app clears waiting/stuck state for that student.",
      route: "/teacher",
      launchUserId: snapshot.launchTargets.teacherUserId
    },
    statusClear: {
      title: "Student resumes progress",
      detail: "Student state returns to in-progress and flow continues through report/export.",
      route: "/student/progress",
      launchUserId: snapshot.launchTargets.studentUserId
    }
  };

  function goToSection(index: number) {
    const clampedIndex = Math.max(0, Math.min(sectionMeta.length - 1, index));
    const element = sectionRefs.current[clampedIndex];

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(clampedIndex);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const index = Number(entry.target.getAttribute("data-section-index"));
          if (Number.isNaN(index)) {
            continue;
          }

          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestIndex >= 0) {
          setActiveSection(bestIndex);
        }
      },
      {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: "-10% 0px -35% 0px"
      }
    );

    for (const section of sectionRefs.current) {
      if (section) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goToSection(activeSection + 1);
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goToSection(activeSection - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSection]);

  const currentStudentFlow = studentFlow[studentFlowStep];
  const currentTeacherTab = teacherTabConfig[teacherTab];
  const currentBuildTab = buildTabConfig[buildTab];
  const currentArchitecture = architectureConfig[architectureStep];

  const maxProgressCount = Math.max(1, ...snapshot.progressDistribution.map((item) => item.count));
  const waitingCount = snapshot.progressDistribution.find((item) => item.status === "WAITING_FOR_HELP")?.count ?? 0;
  const stuckCount = snapshot.progressDistribution.find((item) => item.status === "STUCK")?.count ?? 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-6 xl:h-fit">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Presenter Controls</p>
          <h1 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{schoolName}</h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Use arrow keys or buttons for section navigation.
          </p>

          <div className="mt-4 space-y-2">
            {sectionMeta.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => goToSection(index)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                  activeSection === index
                    ? "bg-brand-primary text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => goToSection(activeSection - 1)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => goToSection(activeSection + 1)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="space-y-5">
        <section
          id="problem"
          ref={(element) => {
            sectionRefs.current[0] = element;
          }}
          data-section-index={0}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">1. Classroom Problem + Product Promise</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Keep Labs Moving Without Constant Re-Explaining</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This application supports independent student progress, targeted AI diagnostics, and faster teacher intervention with live visibility.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Classroom pain points</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                <li>Repeated instructions consume teacher time.</li>
                <li>Students struggle to identify the true next step.</li>
                <li>Intervention arrives late without real-time signals.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-brand-primary/10 p-4">
              <p className="text-sm font-semibold text-brand-primary">What this demo proves</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                <li>Student workflow can run independently from Start Here to report export.</li>
                <li>AI support escalates intelligently instead of replacing teacher judgment.</li>
                <li>Teacher dashboard surfaces queue, bottlenecks, and alerts in one place.</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <LaunchButton userId={snapshot.launchTargets.studentUserId} redirectTo="/student" label="Open Student Dashboard" />
            <LaunchButton userId={snapshot.launchTargets.teacherUserId} redirectTo="/teacher" label="Open Teacher Dashboard" variant="secondary" />
            <LaunchButton userId={snapshot.launchTargets.adminUserId} redirectTo="/teacher/users" label="Open Admin Tools" variant="ghost" />
            <Link href="/demo" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Open Demo Control Center
            </Link>
          </div>
        </section>

        <section
          id="snapshot"
          ref={(element) => {
            sectionRefs.current[1] = element;
          }}
          data-section-index={1}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">2. Live Classroom Snapshot</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.totals.users}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Classes</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.totals.classes}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Labs</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.totals.labs}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Open Help</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.totals.openHelp}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active Alerts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{snapshot.totals.activeAlerts}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status Distribution</p>
              <div className="mt-3 space-y-2">
                {snapshot.progressDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>{statusLabels[item.status] ?? item.status}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-brand-primary"
                        style={{ width: `${(item.count / maxProgressCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Activity</p>
              <div className="mt-3 space-y-2">
                {snapshot.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">No activity yet.</p>
                ) : (
                  snapshot.recentActivity.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{item.userName}</p>
                      <p className="text-slate-600 dark:text-slate-300">{activityLabels[item.type] ?? item.type}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/demo" className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white">
              Open Live Snapshot in Demo Center
            </Link>
          </div>
        </section>

        <section
          id="student-flow"
          ref={(element) => {
            sectionRefs.current[2] = element;
          }}
          data-section-index={2}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">3. Student Workflow in Action</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Click each stage to show how a student moves from direction reset to report export.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-1">
              {studentFlow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setStudentFlowStep(index)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm ${
                      studentFlowStep === index
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold">{step.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentStudentFlow.title}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{currentStudentFlow.detail}</p>
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-mono text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {currentStudentFlow.route}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LaunchButton
                  userId={snapshot.launchTargets.studentUserId}
                  redirectTo={currentStudentFlow.route}
                  label={`Open ${currentStudentFlow.title} Live`}
                />
              </div>
              {!snapshot.launchTargets.studentUserId ? (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  No student account found for launch. Add a student account to enable one-click live flow.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section
          id="teacher-flow"
          ref={(element) => {
            sectionRefs.current[3] = element;
          }}
          data-section-index={3}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">4. Teacher Intervention Workflow</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(teacherTabConfig) as TeacherWidgetTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTeacherTab(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  teacherTab === tab
                    ? "bg-brand-primary text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {teacherTabConfig[tab].label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              {teacherTab === "queue" ? (
                snapshot.needsTeacherNow.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    No active requests in the queue.
                  </p>
                ) : (
                  snapshot.needsTeacherNow.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.studentName}</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {item.className} ({item.section}) • {item.labTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.stepLabel}</p>
                      <p className="mt-1 text-slate-700 dark:text-slate-200">{item.issueSummary}</p>
                    </div>
                  ))
                )
              ) : null}

              {teacherTab === "alerts" ? (
                snapshot.activeAlerts.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    No active alerts.
                  </p>
                ) : (
                  snapshot.activeAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">{alert.message}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {alert.severity} • {alertTypeLabels[alert.type] ?? alert.type}
                      </p>
                    </div>
                  ))
                )
              ) : null}

              {teacherTab === "activity" ? (
                snapshot.recentActivity.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    No activity rows yet.
                  </p>
                ) : (
                  snapshot.recentActivity.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.userName}</p>
                      <p className="text-slate-600 dark:text-slate-300">{activityLabels[item.type] ?? item.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )
              ) : null}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentTeacherTab.label}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{currentTeacherTab.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LaunchButton
                  userId={snapshot.launchTargets.teacherUserId}
                  redirectTo={currentTeacherTab.route}
                  label={`Open ${currentTeacherTab.label} Live`}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="build-admin"
          ref={(element) => {
            sectionRefs.current[4] = element;
          }}
          data-section-index={4}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">5. Build + Admin Feature Showcase</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(buildTabConfig) as BuildWidgetTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setBuildTab(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  buildTab === tab
                    ? "bg-brand-secondary text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {buildTabConfig[tab].title}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{currentBuildTab.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{currentBuildTab.description}</p>
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-mono text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {currentBuildTab.route}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <LaunchButton
                userId={currentBuildTab.launchUserId}
                redirectTo={currentBuildTab.route}
                label={`Open ${currentBuildTab.title} Live`}
                variant="secondary"
              />
            </div>
          </div>
        </section>

        <section
          id="outcomes"
          ref={(element) => {
            sectionRefs.current[5] = element;
          }}
          data-section-index={5}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">6. Outcomes + Architecture Flow</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">Support Load</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-100">{snapshot.needsTeacherNow.length}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-200">Students currently queued for live intervention</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">Potential Friction</p>
              <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-100">{stuckCount + waitingCount}</p>
              <p className="text-xs text-amber-700 dark:text-amber-200">Stuck + waiting statuses detected</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-4 dark:bg-sky-900/20">
              <p className="text-xs uppercase tracking-[0.14em] text-sky-700 dark:text-sky-200">Active Visibility</p>
              <p className="mt-1 text-2xl font-bold text-sky-800 dark:text-sky-100">{snapshot.totals.activeAlerts}</p>
              <p className="text-xs text-sky-700 dark:text-sky-200">Escalation alerts currently shown to teacher</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Architecture Walkthrough (Interactive)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(architectureConfig) as ArchitectureStep[]).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setArchitectureStep(step)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    architectureStep === step
                      ? "bg-brand-primary text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {architectureConfig[step].title}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentArchitecture.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{currentArchitecture.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LaunchButton
                  userId={currentArchitecture.launchUserId}
                  redirectTo={currentArchitecture.route}
                  label="Open Live Step"
                />
                <Link href="/demo" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Return to Demo Control Center
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
