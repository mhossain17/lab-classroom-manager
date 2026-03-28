"use client";

import { LabPacket } from "@prisma/client";
import { useActionState } from "react";
import { generateLabPacketAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const initial = { ok: false, message: "" };

export function LabPacketBuilderForm({
  labId,
  existingPacket
}: {
  labId: string;
  existingPacket: LabPacket | null;
}) {
  const [state, action, pending] = useActionState(generateLabPacketAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <input type="hidden" name="labId" value={labId} />

      <div>
        <Label htmlFor="narration">Teacher Narration / Planning Notes</Label>
        <Textarea
          id="narration"
          name="narration"
          rows={8}
          required
          defaultValue={existingPacket?.sourceNarration ?? ""}
          placeholder="Describe what you want students to build, test, troubleshoot, and explain in their report."
        />
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={existingPacket?.dueDate ? new Date(existingPacket.dueDate).toISOString().slice(0, 10) : ""}
        />
      </div>

      {state.message ? (
        <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Generating packet..." : "Generate / Refresh AI Lab Packet"}
      </Button>
    </form>
  );
}
