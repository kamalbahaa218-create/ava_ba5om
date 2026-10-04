import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scan")({
  validateSearch: z.object({ t: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "تسجيل الحضور — أسرة أبا باخوم" },
      { name: "description", content: "سجّل حضورك في خدمة أسرة أبا باخوم بمسح كود QR." },
      { property: "og:title", content: "تسجيل الحضور — أسرة أبا باخوم" },
      { property: "og:description", content: "مسح QR لتسجيل حضور الخدمة أو الفصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

const INVALID = "هذا الكود غير صالح أو انتهت صلاحيته.";
const MSG: Record<string, string> = {
  invalid: "هذا الكود غير صالح أو انتهت صلاحيته.",
  wrong_class: "هذا الكود خاص بفصل آخر.",
  duplicate: "تم تسجيل حضورك مسبقًا في هذه الجلسة.",
  not_student: "تسجيل الحضور بالكود متاح للمخدومين فقط.",
  auth: "يجب تسجيل الدخول أولاً.",
};

const UUID = /^[0-9a-f-]{36}$/i;

function ScanPage() {
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<{
    ok: boolean;
    text: string;
    points?: number | undefined;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!t || !UUID.test(t)) return setState({ ok: false, text: INVALID });
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        sessionStorage.setItem("pendingScan", t);
        navigate({ to: "/login", replace: true });
        return;
      }
      sessionStorage.removeItem("pendingScan");
      const { data, error } = await supabase.rpc("record_attendance", { _token: t });
      const r = data as { ok: boolean; code?: string; points?: number } | null;
      if (error || !r) return setState({ ok: false, text: INVALID });
      if (r.ok) setState({ ok: true, text: "تم تسجيل حضورك بنجاح ✓", points: r.points });
      else setState({ ok: false, text: MSG[r.code ?? ""] ?? INVALID });
    })();
  }, [t, navigate]);

  return (
    <section className="mx-auto max-w-md animate-rise py-8 text-center">
      <div
        className={`rounded-3xl p-10 ring-1 ring-black/5 ${state?.ok ? "bg-gold-soft" : "bg-panel"}`}
      >
        {!state ? (
          <p className="text-sm text-ink-soft">جارٍ تسجيل الحضور…</p>
        ) : (
          <>
            <span
              className={`mx-auto grid size-20 place-items-center rounded-full font-display text-4xl font-black ${state.ok ? "bg-oxblood text-gold-soft" : "bg-ink/10 text-ink"}`}
            >
              {state.ok ? "✓" : "!"}
            </span>
            <h1 className="mt-5 font-display text-2xl font-black">{state.text}</h1>
            {state.ok && !!state.points && (
              <p className="mt-2 text-sm font-bold text-oxblood">
                +{state.points.toLocaleString("ar-EG")} نقطة
              </p>
            )}
          </>
        )}
      </div>
      <Link
        to="/dashboard"
        className="mt-6 inline-block rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-paper"
      >
        الذهاب إلى لوحتي
      </Link>
    </section>
  );
}
