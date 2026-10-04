import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "تعيين كلمة مرور جديدة — أسرة أبا باخوم" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("كلمة المرور يجب أن تكون ٨ أحرف على الأقل.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg("تعذّر تحديث كلمة المرور. اطلب رابطًا جديدًا.");
    navigate({ to: "/dashboard", replace: true });
  }
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md animate-rise space-y-4 rounded-3xl bg-panel p-6 ring-1 ring-black/5"
    >
      <h1 className="font-display text-2xl font-black">تعيين كلمة مرور جديدة</h1>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        className="w-full rounded-2xl border border-input bg-paper px-4 py-3 text-sm"
        placeholder="كلمة المرور الجديدة"
      />
      {msg && <p className="text-sm text-oxblood">{msg}</p>}
      <button className="w-full rounded-2xl bg-oxblood px-4 py-3 text-sm font-bold text-gold-soft">
        حفظ
      </button>
    </form>
  );
}
