import { CHURCH_NAME, SERVICE_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-center sm:flex-row sm:text-start">
      <p className="text-sm text-ink-soft">
        {SERVICE_NAME} · {CHURCH_NAME}
      </p>
      <div className="flex flex-col items-center gap-1 sm:items-end">
        <p className="font-display text-base font-bold tracking-wide text-oxblood">Kamal Bahaa</p>
        <p className="text-xs tracking-wide text-gold">Designed &amp; Developed by Kamal Bahaa</p>
      </div>
    </footer>
  );
}
