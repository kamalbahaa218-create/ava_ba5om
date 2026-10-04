import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CHURCH_NAME, SERVICE_NAME } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { getSetupStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — أسرة أبا باخوم" },
      {
        name: "description",
        content: "تسجيل دخول المخدومين والخدام في خدمة ثانوي أسرة أبا باخوم.",
      },
      { property: "og:title", content: "تسجيل الدخول — أسرة أبا باخوم" },
      { property: "og:description", content: "صفحة تسجيل الدخول لخدمة ثانوي أسرة أبا باخوم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const inputCls =
  "w-full rounded-2xl border border-input bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold";

function LoginPage() {
  const navigate = useNavigate();
  const setupStatus = useServerFn(getSetupStatus);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const pending = sessionStorage.getItem("pendingScan");
      if (pending) navigate({ to: "/scan", search: { t: pending }, replace: true });
      else navigate({ to: "/dashboard", replace: true });
    });
    setupStatus()
      .then((r) => setNeedsSetup(r.needsSetup))
      .catch(() => {});
  }, [navigate, setupStatus]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error)
      return setError(
        /banned/i.test(error.message)
          ? "هذا الحساب معطّل. تواصل مع المسؤول."
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      );
    const pending = sessionStorage.getItem("pendingScan");
    if (pending) return navigate({ to: "/scan", search: { t: pending }, replace: true });
    navigate({ to: "/dashboard", replace: true });
  }

  async function onForgot() {
    if (!email) return setError("اكتب بريدك الإلكتروني أولاً.");
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setInfo("إذا كان البريد مسجلًا، ستصلك رسالة لإعادة تعيين كلمة المرور.");
  }

  return (
    <section className="mx-auto max-w-md animate-rise">
      <div className="rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-oxblood font-display text-xl font-black text-gold-soft">
          أ
        </span>
        <h1 className="font-display text-2xl font-black">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-paper/70">
          {SERVICE_NAME} · {CHURCH_NAME}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-5 animate-rise2 space-y-4 rounded-3xl bg-panel p-6 ring-1 ring-black/5"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onForgot} className="text-sm font-semibold text-oxblood">
            نسيت كلمة المرور؟
          </button>
        </div>
        {error && (
          <p className="rounded-2xl bg-oxblood/10 px-4 py-2 text-sm text-oxblood">{error}</p>
        )}
        {info && <p className="rounded-2xl bg-gold-soft px-4 py-2 text-sm text-ink">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-oxblood px-4 py-3 font-display text-sm font-bold text-gold-soft transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy ? "جارٍ الدخول…" : "تسجيل الدخول"}
        </button>
        <p className="text-center text-xs text-ink-soft">
          الحسابات يُنشئها المسؤول الرئيسي للخدمة.
        </p>
        {needsSetup && (
          <Link to="/setup" className="block text-center text-sm font-semibold text-oxblood">
            إعداد حساب المسؤول الرئيسي لأول مرة ←
          </Link>
        )}
      </form>
    </section>
  );
}
