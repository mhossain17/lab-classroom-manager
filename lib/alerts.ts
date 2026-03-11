import { AlertSeverity, AlertType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type EscalationContext = {
  teacherId: string;
  classId: string;
  labId: string;
  labStepId?: string | null;
  studentName: string;
  issueSummary: string;
  confidence: number;
  troubleshootingAttempts: number;
  aiEscalationReason?: string;
  directTeacherRequest: boolean;
};

async function createAlertIfNeeded(payload: {
  teacherId: string;
  classId: string;
  labId: string;
  labStepId?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}) {
  // De-duplicate near-identical alerts so the teacher dashboard does not flood.
  const existing = await prisma.teacherAlert.findFirst({
    where: {
      teacherId: payload.teacherId,
      type: payload.type,
      classId: payload.classId,
      labId: payload.labId,
      labStepId: payload.labStepId ?? null,
      isActive: true,
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 20)
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.teacherAlert.create({
    data: {
      teacherId: payload.teacherId,
      classId: payload.classId,
      labId: payload.labId,
      labStepId: payload.labStepId ?? null,
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      message: payload.message
    }
  });
}

export async function raiseAlertsFromHelpRequest(context: EscalationContext) {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: 1 } });
  if (!settings?.teacherAlertsEnabled) {
    return;
  }

  const alertTasks: Promise<unknown>[] = [];

  if (context.directTeacherRequest) {
    alertTasks.push(
      createAlertIfNeeded({
        teacherId: context.teacherId,
        classId: context.classId,
        labId: context.labId,
        labStepId: context.labStepId,
        type: AlertType.DIRECT_HELP_REQUEST,
        severity: AlertSeverity.HIGH,
        title: "Student explicitly requested teacher support",
        message: `${context.studentName} requested teacher intervention: ${context.issueSummary}`
      })
    );
  }

  if (context.troubleshootingAttempts >= settings.repeatedStuckThreshold) {
    alertTasks.push(
      createAlertIfNeeded({
        teacherId: context.teacherId,
        classId: context.classId,
        labId: context.labId,
        labStepId: context.labStepId,
        type: AlertType.REPEATED_STUCK,
        severity: AlertSeverity.HIGH,
        title: "Student repeatedly stuck",
        message: `${context.studentName} has ${context.troubleshootingAttempts} unsuccessful attempts on this lab.`
      })
    );
  }

  if (context.confidence <= settings.lowConfidenceThreshold) {
    alertTasks.push(
      createAlertIfNeeded({
        teacherId: context.teacherId,
        classId: context.classId,
        labId: context.labId,
        labStepId: context.labStepId,
        type: AlertType.LOW_CONFIDENCE_AI,
        severity: AlertSeverity.MEDIUM,
        title: "Low-confidence AI guidance",
        message: `${context.studentName} may need live support (AI confidence ${(context.confidence * 100).toFixed(0)}%).`
      })
    );
  }

  if (context.aiEscalationReason) {
    alertTasks.push(
      createAlertIfNeeded({
        teacherId: context.teacherId,
        classId: context.classId,
        labId: context.labId,
        labStepId: context.labStepId,
        type: AlertType.WAITING_TOO_LONG,
        severity: AlertSeverity.MEDIUM,
        title: "AI recommended escalation",
        message: `${context.studentName}: ${context.aiEscalationReason}`
      })
    );
  }

  if (context.labStepId) {
    const stuckCount = await prisma.studentLabProgress.count({
      where: {
        labId: context.labId,
        currentStepId: context.labStepId,
        OR: [{ isStuck: true }, { status: "WAITING_FOR_HELP" }, { status: "STUCK" }]
      }
    });

    if (stuckCount >= settings.classWideBottleneckThreshold) {
      alertTasks.push(
        createAlertIfNeeded({
          teacherId: context.teacherId,
          classId: context.classId,
          labId: context.labId,
          labStepId: context.labStepId,
          type: AlertType.BOTTLENECK_STEP,
          severity: AlertSeverity.HIGH,
          title: "Class-wide bottleneck detected",
          message: `${stuckCount} students are currently stuck on the same step.`
        })
      );
    }
  }

  await Promise.all(alertTasks);
}
