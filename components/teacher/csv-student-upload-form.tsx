"use client";

import { useActionState } from "react";
import { importStudentsCsvAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ClassOption = {
  id: string;
  name: string;
  section: string;
  courseCode: string;
};

const initial = { ok: false, message: "" };

type CsvStudentUploadFormProps = {
  classId?: string;
  classOptions?: ClassOption[];
};

export function CsvStudentUploadForm({ classId, classOptions = [] }: CsvStudentUploadFormProps) {
  const [state, action, pending] = useActionState(importStudentsCsvAction, initial);

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
      {!classId ? (
        <div>
          <Label htmlFor="classId">Class</Label>
          <Select id="classId" name="classId" required defaultValue="">
            <option value="" disabled>
              Choose class
            </option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.courseCode} - {item.section})
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <input type="hidden" name="classId" value={classId} />
      )}

      <div>
        <Label htmlFor={classId ? `csvFile-${classId}` : "csvFile"}>Student CSV file</Label>
        <input
          id={classId ? `csvFile-${classId}` : "csvFile"}
          type="file"
          name="csvFile"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-primary/90 dark:text-slate-200"
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Required headers: <code>student ID</code>, <code>first name</code>, <code>last name</code>. Optional: <code>e-mail</code>.
      </p>

      {state.message ? (
        <p className={`rounded-lg p-2 text-xs ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Importing..." : "Import Students from CSV"}
      </Button>
    </form>
  );
}
