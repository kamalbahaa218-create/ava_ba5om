import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AccessDenied, Loading } from "@/components/site/AccessDenied";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateUser,
  adminDeleteUser,
  adminSetActive,
  adminUpdateUser,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/site/ConfirmDelete";
import { ContentManager, type ContentKind } from "@/components/site/ContentManager";
import {
  FOLLOW_LABEL,
  FollowupPanel,
  Leaderboard,
  PointsManager,
  SessionsPanel,
  SettingsPanel,
  fmtDateTime,
} from "@/components/site/part3";
import { USER_TYPE_LABEL, useMyProfile, type Profile, type UserType } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة المسؤول الرئيسي — أسرة أبا باخوم" },
      { name: "description", content: "إدارة المستخدمين والفصول والصلاحيات." },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "attendance", label: "الحضور و QR" },
  { id: "points", label: "النقاط والترتيب" },
  { id: "followup", label: "الافتقاد" },
  { id: "users", label: "المستخدمون" },
  { id: "classes", label: "الفصول" },
  { id: "permissions", label: "الصلاحيات" },
  { id: "topics", label: "موضوع اليوم" },
  { id: "program", label: "فقرات اليوم" },
  { id: "events", label: "التقويم" },
  { id: "announcements", label: "الإعلانات" },
  { id: "content", label: "الدروس والمحتوى" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const inputCls =
  "w-full rounded-2xl border border-input bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold";
const btn = "rounded-2xl bg-oxblood px-4 py-2 text-sm font-bold text-gold-soft disabled:opacity-60";
const card = "rounded-3xl bg-panel p-5 ring-1 ring-black/5";

function useAdminData() {
  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });
  const classes = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_members(id, student_id), class_servants(id, servant_id)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  return { profiles, classes };
}

function AdminPage() {
  const { user } = Route.useRouteContext();
  const me = useMyProfile(user.id);
  const [tab, setTab] = useState<Tab>("overview");
  if (me.isLoading) return <Loading />;
  if (me.data?.user_type !== "MAIN_ADMIN") return <AccessDenied />;

  return (
    <>
      <section className="animate-rise rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="text-sm font-semibold text-gold-soft">لوحة المسؤول الرئيسي</p>
        <h1 className="mt-3 font-display text-3xl font-black">{me.data.full_name}</h1>
      </section>
      <div className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${tab === t.id ? "bg-ink text-paper" : "bg-ink/5 text-ink-soft"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "overview" && <OverviewTab go={setTab} />}
        {tab === "attendance" && <AttendanceTab userId={user.id} />}
        {tab === "points" && <PointsTab userId={user.id} />}
        {tab === "followup" && <FollowupTab userId={user.id} />}
        {tab === "users" && <UsersTab meId={user.id} />}
        {(["topics", "program", "events", "announcements", "content"] as const).includes(
          tab as ContentKind,
        ) && (
          <ContentManager
            key={tab}
            kind={tab as ContentKind}
            userId={user.id}
            userName={me.data.full_name}
          />
        )}
        {tab === "classes" && <ClassesTab />}
        {tab === "permissions" && <PermissionsTab />}
      </div>
    </>
  );
}

function CreateUserForm({ defaultType }: { defaultType: UserType }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateUser);
  const [f, setF] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    user_type: defaultType,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await create({ data: f });
      if (!r.ok) setMsg(r.error);
      else {
        setMsg("تم إنشاء المستخدم.");
        toast.success("تم الحفظ بنجاح");
        setF({ ...f, full_name: "", email: "", phone: "", password: "" });
        qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      }
    } catch {
      setMsg("تحقق من البيانات (كلمة المرور ٨ أحرف على الأقل).");
    }
    setBusy(false);
  }
  return (
    <form onSubmit={onSubmit} className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
      <p className="font-display font-black sm:col-span-2 lg:col-span-3">إضافة مستخدم</p>
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
        placeholder="الهاتف"
        dir="ltr"
        className={inputCls}
        value={f.phone}
        onChange={(e) => setF({ ...f, phone: e.target.value })}
      />
      <input
        required
        type="password"
        placeholder="كلمة مرور مؤقتة"
        className={inputCls}
        value={f.password}
        onChange={(e) => setF({ ...f, password: e.target.value })}
      />
      <select
        className={inputCls}
        value={f.user_type}
        onChange={(e) => setF({ ...f, user_type: e.target.value as UserType })}
      >
        {(Object.keys(USER_TYPE_LABEL) as UserType[]).map((t) => (
          <option key={t} value={t}>
            {USER_TYPE_LABEL[t]}
          </option>
        ))}
      </select>
      <button disabled={busy} className={btn}>
        {busy ? "جارٍ الحفظ…" : "إضافة"}
      </button>
      {msg && <p className="text-sm text-oxblood sm:col-span-2 lg:col-span-3">{msg}</p>}
    </form>
  );
}

