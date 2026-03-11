import { LabStep } from "@prisma/client";
import { Card } from "@/components/ui/card";

export function StepList({ steps, currentStepId }: { steps: LabStep[]; currentStepId?: string | null }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const active = step.id === currentStepId;

        return (
          <Card key={step.id} className={active ? "border-brand-primary ring-2 ring-brand-secondary/30" : ""}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Step {step.order}</p>
              {active ? <span className="rounded-full bg-brand-primary px-2 py-1 text-xs font-semibold text-white">Current</span> : null}
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">{step.title}</h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Expected result</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{step.expectedResult}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="font-semibold text-amber-700 dark:text-amber-200">Common problems</p>
                <p className="mt-1 text-amber-700/90 dark:text-amber-100">{step.commonProblems}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
