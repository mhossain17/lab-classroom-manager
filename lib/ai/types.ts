export type GuidanceInput = {
  labTitle: string;
  stepTitle?: string | null;
  stepOrder?: number | null;
  issueSummary: string;
  troubleshootingAttempted: string;
  observedIssue?: string;
  expectedResult?: string;
  priorAttempts?: number;
};

export type GuidanceOutput = {
  summary: string;
  nextStep: string;
  whyItMakesSense: string;
  guidedQuestions: string[];
  diagnosticsChecklist: string[];
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
};
