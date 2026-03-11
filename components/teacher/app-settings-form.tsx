"use client";

import { SchoolSettings } from "@prisma/client";
import { useActionState } from "react";
import { updateSchoolSettingsAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial = { ok: false, message: "" };

export function AppSettingsForm({ settings }: { settings: SchoolSettings }) {
  const [state, action, pending] = useActionState(updateSchoolSettingsAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">App Settings</h3>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="aiEnabled" defaultChecked={settings.aiEnabled} />
          AI support enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="fallbackModeEnabled" defaultChecked={settings.fallbackModeEnabled} />
          Rule-based fallback enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="teacherAlertsEnabled" defaultChecked={settings.teacherAlertsEnabled} />
          Teacher alerts enabled
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="repeatedStuckThreshold">Repeated stuck threshold</Label>
          <Input id="repeatedStuckThreshold" name="repeatedStuckThreshold" type="number" defaultValue={settings.repeatedStuckThreshold} min={1} />
        </div>
        <div>
          <Label htmlFor="waitingMinutesThreshold">Waiting minutes threshold</Label>
          <Input id="waitingMinutesThreshold" name="waitingMinutesThreshold" type="number" defaultValue={settings.waitingMinutesThreshold} min={1} />
        </div>
        <div>
          <Label htmlFor="lowConfidenceThreshold">Low confidence threshold (0-1)</Label>
          <Input
            id="lowConfidenceThreshold"
            name="lowConfidenceThreshold"
            type="number"
            step="0.01"
            min={0}
            max={1}
            defaultValue={settings.lowConfidenceThreshold}
          />
        </div>
        <div>
          <Label htmlFor="classWideBottleneckThreshold">Class-wide bottleneck threshold</Label>
          <Input
            id="classWideBottleneckThreshold"
            name="classWideBottleneckThreshold"
            type="number"
            min={2}
            defaultValue={settings.classWideBottleneckThreshold}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="localCustomizationNotes">Local school customization notes</Label>
        <Textarea id="localCustomizationNotes" name="localCustomizationNotes" defaultValue={settings.localCustomizationNotes ?? ""} rows={3} />
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving settings..." : "Save App Settings"}
      </Button>
    </form>
  );
}
