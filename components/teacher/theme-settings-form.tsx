"use client";

import { ThemeSettings } from "@prisma/client";
import { useActionState, useMemo, useState } from "react";
import { applyPresetThemeAction, updateThemeSettingsAction } from "@/lib/actions/index";
import { presetThemes } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial = { ok: false, message: "" };

export function ThemeSettingsForm({ theme }: { theme: ThemeSettings }) {
  const [state, action, pending] = useActionState(updateThemeSettingsAction, initial);
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);

  const previewStyle = useMemo(
    () => ({
      background: `linear-gradient(130deg, ${primaryColor}, ${secondaryColor})`
    }),
    [primaryColor, secondaryColor]
  );

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">School Branding</h3>

        <div>
          <Label htmlFor="schoolName">School Name</Label>
          <Input id="schoolName" name="schoolName" defaultValue={theme.schoolName} required />
        </div>

        <div>
          <Label htmlFor="logoUrl">Logo URL or local path</Label>
          <Input id="logoUrl" name="logoUrl" defaultValue={theme.logoUrl ?? ""} placeholder="/logo.svg" />
        </div>
        <div>
          <Label htmlFor="logoFile">Upload school logo</Label>
          <Input id="logoFile" name="logoFile" type="file" accept="image/*" />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            If a file is selected, it overrides the URL above.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="primaryColor">Primary</Label>
            <Input
              id="primaryColor"
              name="primaryColor"
              defaultValue={theme.primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="secondaryColor">Secondary</Label>
            <Input
              id="secondaryColor"
              name="secondaryColor"
              defaultValue={theme.secondaryColor}
              onChange={(event) => setSecondaryColor(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="accentColor">Accent</Label>
            <Input
              id="accentColor"
              name="accentColor"
              defaultValue={theme.accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="darkMode" defaultChecked={theme.darkMode} />
          Enable dark mode by default
        </label>

        {state.message ? (
          <p className={`rounded-lg p-2 text-sm ${state.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving branding..." : "Save Branding"}
        </Button>
      </form>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Theme Preview</h4>
        <div className="rounded-2xl p-4 text-white" style={previewStyle}>
          <p className="text-xs uppercase tracking-[0.18em] text-white/80">Header Preview</p>
          <p className="mt-1 text-lg font-bold">{theme.schoolName}</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: accentColor }}>
              Accent Button
            </span>
            <span className="rounded-full bg-black/20 px-3 py-1 text-xs">Card label</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {presetThemes.map((preset) => (
            <form key={preset.name} action={applyPresetThemeAction} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <input type="hidden" name="presetName" value={preset.name} />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{preset.name}</p>
              <div className="mt-2 flex gap-2">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.secondaryColor }} />
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.accentColor }} />
              </div>
              <Button type="submit" variant="ghost" size="sm" className="mt-3 w-full">
                Apply
              </Button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
