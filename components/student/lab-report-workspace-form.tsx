"use client";

import { StudentLabWork } from "@prisma/client";
import { useActionState } from "react";
import { saveStudentLabWorkAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial = { ok: false, message: "" };

export function LabReportWorkspaceForm({
  labId,
  existingWork
}: {
  labId: string;
  existingWork: StudentLabWork | null;
}) {
  const [state, action, pending] = useActionState(saveStudentLabWorkAction, initial);

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <input type="hidden" name="labId" value={labId} />

      <div>
        <Label htmlFor="preLabResponses">Pre-Lab Responses</Label>
        <Textarea
          id="preLabResponses"
          name="preLabResponses"
          rows={4}
          defaultValue={existingWork?.preLabResponses ?? ""}
          placeholder="Answer pre-lab preparation questions here."
        />
      </div>

      <div>
        <Label htmlFor="procedureThinkingLog">In-Procedure Thinking Log</Label>
        <Textarea
          id="procedureThinkingLog"
          name="procedureThinkingLog"
          rows={6}
          defaultValue={existingWork?.procedureThinkingLog ?? ""}
          placeholder="Capture your thinking while completing each procedure step."
        />
      </div>

      <div>
        <Label htmlFor="equipmentDataEntries">Equipment Data + Measurement Table</Label>
        <Textarea
          id="equipmentDataEntries"
          name="equipmentDataEntries"
          rows={6}
          defaultValue={existingWork?.equipmentDataEntries ?? ""}
          placeholder="List datasheet values, expected vs measured values, and notes."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label htmlFor="schematicComponents">Schematic Components (one per line: id,label)</Label>
          <Textarea
            id="schematicComponents"
            name="schematicComponents"
            rows={5}
            defaultValue={existingWork?.schematicComponents ?? ""}
            placeholder="vcc,VCC\ngnd,GND\nnand1,NAND Gate"
          />
        </div>
        <div>
          <Label htmlFor="schematicConnections">Schematic Connections (one per line: from,to,label)</Label>
          <Textarea
            id="schematicConnections"
            name="schematicConnections"
            rows={5}
            defaultValue={existingWork?.schematicConnections ?? ""}
            placeholder="vcc,nand1,Power\nnand1,gnd,Ground"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reportIntroduction">Introduction</Label>
        <Textarea id="reportIntroduction" name="reportIntroduction" rows={4} defaultValue={existingWork?.reportIntroduction ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportMethodology">Methodology</Label>
        <Textarea id="reportMethodology" name="reportMethodology" rows={4} defaultValue={existingWork?.reportMethodology ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportDatasheetSummary">Lab Datasheet Summary</Label>
        <Textarea
          id="reportDatasheetSummary"
          name="reportDatasheetSummary"
          rows={4}
          defaultValue={existingWork?.reportDatasheetSummary ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="reportResults">Results</Label>
        <Textarea id="reportResults" name="reportResults" rows={4} defaultValue={existingWork?.reportResults ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportDiscussion">Discussion</Label>
        <Textarea id="reportDiscussion" name="reportDiscussion" rows={4} defaultValue={existingWork?.reportDiscussion ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportApplications">Applications</Label>
        <Textarea id="reportApplications" name="reportApplications" rows={4} defaultValue={existingWork?.reportApplications ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportConclusion">Conclusion</Label>
        <Textarea id="reportConclusion" name="reportConclusion" rows={4} defaultValue={existingWork?.reportConclusion ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportQuestions">Questions</Label>
        <Textarea id="reportQuestions" name="reportQuestions" rows={4} defaultValue={existingWork?.reportQuestions ?? ""} />
      </div>

      <div>
        <Label htmlFor="reportReferences">References</Label>
        <Textarea id="reportReferences" name="reportReferences" rows={4} defaultValue={existingWork?.reportReferences ?? ""} />
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save Lab Report Workspace"}
      </Button>
    </form>
  );
}
