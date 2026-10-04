import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTENT_TYPE,
  EVENT_TYPE,
  PROGRAM_CATEGORY,
  VISIBILITY_LABEL,
  fmtLongDate,
  fmtTime,
  todayISO,
} from "@/lib/content";
import { ConfirmDelete } from "./ConfirmDelete";
import { btn, card, inputCls } from "./part3";

type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "number" | "url" | "select";
  options?: Record<string, string>;
  required?: boolean;
  full?: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

type Config = {
  table: "topics" | "program_items" | "events" | "announcements" | "content_items";
  title: string;
  addLabel: string;
  order: { col: string; asc: boolean }[];
  fields: Field[];
  defaults: () => Record<string, any>;
  summary: (r: Row, classes: Record<string, string>) => { title: string; meta: string };
  invalidate: string[];
  extra?: (userId: string, name: string) => Record<string, any>;
};

const VIS = VISIBILITY_LABEL as Record<string, string>;

export const CONFIGS = {
  topics: {
    table: "topics",
    title: "موضوع اليوم",
    addLabel: "إضافة موضوع",
    order: [{ col: "topic_date", asc: false }],
    fields: [
      { key: "topic_date", label: "التاريخ", type: "date", required: true },
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "verse", label: "آية اليوم", type: "text", full: true },
      { key: "speaker", label: "المتكلم / الخادم", type: "text" },
      { key: "image_url", label: "رابط صورة (اختياري)", type: "url" },
      { key: "description", label: "الوصف", type: "textarea", full: true },
    ],
    defaults: () => ({ topic_date: todayISO() }),
    summary: (r) => ({
      title: r.title,
      meta: `${fmtLongDate(r.topic_date)}${r.speaker ? ` · ${r.speaker}` : ""}`,
    }),
    invalidate: ["topics"],
    extra: (uid) => ({ created_by: uid }),
  },
  program: {
    table: "program_items",
    title: "فقرات اليوم",
    addLabel: "إضافة فقرة",
    order: [
      { col: "program_date", asc: false },
      { col: "hour", asc: true },
      { col: "sort_order", asc: true },
    ],
    fields: [
      { key: "program_date", label: "التاريخ", type: "date", required: true },
      {
        key: "hour",
        label: "الساعة",
        type: "select",
        options: { "1": "الساعة الأولى", "2": "الساعة الثانية" },
        required: true,
      },
      { key: "category", label: "نوع الفقرة", type: "select", options: PROGRAM_CATEGORY },
      { key: "start_time", label: "الوقت", type: "time" },
      { key: "title", label: "اسم الفقرة", type: "text", required: true },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "description", label: "وصف مختصر", type: "textarea", full: true },
    ],
    defaults: () => ({ program_date: todayISO(), hour: "1", category: "prayer", sort_order: 0 }),
    summary: (r) => ({
      title: r.title,
      meta: `${fmtLongDate(r.program_date)} · ${r.hour === 1 ? "الساعة الأولى" : "الساعة الثانية"} · ${PROGRAM_CATEGORY[r.category] ?? ""}${r.start_time ? ` · ${fmtTime(r.start_time)}` : ""}`,
    }),
    invalidate: ["program_items"],
  },
  events: {
    table: "events",
    title: "التقويم",
    addLabel: "إضافة فعالية",
    order: [{ col: "event_date", asc: false }],
    fields: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "event_type", label: "النوع", type: "select", options: EVENT_TYPE },
      { key: "event_date", label: "التاريخ", type: "date", required: true },
      { key: "start_time", label: "يبدأ", type: "time" },
      { key: "end_time", label: "ينتهي", type: "time" },
      { key: "location", label: "المكان", type: "text" },
      { key: "visibility", label: "الظهور", type: "select", options: VIS },
      { key: "class_id", label: "الفصل (اختياري)", type: "select", options: {} },
      { key: "description", label: "الوصف", type: "textarea", full: true },
    ],
    defaults: () => ({ event_date: todayISO(), event_type: "meeting", visibility: "PUBLIC" }),
    summary: (r, cls) => ({
      title: r.title,
      meta: `${fmtLongDate(r.event_date)} · ${EVENT_TYPE[r.event_type] ?? ""} · ${VIS[r.visibility]}${r.class_id ? ` · ${cls[r.class_id] ?? ""}` : ""}`,
    }),
    invalidate: ["events"],
    extra: (uid) => ({ created_by: uid }),
  },
  announcements: {
    table: "announcements",
    title: "الإعلانات",
    addLabel: "إضافة إعلان",
    order: [{ col: "published_on", asc: false }],
    fields: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "published_on", label: "التاريخ", type: "date", required: true },
      { key: "visibility", label: "الظهور", type: "select", options: VIS },
      { key: "class_id", label: "الفصل (اختياري)", type: "select", options: {} },
      { key: "content", label: "المحتوى", type: "textarea", required: true, full: true },
    ],
    defaults: () => ({ published_on: todayISO(), visibility: "PUBLIC" }),
    summary: (r, cls) => ({
      title: r.title,
      meta: `${fmtLongDate(r.published_on)} · ${VIS[r.visibility]}${r.class_id ? ` · ${cls[r.class_id] ?? ""}` : ""}${r.author_name ? ` · ${r.author_name}` : ""}`,
    }),
    invalidate: ["announcements"],
    extra: (uid, name) => ({ author_id: uid, author_name: name }),
  },
  content: {
    table: "content_items",
    title: "الدروس والمحتوى",
    addLabel: "إضافة محتوى",
    order: [{ col: "item_date", asc: false }],
    fields: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "content_type", label: "النوع", type: "select", options: CONTENT_TYPE },
      { key: "url", label: "الرابط / مرجع الملف", type: "url" },
      { key: "item_date", label: "التاريخ", type: "date", required: true },
      { key: "visibility", label: "الظهور", type: "select", options: VIS },
      { key: "class_id", label: "الفصل (اختياري)", type: "select", options: {} },
      { key: "description", label: "الوصف", type: "textarea", full: true },
    ],
    defaults: () => ({ item_date: todayISO(), content_type: "lesson", visibility: "MEMBERS" }),
    summary: (r, cls) => ({
      title: r.title,
      meta: `${CONTENT_TYPE[r.content_type] ?? ""} · ${fmtLongDate(r.item_date)} · ${VIS[r.visibility]}${r.class_id ? ` · ${cls[r.class_id] ?? ""}` : ""}`,
    }),
    invalidate: ["content_items"],
    extra: (uid) => ({ created_by: uid }),
  },
} satisfies Record<string, Config>;

