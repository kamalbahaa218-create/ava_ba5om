import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Topic = T["topics"]["Row"];
export type ProgramRow = T["program_items"]["Row"];
export type EventRow = T["events"]["Row"];
export type AnnouncementRow = T["announcements"]["Row"];
export type ContentRow = T["content_items"]["Row"];
export type Visibility = Database["public"]["Enums"]["content_visibility"];

/* Card view models (used by the shared cards in components/site) */
export type ProgramItem = { time: string; title: string; description: string; tag: string };
export type ProgramHour = {
  index: string;
  title: string;
  range: string;
  note: string;
  items: ProgramItem[];
};
export type Event = {
  day: string;
  month: string;
  title: string;
  description: string;
  time: string;
  place: string;
  dateKey: number;
};
export type Announcement = { badge: string; title: string; date: string; description: string };

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PUBLIC: "للجميع",
  MEMBERS: "لأعضاء الخدمة",
  SERVANTS: "للخدام فقط",
};
export const PROGRAM_CATEGORY: Record<string, string> = {
  prayer: "الصلاة",
  hymns: "الترانيم",
  topic: "موضوع اليوم",
  verse: "آية اليوم",
  activity: "نشاط",
  announcement: "إعلان",
  lesson: "درس الفصل",
  discussion: "مناقشة",
  other: "فقرة",
};
export const EVENT_TYPE: Record<string, string> = {
  meeting: "اجتماع",
  trip: "رحلة",
  conference: "مؤتمر",
  competition: "مسابقة",
  activity: "نشاط",
  servants_meeting: "اجتماع خدام",
  special: "مناسبة خاصة",
};
export const CONTENT_TYPE: Record<string, string> = {
  lesson: "درس",
  reference: "مرجع",
  hymn: "ترنيمة",
  video: "فيديو",
  file: "ملف",
};

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const parseDate = (s: string) => new Date(`${s}T00:00:00`);
export const fmtLongDate = (s: string) =>
  parseDate(s).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const fmtTime = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });
};

/** Pick the nearest upcoming date (today or later), else the most recent past one. */
function pickDate(dates: string[]) {
  const t = todayISO();
  const up = dates.filter((d) => d >= t).sort();
  if (up.length) return up[0]!;
  return dates.sort().at(-1) ?? null;
}

export function useCurrentTopic() {
  return useQuery({
    queryKey: ["topics", "current"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("topic_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      const d = pickDate((data ?? []).map((x) => x.topic_date));
      return (data ?? []).find((x) => x.topic_date === d) ?? null;
    },
  });
}

export function useCurrentProgram() {
  return useQuery({
    queryKey: ["program_items", "current"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_items")
        .select("*")
        .order("program_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      const d = pickDate([...new Set((data ?? []).map((x) => x.program_date))]);
      const rows = (data ?? []).filter((x) => x.program_date === d);
      return { date: d, hours: toHours(rows) };
    },
  });
}

export function toHours(rows: ProgramRow[]): ProgramHour[] {
  const make = (h: 1 | 2): ProgramHour => {
    const items = rows
      .filter((r) => r.hour === h)
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order || (a.start_time ?? "").localeCompare(b.start_time ?? ""),
      );
    const times = items.map((i) => i.start_time).filter(Boolean) as string[];
    return {
      index: h === 1 ? "١" : "٢",
      title: h === 1 ? "الساعة الأولى" : "الساعة الثانية",
      range: times.length ? `${fmtTime(times[0]!)} – ${fmtTime(times.at(-1)!)}` : "",
      note: h === 1 ? "كل مخدومي الثانوي معًا" : "كل فصل مع خدامه",
      items: items.map((i) => ({
        time: fmtTime(i.start_time),
        title: i.title,
        description: i.description ?? "",
        tag: PROGRAM_CATEGORY[i.category] ?? "فقرة",
      })),
    };
  };
  return [make(1), make(2)];
}

export function useEvents(opts: { upcoming?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ["events", opts],
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("event_date").order("start_time");
      if (opts.upcoming) q = q.gte("event_date", todayISO());
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function toEventCard(e: EventRow): Event {
  const d = parseDate(e.event_date);
  const time = [fmtTime(e.start_time), fmtTime(e.end_time)].filter(Boolean).join(" – ");
  return {
    day: d.toLocaleDateString("ar-EG", { day: "2-digit" }),
    month: d.toLocaleDateString("ar-EG", { month: "long" }),
    title: e.title,
    description: e.description ?? "",
    time: time || "—",
    place: e.location || "—",
    dateKey: d.getDate(),
  };
}

export function useAnnouncements(limit?: number) {
  return useQuery({
    queryKey: ["announcements", limit ?? null],
    queryFn: async () => {
      let q = supabase
        .from("announcements")
        .select("*")
        .order("published_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function toAnnouncementCard(a: AnnouncementRow): Announcement {
  return {
    badge: a.visibility === "PUBLIC" ? "إعلان" : VISIBILITY_LABEL[a.visibility],
    title: a.title,
    date: parseDate(a.published_on).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    description: a.content + (a.author_name ? ` — ${a.author_name}` : ""),
  };
}

export function useContentItems() {
  return useQuery({
    queryKey: ["content_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("item_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublicClasses() {
  return useQuery({
    queryKey: ["public-classes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_classes");
      if (error) throw error;
      return data ?? [];
    },
  });
}
