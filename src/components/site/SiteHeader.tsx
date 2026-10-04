import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SERVICE_NAME } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/program", label: "موضوع وفقرات اليوم" },
  { to: "/calendar", label: "التقويم" },
  { to: "/classes", label: "الفصول" },
  { to: "/announcements", label: "الإعلانات" },
] as const;

const MOBILE_NAV = [...NAV, { to: "/dashboard", label: "لوحتي" }] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 animate-rise border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:flex lg:h-16 lg:justify-between lg:py-0">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-oxblood font-display text-lg font-black text-gold-soft">
            أ
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-extrabold text-oxblood">
              {SERVICE_NAME}
            </span>
            <span className="block truncate text-[11px] text-ink-soft">
              كنيسة السيدة العذراء مريم
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              activeProps={{ className: "bg-ink text-paper hover:bg-ink hover:text-paper" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full bg-oxblood px-4 py-2 text-sm font-semibold text-gold-soft transition-transform duration-200 hover:-translate-y-0.5"
              >
                لوحتي
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 sm:block"
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-oxblood px-4 py-2 text-sm font-semibold text-gold-soft transition-transform duration-200 hover:-translate-y-0.5"
            >
              تسجيل الدخول
            </Link>
          )}
          <button
            type="button"
            aria-label="القائمة"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink/5 text-ink lg:hidden"
          >
            <span className="space-y-1">
              <span className="block h-0.5 w-5 bg-ink" />
              <span className="block h-0.5 w-5 bg-ink" />
              <span className="block h-0.5 w-5 bg-ink" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-rise2 border-t border-line px-4 pb-4 pt-2 text-sm font-medium lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {MOBILE_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-2.5 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                activeProps={{ className: "bg-ink text-paper" }}
              >
                {item.label}
              </Link>
            ))}
            {session && (
              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl px-3 py-2.5 text-start text-oxblood hover:bg-ink/5"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
