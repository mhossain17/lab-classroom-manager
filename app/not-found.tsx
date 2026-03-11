import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-primary">Not Found</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Page unavailable</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This lab or dashboard view could not be found.</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Return to home
        </Link>
      </div>
    </div>
  );
}
