import { ProgressStatus } from "@prisma/client";
import { updateStudentProgressAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StepOption = {
  id: string;
  order: number;
  title: string;
};

type ProgressUpdateFormProps = {
  labId: string;
  stepOptions: StepOption[];
  currentStepId?: string | null;
  status?: ProgressStatus;
  isStuck?: boolean;
  waitingForHelp?: boolean;
  notes?: string | null;
};

const statuses: ProgressStatus[] = [
  ProgressStatus.NOT_STARTED,
  ProgressStatus.STARTED,
  ProgressStatus.IN_PROGRESS,
  ProgressStatus.STUCK,
  ProgressStatus.WAITING_FOR_HELP,
  ProgressStatus.COMPLETED
];

export function ProgressUpdateForm({
  labId,
  stepOptions,
  currentStepId,
  status,
  isStuck,
  waitingForHelp,
  notes
}: ProgressUpdateFormProps) {
  return (
    <form action={updateStudentProgressAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <input type="hidden" name="labId" value={labId} />
      <div>
        <Label htmlFor="currentStepId">Current Step</Label>
        <Select id="currentStepId" name="currentStepId" defaultValue={currentStepId ?? ""}>
          <option value="">Choose step</option>
          {stepOptions.map((step) => (
            <option key={step.id} value={step.id}>
              Step {step.order}: {step.title}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={status ?? ProgressStatus.STARTED}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="isStuck" defaultChecked={Boolean(isStuck)} />
          I am currently stuck
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="waitingForHelp" defaultChecked={Boolean(waitingForHelp)} />
          Waiting for teacher
        </label>
      </div>

      <div>
        <Label htmlFor="notes">Quick Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={notes ?? ""} rows={3} placeholder="What did you try? What happened?" />
      </div>

      <Button type="submit" className="w-full">
        Save Progress
      </Button>
    </form>
  );
}
