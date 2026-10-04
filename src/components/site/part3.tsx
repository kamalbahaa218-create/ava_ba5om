import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SectionHeading } from "./SectionHeading";

type PointType = Database["public"]["Enums"]["point_type"];
type FollowStatus = Database["public"]["Enums"]["followup_status"];
type Mode = Database["public"]["Enums"]["leaderboard_mode"];

export const POINT_TYPE_LABEL: Record<PointType, string> = {
  attendance: "حضور",
  activity: "نشاط",
  competition: "مسابقة",
  special_event: "مناسبة خاصة",
  manual_adjustment: "تعديل يدوي",
};
export const FOLLOW_LABEL: Record<FollowStatus, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  CONTACTED: "تم التواصل",
  NEEDS_FOLLOWUP: "يحتاج متابعة",
  DONE: "متابعة مكتملة",
};
export const MODE_LABEL: Record<Mode, string> = {
  DISABLED: "معطّل",
  CLASS: "ترتيب الفصل",
  SERVICE: "ترتيب الخدمة كلها",
};

export const inputCls =
  "w-full rounded-2xl border border-input bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold";
export const btn =
  "rounded-2xl bg-oxblood px-4 py-2 text-sm font-bold text-gold-soft disabled:opacity-60";
export const card = "rounded-3xl bg-panel p-5 ring-1 ring-black/5";

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

/* ---------------- Student points ---------------- */
export function MyPoints({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["my-points", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("point_transactions")
        .select("id, amount, type, reason, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = q.data ?? [];
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const now = new Date();
  const month = rows
    .filter((r) => {
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, r) => s + r.amount, 0);
  return (
    <section className="mt-12">
      <SectionHeading title="نقاطي" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-oxblood p-6 text-gold-soft">
          <p className="text-xs font-bold">إجمالي نقاطي</p>
          <p className="mt-2 font-display text-5xl font-black">{total.toLocaleString("ar-EG")}</p>
        </div>
        <div className="rounded-3xl bg-gold-soft p-6 text-ink">
          <p className="text-xs font-bold text-oxblood">نقاط هذا الشهر</p>
          <p className="mt-2 font-display text-5xl font-black">{month.toLocaleString("ar-EG")}</p>
        </div>
      </div>
      <h3 className="mt-6 font-display text-lg font-black">سجل النقاط</h3>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-4 rounded-2xl bg-panel px-4 py-3 ring-1 ring-black/5"
          >
            <span
              className={`w-14 font-display text-xl font-black ${r.amount > 0 ? "text-oxblood" : "text-ink-soft"}`}
              dir="ltr"
            >
              {r.amount > 0 ? "+" : ""}
              {r.amount}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.reason}</p>
              <p className="text-xs text-ink-soft">
                {POINT_TYPE_LABEL[r.type]} · {fmtDate(r.created_at)}
              </p>
            </div>
          </li>
        ))}
        {!rows.length && !q.isLoading && (
          <li className="text-sm text-ink-soft">لا توجد نقاط بعد.</li>
        )}
      </ul>
    </section>
  );
}

