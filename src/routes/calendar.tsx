import { createFileRoute } from "@tanstack/react-router";
import { EventCard } from "@/components/site/EventCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { useState } from "react";
import { Empty, Failed, Skeleton } from "@/components/site/live";
import { EVENT_TYPE, toEventCard, useEvents } from "@/lib/content";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم — أسرة افا باخوم" },
      {
        name: "description",
        content: "تقويم الشهر ومواعيد الاجتماعات والرحلات والأنشطة القادمة.",
      },
      { property: "og:title", content: "التقويم — أسرة افا باخوم" },
      {
        property: "og:description",
        content: "مواعيد الاجتماعات والرحلات والأنشطة لخدمة ثانوي أسرة افا باخوم.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEK_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const pad = (n: number) => String(n).padStart(2, "0");

function CalendarPage() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState<string | null>(null);
  const q = useEvents();
  const all = q.data ?? [];
  const prefix = `${ym.y}-${pad(ym.m + 1)}`;
  const monthEvents = all.filter((e) => e.event_date.startsWith(prefix));
  const days = new Set(monthEvents.map((e) => Number(e.event_date.slice(8, 10))));
  const blanks = new Date(ym.y, ym.m, 1).getDay();
  const count = new Date(ym.y, ym.m + 1, 0).getDate();
  const label = new Date(ym.y, ym.m, 1).toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
  const shift = (d: number) => {
    setPicked(null);
    setYm(({ y, m }) => {
      const t = new Date(y, m + d, 1);
      return { y: t.getFullYear(), m: t.getMonth() };
    });
  };
  const list = picked ? monthEvents.filter((e) => e.event_date === picked) : monthEvents;

  return (
    <>
      <section className="animate-rise rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="mb-3 text-sm font-semibold text-gold-soft">تقويم الخدمة</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="me-auto font-display text-3xl font-black sm:text-4xl">{label}</h1>
          <button
            onClick={() => shift(-1)}
            className="rounded-2xl bg-paper/10 px-4 py-2.5 text-sm font-bold"
          >
            → السابق
          </button>
          <button
            onClick={() => shift(1)}
            className="rounded-2xl bg-gold px-4 py-2.5 text-sm font-bold text-ink"
          >
            التالي ←
          </button>
        </div>
        <p className="mt-3 text-sm text-paper/70">
          الأيام المميزة بالذهبي بها اجتماع أو نشاط. اضغط على اليوم لعرض فعالياته.
        </p>
      </section>

      <section className="mt-8 animate-rise2 rounded-3xl bg-panel p-3 ring-1 ring-black/5 sm:p-6">
        <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="truncate pb-2 text-[10px] font-bold text-ink-soft sm:text-xs">
              {day}
            </div>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <div key={`b-${i}`} />
          ))}
          {Array.from({ length: count }).map((_, i) => {
            const day = i + 1;
            const iso = `${prefix}-${pad(day)}`;
            const has = days.has(day);
            return (
              <button
                key={day}
                disabled={!has}
                onClick={() => setPicked(picked === iso ? null : iso)}
                className={
                  "grid aspect-square place-items-center rounded-xl font-display text-sm font-bold sm:rounded-2xl " +
                  (picked === iso
                    ? "bg-oxblood text-gold-soft"
                    : has
                      ? "bg-gold text-ink"
                      : "bg-ink/5 text-ink-soft")
                }
              >
                {day.toLocaleString("ar-EG")}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading title={picked ? "فعاليات اليوم المختار" : "فعاليات الشهر"} />
        {q.isLoading ? (
          <Skeleton />
        ) : q.isError ? (
          <Failed />
        ) : !list.length ? (
          <Empty text="لا توجد فعاليات في هذا الشهر" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e, i) => (
              <div key={e.id} className="relative">
                <span className="absolute end-4 top-4 z-10 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink-soft">
                  {EVENT_TYPE[e.event_type] ?? e.event_type}
                </span>
                <EventCard event={toEventCard(e)} detailed delay={`${120 + i * 40}ms`} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