export type ContentKind = keyof typeof CONFIGS;

function useClassMap() {
  return useQuery({
    queryKey: ["class-options"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data ?? [];
    },
  });
}

export function ContentManager({
  kind,
  userId,
  userName,
}: {
  kind: ContentKind;
  userId: string;
  userName: string;
}) {
  const cfg: Config = CONFIGS[kind];
  const qc = useQueryClient();
  const classes = useClassMap();
  const classMap = Object.fromEntries((classes.data ?? []).map((c) => [c.id, c.name]));
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useQuery({
    queryKey: [cfg.table, "admin"],
    queryFn: async () => {
      let q = (supabase.from(cfg.table) as any).select("*");
      for (const o of cfg.order) q = q.order(o.col, { ascending: o.asc });
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [cfg.table] });
    for (const k of cfg.invalidate) qc.invalidateQueries({ queryKey: [k] });
  };

  async function save(form: Record<string, any>) {
    setBusy(true);
    const payload: Record<string, any> = {};
    for (const f of cfg.fields) {
      let v = form[f.key];
      if (v === "" || v === undefined) v = null;
      if (f.key === "hour" || f.type === "number")
        v = v === null ? (f.key === "sort_order" ? 0 : null) : Number(v);
      payload[f.key] = v;
    }
    const isNew = editing === "new";
    const res = isNew
      ? await (supabase.from(cfg.table) as any).insert({
          ...payload,
          ...(cfg.extra?.(userId, userName) ?? {}),
        })
      : await (supabase.from(cfg.table) as any).update(payload).eq("id", (editing as Row).id);
    setBusy(false);
    if (res.error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم الحفظ بنجاح");
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    const { error } = await (supabase.from(cfg.table) as any).delete().eq("id", id);
    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم حذف البيانات بنجاح");
    refresh();
  }

  async function move(r: Row, dir: -1 | 1) {
    await (supabase.from("program_items") as any)
      .update({ sort_order: (r.sort_order ?? 0) + dir })
      .eq("id", r.id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="me-auto font-display text-xl font-black">{cfg.title}</h3>
        <button onClick={() => setEditing("new")} className={`${btn} py-3`}>
          + {cfg.addLabel}
        </button>
      </div>

      {editing && (
        <EditForm
          key={editing === "new" ? "new" : editing.id}
          fields={cfg.fields}
          classOptions={classMap}
          initial={editing === "new" ? cfg.defaults() : editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.isLoading ? (
        <div className="h-24 animate-pulse rounded-3xl bg-ink/5" />
      ) : rows.isError ? (
        <p className="text-sm text-oxblood">حدث خطأ، حاول مرة أخرى</p>
      ) : !rows.data?.length ? (
        <p className={`${card} text-center text-sm text-ink-soft`}>لا توجد بيانات حاليًا</p>
      ) : (
        <ul className="space-y-2">
          {rows.data.map((r) => {
            const s = cfg.summary(r, classMap);
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel px-4 py-3 text-sm ring-1 ring-black/5"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs text-ink-soft">{s.meta}</p>
                </div>
                {kind === "program" && (
                  <>
                    <button
                      onClick={() => move(r, -1)}
                      aria-label="لأعلى"
                      className="rounded-xl bg-ink/5 px-3 py-2"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(r, 1)}
                      aria-label="لأسفل"
                      className="rounded-xl bg-ink/5 px-3 py-2"
                    >
                      ▼
                    </button>
                  </>
                )}
                <button
                  onClick={() => setEditing(r)}
                  className="rounded-xl bg-gold-soft px-3 py-2 font-semibold"
                >
                  تعديل
                </button>
                <ConfirmDelete onConfirm={() => remove(r.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EditForm({
  fields,
  initial,
  classOptions,
  busy,
  onCancel,
  onSave,
}: {
  fields: Field[];
  initial: Record<string, any>;
  classOptions: Record<string, string>;
  busy: boolean;
  onCancel: () => void;
  onSave: (f: Record<string, any>) => void;
}) {
  const [f, setF] = useState<Record<string, any>>(() => {
    const o: Record<string, any> = {};
    for (const x of fields) {
      const v = initial[x.key];
      o[x.key] =
        v === null || v === undefined ? "" : x.type === "time" ? String(v).slice(0, 5) : String(v);
    }
    return o;
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className={`${card} grid gap-3 ring-2 ring-gold sm:grid-cols-2`}
    >
      {fields.map((x) => {
        const common = {
          required: x.required,
          className: inputCls + " py-3",
          value: f[x.key],
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
          ) => setF({ ...f, [x.key]: e.target.value }),
        };
        const opts = x.key === "class_id" ? classOptions : x.options;
        return (
          <label key={x.key} className={`text-sm ${x.full ? "sm:col-span-2" : ""}`}>
            <span className="mb-1 block font-bold">{x.label}</span>
            {x.type === "textarea" ? (
              <textarea rows={4} {...common} />
            ) : x.type === "select" ? (
              <select {...common}>
                {x.key === "class_id" && <option value="">كل الفصول</option>}
                {Object.entries(opts ?? {}).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input type={x.type} dir={x.type === "url" ? "ltr" : undefined} {...common} />
            )}
          </label>
        );
      })}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className={`${btn} flex-1 py-3`}>
          {busy ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl bg-ink/5 px-5 py-3 text-sm font-semibold"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