/* ---------------- Leaderboard ---------------- */
export function Leaderboard({ classId, title }: { classId?: string; title?: string }) {
  const settings = useSettings();
  const q = useQuery({
    queryKey: ["leaderboard", classId ?? null, settings.data?.leaderboard_mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_leaderboard",
        classId ? { _class: classId } : {},
      );
      if (error) throw error;
      return data;
    },
  });
  const mode = settings.data?.leaderboard_mode;
  const heading = title ?? (classId || mode === "CLASS" ? "ترتيب الفصل" : "ترتيب الخدمة");
  if (!q.data?.length && mode === "DISABLED") return null;
  return (
    <section className="mt-12">
      <SectionHeading title={heading} />
      <ol className="space-y-2">
        {(q.data ?? []).slice(0, 20).map((r) => (
          <li
            key={r.student_id}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3 ring-1 ring-black/5 ${r.is_me ? "bg-gold-soft" : "bg-panel"}`}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-ink font-display font-black text-gold-soft">
              {Number(r.rank).toLocaleString("ar-EG")}
            </span>
            <span className="flex-1 text-sm font-semibold">{r.full_name || "—"}</span>
            <span className="font-display font-black text-oxblood">
              {Number(r.total).toLocaleString("ar-EG")}
            </span>
          </li>
        ))}
        {!q.data?.length && !q.isLoading && (
          <li className="text-sm text-ink-soft">لا يوجد ترتيب لعرضه.</li>
        )}
      </ol>
    </section>
  );
}

export function useSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function SettingsPanel() {
  const qc = useQueryClient();
  const s = useSettings();
  const [msg, setMsg] = useState<string | null>(null);
  if (!s.data) return null;
  async function save(patch: {
    leaderboard_mode?: Mode;
    first_hour_points?: number;
    class_hour_points?: number;
  }) {
    const { error } = await supabase
      .from("app_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setMsg(error ? "تعذّر الحفظ." : "تم الحفظ.");
    qc.invalidateQueries({ queryKey: ["app-settings"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
  }
  return (
    <div className={`${card} grid gap-3 sm:grid-cols-3`}>
      <label className="text-sm">
        <span className="mb-1 block font-bold">لوحة الترتيب</span>
        <select
          className={inputCls}
          value={s.data.leaderboard_mode}
          onChange={(e) => save({ leaderboard_mode: e.target.value as Mode })}
        >
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">نقاط حضور الساعة الأولى</span>
        <input
          type="number"
          min={0}
          className={inputCls}
          defaultValue={s.data.first_hour_points}
          onBlur={(e) => save({ first_hour_points: Number(e.target.value) })}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">نقاط حضور الفصل</span>
        <input
          type="number"
          min={0}
          className={inputCls}
          defaultValue={s.data.class_hour_points}
          onBlur={(e) => save({ class_hour_points: Number(e.target.value) })}
        />
      </label>
      {msg && <p className="text-sm text-oxblood sm:col-span-3">{msg}</p>}
    </div>
  );
}

/* ---------------- QR sessions ---------------- */
type ClassOpt = { id: string; name: string };

export function SessionsPanel({
  userId,
  classes,
  canFirstHour,
}: {
  userId: string;
  classes: ClassOpt[];
  canFirstHour: boolean;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<"FIRST_HOUR" | "CLASS_HOUR">(
    canFirstHour ? "FIRST_HOUR" : "CLASS_HOUR",
  );
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [minutes, setMinutes] = useState(30);
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["sessions"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(
          "id, token, session_type, class_id, expires_at, is_active, created_at, classes(name), attendance_records(count)",
        )
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        session_type: type,
        class_id: type === "CLASS_HOUR" ? classId : null,
        created_by: userId,
        expires_at: new Date(Date.now() + minutes * 60000).toISOString(),
      })
      .select("id")
      .single();
    if (error) return setMsg("ليس لديك صلاحية لإنشاء هذه الجلسة.");
    setShown(data.id);
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }
  async function close(id: string) {
    await supabase.from("attendance_sessions").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const now = Date.now();
  const list = sessions.data ?? [];
  const active = list.find((s) => s.id === shown);

  return (
    <div className="space-y-5">
      <form onSubmit={create} className={`${card} grid gap-3 sm:grid-cols-4`}>
        <p className="font-display font-black sm:col-span-4">جلسة حضور جديدة</p>
        <select
          className={inputCls}
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          {canFirstHour && <option value="FIRST_HOUR">الساعة الأولى (الخدمة كلها)</option>}
          <option value="CLASS_HOUR">الساعة الثانية (فصل)</option>
        </select>
        {type === "CLASS_HOUR" && (
          <select
            required
            className={inputCls}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {!classes.length && <option value="">لا توجد فصول</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select
          className={inputCls}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          {[10, 15, 30, 60, 90].map((m) => (
            <option key={m} value={m}>
              صالحة {m.toLocaleString("ar-EG")} دقيقة
            </option>
          ))}
        </select>
        <button className={btn}>إنشاء كود QR</button>
        {msg && <p className="text-sm text-oxblood sm:col-span-4">{msg}</p>}
      </form>

      {active && (
        <div className="rounded-3xl bg-paper p-6 text-center ring-2 ring-gold">
          <p className="font-display text-xl font-black">
            {active.session_type === "FIRST_HOUR"
              ? "حضور الساعة الأولى"
              : `حضور ${active.classes?.name ?? "الفصل"}`}
          </p>
          <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4">
            <QRCodeSVG value={`${origin}/scan?t=${active.token}`} size={260} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            يمسح المخدوم الكود بكاميرا الموبايل ثم يسجّل الدخول.
          </p>
          <p className="mt-1 text-sm font-bold">
            حضر حتى الآن: {(active.attendance_records?.[0]?.count ?? 0).toLocaleString("ar-EG")} ·
            ينتهي {fmtDateTime(active.expires_at)}
          </p>
          <button
            onClick={() => setShown(null)}
            className="mt-4 text-sm font-semibold text-oxblood"
          >
            إخفاء الكود
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className="font-display font-black">جلسات QR</p>
        {list.map((s) => {
          const live = s.is_active && new Date(s.expires_at).getTime() > now;
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel px-4 py-3 text-sm ring-1 ring-black/5"
            >
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${live ? "bg-gold text-ink" : "bg-ink/5 text-ink-soft"}`}
              >
                {live ? "نشطة" : "منتهية"}
              </span>
              <span className="flex-1 font-semibold">
                {s.session_type === "FIRST_HOUR" ? "الساعة الأولى" : s.classes?.name} ·{" "}
                {fmtDateTime(s.created_at)}
              </span>
              <span>{(s.attendance_records?.[0]?.count ?? 0).toLocaleString("ar-EG")} حاضر</span>
              {live && (
                <>
                  <button onClick={() => setShown(s.id)} className="font-semibold text-oxblood">
                    عرض الكود
                  </button>
                  <button onClick={() => close(s.id)} className="font-semibold text-ink-soft">
                    إيقاف
                  </button>
                </>
              )}
            </div>
          );
        })}
        {!list.length && <p className="text-sm text-ink-soft">لا توجد جلسات بعد.</p>}
      </div>
    </div>
  );
}