function UserRow({ p, meId, classNames }: { p: Profile; meId: string; classNames: string[] }) {
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateUser);
  const setActive = useServerFn(adminSetActive);
  const del = useServerFn(adminDeleteUser);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({
    full_name: p.full_name,
    phone: p.phone ?? "",
    user_type: p.user_type,
  });
  async function run(fn: () => Promise<{ ok: boolean; error: string | null }>, okMsg: string) {
    try {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error ?? "حدث خطأ، حاول مرة أخرى");
        return;
      }
      toast.success(okMsg);
      setEdit(false);
      qc.invalidateQueries();
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    }
  }
  const self = p.id === meId;
  return (
    <li className={`rounded-2xl bg-paper p-3 text-sm ${p.is_active ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-semibold">
            {p.full_name || "—"}{" "}
            {!p.is_active && (
              <span className="ms-1 rounded-full bg-oxblood px-2 py-0.5 text-[11px] text-gold-soft">
                معطّل
              </span>
            )}
          </p>
          <p className="truncate text-xs text-ink-soft" dir="ltr">
            {p.email}
            {p.phone ? ` · ${p.phone}` : ""}
          </p>
          {classNames.length > 0 && (
            <p className="text-xs text-ink-soft">{classNames.join("، ")}</p>
          )}
        </div>
        <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold">
          {USER_TYPE_LABEL[p.user_type]}
        </span>
        <button
          onClick={() => setEdit(!edit)}
          className="rounded-xl bg-gold-soft px-3 py-2 font-semibold"
        >
          تعديل
        </button>
        {!self && (
          <button
            onClick={() =>
              run(
                () => setActive({ data: { id: p.id, active: !p.is_active } }),
                p.is_active ? "تم تعطيل الحساب" : "تم تفعيل الحساب",
              )
            }
            className="rounded-xl bg-ink/5 px-3 py-2 font-semibold"
          >
            {p.is_active ? "تعطيل" : "تفعيل"}
          </button>
        )}
        {!self && (
          <ConfirmDelete
            title={`حذف ${p.full_name}؟`}
            description="سيُحذف الحساب نهائيًا مع سجل حضوره ونقاطه وعضويته في الفصول وملاحظات الافتقاد الخاصة به. لحفظ السجلات استخدم «تعطيل» بدلًا من الحذف."
            onConfirm={() => run(() => del({ data: { id: p.id } }), "تم حذف البيانات بنجاح")}
          />
        )}
      </div>
      {edit && (
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input
            className={inputCls}
            value={f.full_name}
            onChange={(e) => setF({ ...f, full_name: e.target.value })}
          />
          <input
            className={inputCls}
            dir="ltr"
            placeholder="الهاتف"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          <select
            className={inputCls}
            value={f.user_type}
            onChange={(e) => setF({ ...f, user_type: e.target.value as UserType })}
          >
            {(Object.keys(USER_TYPE_LABEL) as UserType[]).map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              run(
                () =>
                  update({
                    data: {
                      id: p.id,
                      full_name: f.full_name,
                      phone: f.phone || null,
                      user_type: f.user_type,
                    },
                  }),
                "تم الحفظ بنجاح",
              )
            }
            className={btn}
          >
            حفظ
          </button>
        </div>
      )}
    </li>
  );
}

function UsersTab({ meId }: { meId: string }) {
  const { profiles, classes } = useAdminData();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | UserType>("");
  const [cls, setCls] = useState("");
  const [status, setStatus] = useState<"" | "active" | "disabled">("");
  const memberOf = (id: string) =>
    (classes.data ?? []).filter(
      (c) =>
        c.class_members.some((m) => m.student_id === id) ||
        c.class_servants.some((m) => m.servant_id === id),
    );
  const list = (profiles.data ?? []).filter((p) => {
    const s = q.trim().toLowerCase();
    if (s && !`${p.full_name} ${p.email ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(s))
      return false;
    if (type && p.user_type !== type) return false;
    if (status && (status === "active") !== p.is_active) return false;
    if (cls && !memberOf(p.id).some((c) => c.id === cls)) return false;
    return true;
  });
  return (
    <div className="space-y-5">
      <CreateUserForm defaultType="STUDENT" />
      <div className={card}>
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <input
            placeholder="بحث بالاسم أو البريد أو الهاتف"
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={inputCls}
            value={type}
            onChange={(e) => setType(e.target.value as "" | UserType)}
          >
            <option value="">كل الأنواع</option>
            {(Object.keys(USER_TYPE_LABEL) as UserType[]).map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select className={inputCls} value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="">كل الفصول</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={inputCls}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="disabled">معطّل</option>
          </select>
        </div>
        {profiles.isLoading ? (
          <Loading />
        ) : profiles.isError ? (
          <p className="text-sm text-oxblood">حدث خطأ، حاول مرة أخرى</p>
        ) : !list.length ? (
          <p className="text-sm text-ink-soft">لا توجد بيانات حاليًا</p>
        ) : (
          <ul className="space-y-2">
            {list.map((p) => (
              <UserRow
                key={p.id}
                p={p}
                meId={meId}
                classNames={memberOf(p.id).map((c) => c.name)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClassesTab() {
  const { classes, profiles } = useAdminData();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", description: "" });
  const [open, setOpen] = useState<string | null>(null);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-classes"] });
    qc.invalidateQueries({ queryKey: ["public-classes"] });
    qc.invalidateQueries({ queryKey: ["class-options"] });
  };
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    const { error } = await supabase
      .from("classes")
      .insert({ name: f.name.trim(), description: f.description.trim() || null });
    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم الحفظ بنجاح");
    setF({ name: "", description: "" });
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم حذف البيانات بنجاح");
    refresh();
  }
  const byId = Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p]));
  return (
    <div className="space-y-5">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-[1fr_2fr_auto]`}>
        <input
          required
          placeholder="اسم الفصل"
          className={inputCls}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <input
          placeholder="وصف مختصر"
          className={inputCls}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <button className={`${btn} py-3`}>إضافة فصل</button>
      </form>
      {classes.isLoading ? (
        <Loading />
      ) : !classes.data?.length ? (
        <p className={`${card} text-center text-sm text-ink-soft`}>لا توجد فصول بعد</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.data.map((c) => (
            <article key={c.id} className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="me-auto font-display text-lg font-black">{c.name}</h3>
                <button
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                  className="rounded-xl bg-gold-soft px-3 py-2 text-sm font-semibold"
                >
                  {open === c.id ? "إغلاق" : "التفاصيل والتعديل"}
                </button>
                <ConfirmDelete
                  title={`حذف ${c.name}؟`}
                  description="سيُحذف الفصل وتعيينات الخدام والمخدومين فيه وجلسات حضور الفصل. حسابات المستخدمين ونقاطهم لن تُحذف."
                  onConfirm={() => remove(c.id)}
                />
              </div>
              {c.description && <p className="mt-1 text-sm text-ink-soft">{c.description}</p>}
              <p className="mt-3 text-xs text-ink-soft">
                {c.class_members.length} مخدوم · {c.class_servants.length} خادم
              </p>
              {open === c.id && (
                <ClassDetails c={c} byId={byId} people={profiles.data ?? []} onChange={refresh} />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetails({
  c,
  byId,
  people,
  onChange,
}: {
  c: {
    id: string;
    name: string;
    description: string | null;
    class_members: { id: string; student_id: string }[];
    class_servants: { id: string; servant_id: string }[];
  };
  byId: Record<string, Profile>;
  people: Profile[];
  onChange: () => void;
}) {
  const [f, setF] = useState({ name: c.name, description: c.description ?? "" });
  const summary = useQuery({
    queryKey: ["class-summary", c.id],
    queryFn: async () =>
      (await supabase.rpc("get_class_summary", { _class: c.id })).data as {
        attendance: number;
        points: number;
        followups: number;
      } | null,
  });
  async function saveInfo() {
    const { error } = await supabase
      .from("classes")
      .update({ name: f.name.trim(), description: f.description.trim() || null })
      .eq("id", c.id);
    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم الحفظ بنجاح");
    onChange();
  }
  async function link(table: "class_members" | "class_servants", personId: string) {
    if (!personId) return;
    const row =
      table === "class_members"
        ? { class_id: c.id, student_id: personId }
        : { class_id: c.id, servant_id: personId };
    const { error } = await (supabase.from(table) as any).insert(row);
    if (error) {
      toast.error(
        error.code === "23505" ? "مُعيَّن بالفعل في هذا الفصل" : "حدث خطأ، حاول مرة أخرى",
      );
      return;
    }
    toast.success("تم الحفظ بنجاح");
    onChange();
  }
  async function unlink(table: "class_members" | "class_servants", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    onChange();
  }
  const memberIds = new Set(c.class_members.map((m) => m.student_id));
  const servantIds = new Set(c.class_servants.map((m) => m.servant_id));
  const s = summary.data;
  return (
    <div className="mt-4 space-y-4 border-t border-line pt-4">
      <div className="grid gap-2">
        <input
          className={inputCls}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="الوصف"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <button onClick={saveInfo} className={btn}>
          حفظ بيانات الفصل
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-paper p-3">
          <p className="font-display text-xl font-black">
            {(s?.attendance ?? 0).toLocaleString("ar-EG")}
          </p>
          حضور
        </div>
        <div className="rounded-2xl bg-paper p-3">
          <p className="font-display text-xl font-black">
            {(s?.points ?? 0).toLocaleString("ar-EG")}
          </p>
          نقاط
        </div>
        <div className="rounded-2xl bg-paper p-3">
          <p className="font-display text-xl font-black">
            {(s?.followups ?? 0).toLocaleString("ar-EG")}
          </p>
          افتقاد مطلوب
        </div>
      </div>
      {(["class_servants", "class_members"] as const).map((table) => {
        const isS = table === "class_servants";
        const rows = isS
          ? c.class_servants.map((m) => ({ id: m.id, pid: m.servant_id }))
          : c.class_members.map((m) => ({ id: m.id, pid: m.student_id }));
        const options = people.filter(
          (p) =>
            p.user_type === (isS ? "SERVANT" : "STUDENT") &&
            !(isS ? servantIds : memberIds).has(p.id),
        );
        return (
          <div key={table}>
            <p className="mb-2 text-xs font-bold text-oxblood">{isS ? "الخدام" : "المخدومون"}</p>
            <div className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-bold"
                >
                  {byId[r.pid]?.full_name ?? "—"}
                  <button
                    onClick={() => unlink(table, r.id)}
                    aria-label="إزالة"
                    className="px-1 text-oxblood"
                  >
                    ×
                  </button>
                </span>
              ))}
              {!rows.length && <span className="text-xs text-ink-soft">لا يوجد بعد.</span>}
            </div>
            <select
              className={`${inputCls} mt-2`}
              value=""
              onChange={(e) => link(table, e.target.value)}
            >
              <option value="">+ إضافة {isS ? "خادم" : "مخدوم"}</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function PermissionsTab() {
  const { profiles } = useAdminData();
  const qc = useQueryClient();
  const servants = profiles.data?.filter((p) => p.user_type === "SERVANT") ?? [];
  const admins = profiles.data?.filter((p) => p.user_type === "MAIN_ADMIN") ?? [];
  const [selected, setSelected] = useState<string>("");
  const perms = useQuery({
    queryKey: ["all-permissions"],
    queryFn: async () => (await supabase.from("permissions").select("*").order("name")).data ?? [],
  });
  const granted = useQuery({
    queryKey: ["user-perms", selected],
    enabled: !!selected,
    queryFn: async () =>
      (await supabase.from("user_permissions").select("id, permission_id").eq("user_id", selected))
        .data ?? [],
  });
  async function toggle(permId: string) {
    const row = granted.data?.find((g) => g.permission_id === permId);
    const { error } = row
      ? await supabase.from("user_permissions").delete().eq("id", row.id)
      : await supabase
          .from("user_permissions")
          .insert({ user_id: selected, permission_id: permId });
    if (error) toast.error("حدث خطأ، حاول مرة أخرى");
    else toast.success("تم الحفظ بنجاح");
    qc.invalidateQueries({ queryKey: ["user-perms", selected] });
  }
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink p-5 text-sm text-paper">
        <p className="font-display font-black text-gold-soft">المسؤول الرئيسي</p>
        <p className="mt-1 text-paper/70">
          يملك كل الصلاحيات تلقائيًا ولا يحتاج إلى تعيين:{" "}
          {admins.map((a) => a.full_name).join("، ") || "—"}
        </p>
      </div>
      <div className={card}>
        <p className="mb-3 font-display font-black">خادم بصلاحيات محددة</p>
        <select className={inputCls} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">اختر خادمًا</option>
          {servants.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        {!servants.length && <p className="mt-2 text-sm text-ink-soft">لا يوجد خدام بعد.</p>}
        {selected && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {perms.data?.map((p) => {
              const on = !!granted.data?.some((g) => g.permission_id === p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm ${on ? "bg-gold-soft" : "bg-paper"}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(p.id)}
                    className="size-5 accent-oxblood"
                  />
                  <span className="font-semibold">{p.description}</span>
                  <span className="ms-auto text-[11px] text-ink-soft" dir="ltr">
                    {p.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function useStudentsWithClass() {
  const { profiles, classes } = useAdminData();
  const students = (profiles.data ?? []).filter((p) => p.user_type === "STUDENT");
  return students.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    className:
      (classes.data ?? []).find((c) => c.class_members.some((m) => m.student_id === s.id))?.name ??
      "بدون فصل",
  }));
}

function OverviewTab({ go }: { go: (t: Tab) => void }) {
  const { profiles, classes } = useAdminData();
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const since = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const nowIso = new Date().toISOString();
      const [att, att7, pts, fu, fuNeed, active, recent] = await Promise.all([
        supabase.from("attendance_records").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .gte("recorded_at", since),
        supabase.from("point_transactions").select("amount"),
        supabase.from("followup_records").select("id", { count: "exact", head: true }),
        supabase
          .from("followup_records")
          .select("id", { count: "exact", head: true })
          .in("status", ["NEEDS_FOLLOWUP", "ABSENT"]),
        supabase
          .from("attendance_sessions")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .gt("expires_at", nowIso),
        supabase
          .from("attendance_records")
          .select(
            "id, recorded_at, student:profiles!attendance_records_student_id_fkey(full_name), attendance_sessions(session_type, classes(name))",
          )
          .order("recorded_at", { ascending: false })
          .limit(10),
      ]);
      return {
        att: att.count ?? 0,
        att7: att7.count ?? 0,
        pts: (pts.data ?? []).reduce((s, r) => s + r.amount, 0),
        ptsN: pts.data?.length ?? 0,
        fu: fu.count ?? 0,
        fuNeed: fuNeed.count ?? 0,
        active: active.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });
  const d = stats.data;
  const n = (x?: number) => (x ?? 0).toLocaleString("ar-EG");
  const tiles = [
    ["عدد المخدومين", n(profiles.data?.filter((p) => p.user_type === "STUDENT").length)],
    ["عدد الخدام", n(profiles.data?.filter((p) => p.user_type === "SERVANT").length)],
    ["عدد الفصول", n(classes.data?.length)],
    ["حضور اليوم", n(d?.att7)],
    ["إجمالي الحضور", n(d?.att)],
    ["جلسات QR النشطة", n(d?.active)],
    ["إجمالي النقاط الموزعة", n(d?.pts)],
    ["حركات النقاط", n(d?.ptsN)],
    ["سجلات الافتقاد", n(d?.fu)],
    [FOLLOW_LABEL.NEEDS_FOLLOWUP + " / غائب", n(d?.fuNeed)],
  ];
  const actions: [string, Tab][] = [
    ["إضافة مخدوم", "users"],
    ["إضافة خادم", "users"],
    ["إضافة فصل", "classes"],
    ["جلسة حضور جديدة", "attendance"],
    ["إضافة نقاط", "points"],
    ["إضافة إعلان", "announcements"],
    ["إضافة فعالية", "events"],
    ["إضافة موضوع اليوم", "topics"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map(([l, t]) => (
          <button
            key={l}
            onClick={() => go(t)}
            className="rounded-2xl bg-oxblood px-3 py-3 text-sm font-bold text-gold-soft"
          >
            + {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([l, v]) => (
          <div key={l} className={card}>
            <p className="text-xs font-bold text-ink-soft">{l}</p>
            <p className="mt-1 font-display text-3xl font-black">{v}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 font-display font-black">آخر الحضور</p>
        <ul className="space-y-2">
          {(d?.recent ?? []).map((r) => (
            <li
              key={r.id}
              className="flex justify-between rounded-2xl bg-panel px-4 py-2.5 text-sm ring-1 ring-black/5"
            >
              <span>
                {r.student?.full_name} —{" "}
                {r.attendance_sessions?.session_type === "FIRST_HOUR"
                  ? "الساعة الأولى"
                  : r.attendance_sessions?.classes?.name}
              </span>
              <span className="text-xs text-ink-soft">{fmtDateTime(r.recorded_at)}</span>
            </li>
          ))}
          {!d?.recent.length && <li className="text-sm text-ink-soft">لا يوجد حضور بعد.</li>}
        </ul>
      </div>
    </div>
  );
}

function AttendanceTab({ userId }: { userId: string }) {
  const { classes } = useAdminData();
  return (
    <SessionsPanel
      userId={userId}
      classes={(classes.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
      canFirstHour
    />
  );
}

function PointsTab({ userId }: { userId: string }) {
  const students = useStudentsWithClass();
  return (
    <div className="space-y-6">
      <SettingsPanel />
      <PointsManager userId={userId} students={students} />
      <Leaderboard title="ترتيب الخدمة" />
    </div>
  );
}

function FollowupTab({ userId }: { userId: string }) {
  const students = useStudentsWithClass();
  return <FollowupPanel userId={userId} students={students} />;
}
