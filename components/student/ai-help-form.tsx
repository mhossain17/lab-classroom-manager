"use client";

import { useActionState } from "react";
import { requestAiHelpAction, type AiHelpState } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: AiHelpState = {
  ok: false
};

type AiHelpFormProps = {
  labId: string;
  steps: Array<{ id: string; order: number; title: string }>;
  selectedStepId?: string | null;
};

export function AiHelpForm({ labId, steps, selectedStepId }: AiHelpFormProps) {
  const [state, action, isPending] = useActionState(requestAiHelpAction, initialState);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <input type="hidden" name="labId" value={labId} />

        <div>
          <Label htmlFor="labStepId">What step are you on?</Label>
          <Select name="labStepId" id="labStepId" defaultValue={selectedStepId ?? ""}>
            <option value="">Not sure</option>
            {steps.map((step) => (
              <option key={step.id} value={step.id}>
                Step {step.order}: {step.title}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="issueSummary">What problem are you seeing?</Label>
          <Textarea
            id="issueSummary"
            name="issueSummary"
            rows={3}
            required
            placeholder="Example: LED is not turning on even after reconnecting wires"
          />
        </div>

        <div>
          <Label htmlFor="troubleshootingAttempted">What have you already tried?</Label>
          <Textarea
            id="troubleshootingAttempted"
            name="troubleshootingAttempted"
            rows={3}
            required
            placeholder="Example: Checked resistor value, swapped LED, and moved wire to row 12"
          />
        </div>

        <div>
          <Label htmlFor="observedIssue">Any specific observation?</Label>
          <Textarea
            id="observedIssue"
            name="observedIssue"
            rows={2}
            placeholder="Example: Multimeter reads 0V across LED"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="requestTeacher" />
          I still want the teacher notified now
        </label>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Generating guidance..." : "Get AI Troubleshooting Guidance"}
        </Button>
      </form>

      {state.message ? (
        <div
          className={`rounded-xl border p-4 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200"}`}
        >
          {state.message}
        </div>
      ) : null}

      {state.guidance ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Coaching Response</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{state.guidance.summary}</p>
          <div className="rounded-xl bg-brand-primary/10 p-3">
            <p className="text-sm font-semibold text-brand-primary">Next best step</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{state.guidance.nextStep}</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Why: {state.guidance.whyItMakesSense}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Guided questions</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {state.guidance.guidedQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Diagnostics checklist</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {state.guidance.diagnosticsChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confidence {(state.guidance.confidence * 100).toFixed(0)}% {state.guidance.shouldEscalate ? "• Teacher escalation suggested" : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
