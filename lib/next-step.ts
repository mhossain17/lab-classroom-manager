import { ProgressStatus } from "@prisma/client";

export type NextStepRecommendation = {
  headline: string;
  action: string;
  reason: string;
  shouldCallTeacher: boolean;
};

type NextStepInput = {
  status?: ProgressStatus;
  isStuck?: boolean;
  waitingForHelp?: boolean;
  troubleshootingAttempts?: number;
  currentStepOrder?: number;
  totalSteps: number;
};

export function getNextStepRecommendation(input: NextStepInput): NextStepRecommendation {
  if (input.waitingForHelp || input.status === ProgressStatus.WAITING_FOR_HELP) {
    return {
      headline: "Hold position and prepare handoff",
      action: "Keep your setup as-is and list exactly what you measured so the teacher can diagnose quickly.",
      reason: "You already escalated; preserving circuit state speeds intervention.",
      shouldCallTeacher: true
    };
  }

  if (input.status === ProgressStatus.NOT_STARTED || !input.currentStepOrder) {
    return {
      headline: "Start with Step 1",
      action: "Open Start Here, gather materials, and complete the first verification check before wiring.",
      reason: "Strong setup prevents most downstream troubleshooting issues.",
      shouldCallTeacher: false
    };
  }

  if (input.isStuck || input.status === ProgressStatus.STUCK) {
    if ((input.troubleshootingAttempts ?? 0) >= 2) {
      return {
        headline: "Request guided support",
        action: "Use AI Help with exact measured values and the checks you already attempted.",
        reason: "Multiple attempts failed; structured escalation is now the fastest path.",
        shouldCallTeacher: true
      };
    }

    return {
      headline: "Run one focused diagnostic",
      action: "Compare expected vs measured behavior at this step and verify one variable at a time.",
      reason: "Single-variable checks reveal root cause faster than rewiring everything.",
      shouldCallTeacher: false
    };
  }

  if (input.status === ProgressStatus.COMPLETED || input.currentStepOrder >= input.totalSteps) {
    return {
      headline: "Lab complete",
      action: "Document final measured results and submit your summary/reflection.",
      reason: "Completion evidence is needed for grading and intervention history.",
      shouldCallTeacher: false
    };
  }

  return {
    headline: "Advance to next step",
    action: `Move from Step ${input.currentStepOrder} to Step ${Math.min(
      input.currentStepOrder + 1,
      input.totalSteps
    )} once expected behavior is confirmed.`,
    reason: "You are currently progressing as expected.",
    shouldCallTeacher: false
  };
}
