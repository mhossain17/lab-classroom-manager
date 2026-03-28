import { PresentationDeck } from "@/components/presentation/presentation-deck";
import { getOrCreateGlobalConfig, getPresentationSnapshot } from "@/lib/data";

export default async function PresentationPage() {
  const [{ theme }, snapshot] = await Promise.all([getOrCreateGlobalConfig(), getPresentationSnapshot()]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-white to-brand-secondary/10 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-7xl">
        <PresentationDeck schoolName={theme.schoolName} snapshot={snapshot} />
      </div>
    </div>
  );
}