/* ---------------- Points manager (manage_points) ---------------- */
export function PointsManager({
  userId,
  students,
}: {
  userId: string;
  students: { id: string; full_name: string }[];
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    student_id: "",
    amount: 5,
    type: "activity" as PointType,
    reason: "",
    note: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const recent = useQuery({
    queryKey: ["recent-points"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("point_transactions")
        .select(
          "id, amount, type, reason, created_at, student:profiles!point_transactions_student_id_fkey(full_name)",
        )
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data;
    },
  });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("point_transactions")
      .insert({ ...f, note: f.note || null, created_by: userId });
    setMsg(error ? "ليس لديك صلاحية أو البيانات غير صحيحة." : "تمت إضافة النقاط.");
    if (!error) setF({ ...f, reason: "", note: "" });
    qc.invalidateQueries({ queryKey: ["recent-points"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
  }
  async function remove(id: string) {
    if (!confirm("حذف هذه الحركة؟")) return;
    await supabase.from("point_transactions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["recent-points"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
  }
  return (
    <div className="space-y-4">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
        <p className="font-display font-black sm:col-span-2 lg:col-span-3">إضافة / خصم نقاط</p>
        <select
          required
          className={inputCls}
          value={f.student_id}
          onChange={(e) => setF({ ...f, student_id: e.target.value })}
        >
          <option value="">اختر المخدوم</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <input
          type="number"
          required
          className={inputCls}
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
        />
        <select
          className={inputCls}
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value as PointType })}
        >
          {(Object.keys(POINT_TYPE_LABEL) as PointType[]).map((t) => (
            <option key={t} value={t}>
              {POINT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="السبب"
          className={inputCls}
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
        />
        <input
          placeholder="ملاحظة (اختياري)"
          className={inputCls}
          value={f.note}
          onChange={(e) => setF({ ...f, note: e.target.value })}
        />
        <button className={btn}>حفظ</button>
        {msg && <p className="text-sm text-oxblood sm:col-span-2 lg:col-span-3">{msg}</p>}
      </form>
      <p className="font-display font-black">آخر حركات النقاط</p>
      <ul className="space-y-2">
        {(recent.data ?? []).map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl bg-panel px-4 py-2.5 text-sm ring-1 ring-black/5"
          >
            <span className="w-12 font-display font-black text-oxblood" dir="ltr">
              {r.amount > 0 ? "+" : ""}
              {r.amount}
            </span>
            <span className="flex-1">
              {r.student?.full_name} — {r.reason}{" "}
              <span className="text-xs text-ink-soft">
                ({POINT_TYPE_LABEL[r.type]} · {fmtDate(r.created_at)})
              </span>
            </span>
            <button onClick={() => remove(r.id)} className="text-xs font-semibold text-ink-soft">
              حذف
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Follow-up ---------------- */
export function FollowupPanel({
  userId,
  students,
}: {
  userId: string;
  students: { id: string; full_name: string; className: string }[];
}) {
  const qc = useQueryClient();
  const ids = students.map((s) => s.id);
  const data = useQuery({
    queryKey: ["followup", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const [att, fu] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("student_id, recorded_at")
          .in("student_id", ids)
          .order("recorded_at", { ascending: false }),
        supabase
          .from("followup_records")
          .select("id, student_id, date, status, note, created_at")
          .in("student_id", ids)
          .order("created_at", { ascending: false }),
      ]);
      return { att: att.data ?? [], fu: fu.data ?? [] };
    },
  });
  const [open, setOpen] = useState<string | null>(null);
  const [f, setF] = useState({ status: "CONTACTED" as FollowStatus, note: "" });

  async function save(studentId: string) {
    const { error } = await supabase.from("followup_records").insert({
      student_id: studentId,
      servant_id: userId,
      status: f.status,
      note: f.note || null,
    });
    if (error) return alert("ليس لديك صلاحية لمتابعة هذا المخدوم.");
    setOpen(null);
    setF({ status: "CONTACTED", note: "" });
    qc.invalidateQueries({ queryKey: ["followup"] });
  }

  if (!students.length) return <p className="text-sm text-ink-soft">لا يوجد مخدومون للمتابعة.</p>;
  return (
    <div className="space-y-2">
      {students.map((s) => {
        const lastAtt = data.data?.att.find((a) => a.student_id === s.id);
        const hist = data.data?.fu.filter((x) => x.student_id === s.id) ?? [];
        const last = hist[0];
        return (
          <div key={s.id} className={card}>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex-1 font-display font-black">{s.full_name}</span>
              <span className="text-xs text-ink-soft">{s.className}</span>
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs">
                آخر حضور: {lastAtt ? fmtDate(lastAtt.recorded_at) : "—"}
              </span>
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs">
                آخر متابعة: {last ? fmtDate(last.date) : "—"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${last?.status === "NEEDS_FOLLOWUP" || last?.status === "ABSENT" ? "bg-oxblood text-gold-soft" : "bg-gold-soft text-ink"}`}
              >
                {last ? FOLLOW_LABEL[last.status] : "لا توجد متابعة"}
              </span>
              <button
                onClick={() => setOpen(open === s.id ? null : s.id)}
                className="font-semibold text-oxblood"
              >
                {open === s.id ? "إغلاق" : "إضافة متابعة"}
              </button>
            </div>
            {open === s.id && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <select
                  className={inputCls}
                  value={f.status}
                  onChange={(e) => setF({ ...f, status: e.target.value as FollowStatus })}
                >
                  {(Object.keys(FOLLOW_LABEL) as FollowStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {FOLLOW_LABEL[k]}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="ملاحظة"
                  className={inputCls}
                  value={f.note}
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                />
                <button onClick={() => save(s.id)} className={btn}>
                  حفظ
                </button>
                {hist.length > 0 && (
                  <ul className="space-y-1 text-xs text-ink-soft sm:col-span-3">
                    {hist.slice(0, 5).map((h) => (
                      <li key={h.id}>
                        {fmtDate(h.date)} · {FOLLOW_LABEL[h.status]}
                        {h.note ? ` — ${h.note}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Student attendance history ---------------- */
export function MyAttendance({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["my-attendance", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, recorded_at, session_id")
        .eq("student_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  const rows = q.data ?? [];
  return (
    <section className="mt-12">
      <SectionHeading title="سجل الحضور" note={`${rows.length.toLocaleString("ar-EG")} مرة`} />
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-panel px-4 py-3 text-sm ring-1 ring-black/5">
            حضور · {fmtDateTime(r.recorded_at)}
          </li>
        ))}
        {!rows.length && !q.isLoading && (
          <li className="text-sm text-ink-soft">لا يوجد حضور مسجّل بعد.</li>
        )}
      </ul>
    </section>
  );
}
