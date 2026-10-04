import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFirstAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "إعداد المسؤول الرئيسي — أسرة أبا باخوم" }] }),
  component: SetupPage,
});

const inputCls =
  "w-full rounded-2xl border border-input bg-paper px-4 py-3 text-sm outline-none focus:border-gold";

function SetupPage() {
  const create = useServerFn(createFirstAdmin);
  const [f, setF] = useState({ full_name: "", email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await create({ data: f });
      if (r.ok) setDone(true);
      else setMsg(r.error);
    } catch {
      setMsg("تحقق من البيانات (كلمة المرور ٨ أحرف على الأقل).");
    }
  }
  if (done)
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-panel p-6 text-center ring-1 ring-black/5">
        <p className="font-display text-xl font-black">تم إنشاء حساب المسؤول الرئيسي</p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded-2xl bg-oxblood px-5 py-2.5 text-sm font-bold text-gold-soft"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md animate-rise space-y-4 rounded-3xl bg-panel p-6 ring-1 ring-black/5"
    >
      <h1 className="font-display text-2xl font-black">إعداد المسؤول الرئيسي</h1>
      <p className="text-sm text-ink-soft">تعمل هذه الصفحة مرة واحدة فقط قبل وجود أي مسؤول.</p>
      <input
        required
        placeholder="الاسم الكامل"
        className={inputCls}
        value={f.full_name}
        onChange={(e) => setF({ ...f, full_name: e.target.value })}
      />
      <input
        required
        type="email"
        dir="ltr"
        placeholder="البريد الإلكتروني"
        className={inputCls}
        value={f.email}
        onChange={(e) => setF({ ...f, email: e.target.value })}
      />
      <input
        required
        type="password"
        placeholder="كلمة المرور"
        className={inputCls}
        value={f.password}
        onChange={(e) => setF({ ...f, password: e.target.value })}
      />
      {msg && <p className="text-sm text-oxblood">{msg}</p>}
      <button className="w-full rounded-2xl bg-oxblood px-4 py-3 text-sm font-bold text-gold-soft">
        إنشاء الحساب
      </button>
    </form>
  );
}
