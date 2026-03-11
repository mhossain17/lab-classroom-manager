"use client";

import { useActionState } from "react";
import { createLabAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initial = { ok: false, message: "" };

type ClassOption = {
  id: string;
  name: string;
  section: string;
  courseCode: string;
};

export function LabBuilderForm({ classes }: { classes: ClassOption[] }) {
  const [state, action, pending] = useActionState(createLabAction, initial);

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="classId">Class</Label>
          <Select id="classId" name="classId" required>
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.courseCode} - {item.section})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Lab Title</Label>
          <Input id="title" name="title" required placeholder="Series Circuit Resistor Lab" />
        </div>
      </div>

      <div>
        <Label htmlFor="objective">Objective</Label>
        <Textarea id="objective" name="objective" required rows={2} />
      </div>

      <div>
        <Label htmlFor="materials">Materials (one per line)</Label>
        <Textarea id="materials" name="materials" rows={4} placeholder="Breadboard\nResistors (220Ω, 1kΩ)\nLED\nMultimeter" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="startHereContent">Start Here section</Label>
          <Textarea id="startHereContent" name="startHereContent" rows={5} required />
        </div>
        <div>
          <Label htmlFor="openingRecap">Quick recap of teacher instructions</Label>
          <Textarea id="openingRecap" name="openingRecap" rows={5} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="priorKnowledge">Prior knowledge reminders</Label>
          <Textarea id="priorKnowledge" name="priorKnowledge" rows={4} />
        </div>
        <div>
          <Label htmlFor="commonMistakes">Common mistakes</Label>
          <Textarea id="commonMistakes" name="commonMistakes" rows={4} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="whatFirst">What should I do first?</Label>
          <Textarea id="whatFirst" name="whatFirst" rows={3} />
        </div>
        <div>
          <Label htmlFor="completionCriteria">Completion criteria</Label>
          <Textarea id="completionCriteria" name="completionCriteria" rows={3} />
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Step Builder</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">Add up to 8 steps. Leave unused steps blank.</p>

        {Array.from({ length: 8 }, (_, i) => i + 1).map((step) => (
          <div key={step} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm font-semibold text-brand-primary">Step {step}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor={`stepTitle_${step}`}>Title</Label>
                <Input id={`stepTitle_${step}`} name={`stepTitle_${step}`} placeholder="Build power rails" />
              </div>
              <div>
                <Label htmlFor={`stepExpected_${step}`}>Expected result</Label>
                <Input id={`stepExpected_${step}`} name={`stepExpected_${step}`} placeholder="5V measured across rails" />
              </div>
            </div>
            <div>
              <Label htmlFor={`stepDescription_${step}`}>Description</Label>
              <Textarea id={`stepDescription_${step}`} name={`stepDescription_${step}`} rows={2} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor={`stepProblems_${step}`}>Common problems</Label>
                <Textarea id={`stepProblems_${step}`} name={`stepProblems_${step}`} rows={2} />
              </div>
              <div>
                <Label htmlFor={`stepHints_${step}`}>Hints</Label>
                <Textarea id={`stepHints_${step}`} name={`stepHints_${step}`} rows={2} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor={`stepTroubleshoot_${step}`}>Troubleshooting question</Label>
                <Textarea id={`stepTroubleshoot_${step}`} name={`stepTroubleshoot_${step}`} rows={2} />
              </div>
              <div>
                <Label htmlFor={`stepEscalate_${step}`}>Escalation guidance</Label>
                <Textarea id={`stepEscalate_${step}`} name={`stepEscalate_${step}`} rows={2} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Publishing lab..." : "Publish Lab"}
      </Button>
    </form>
  );
}
