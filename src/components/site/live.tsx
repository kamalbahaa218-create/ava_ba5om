import { Link } from "@tanstack/react-router";
import { AnnouncementCard } from "./AnnouncementCard";
import { EventCard } from "./EventCard";
import { ProgramHourCard } from "./ProgramHourCard";
import { SectionHeading } from "./SectionHeading";
import {
  fmtLongDate,
  toAnnouncementCard,
  toEventCard,
  useAnnouncements,
  useCurrentProgram,
  useCurrentTopic,
  useEvents,
} from "@/lib/content";

export function Empty({ text = "لا توجد بيانات حاليًا", note }: { text?: string; note?: string }) {
  return (
    <div className="rounded-3xl bg-panel p-8 text-center ring-1 ring-black/5">
      <p className="font-display font-bold">{text}</p>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
    </div>
  );
}
export function Failed() {
  return <Empty text="حدث خطأ، حاول مرة أخرى" />;
}
export function Skeleton({ h = "h-32" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-3xl bg-ink/5`} />;
}

export function TopicCard({ compact = false }: { compact?: boolean }) {
  const q = useCurrentTopic();
  if (q.isLoading) return <Skeleton h="h-48" />;
  if (q.isError) return <Failed />;
  const t = q.data;
  if (!t) return <Empty text="لم يُضف موضوع اليوم بعد" />;
  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gold-soft ring-1 ring-black/5">
      {t.image_url && !compact && (
        <img src={t.image_url} alt={t.title} className="h-44 w-full object-cover" loading="lazy" />
      )}
      <div className="p-6 sm:p-7">
        <p className="mb-1 font-display text-lg font-extrabold text-oxblood">موضوع اليوم</p>
        <p className="mb-2 text-xs text-ink-soft">{fmtLongDate(t.topic_date)}</p>
        <h2 className="mb-3 font-display text-2xl font-black leading-snug text-ink">{t.title}</h2>
        {t.description && <p className="text-sm text-ink/70 text-pretty">{t.description}</p>}
        {t.speaker && (
          <p className="mt-2 text-xs font-semibold text-ink-soft">يقدمه: {t.speaker}</p>
        )}
        {t.verse && (
          <div className="mt-4 border-t border-oxblood/20 pt-4">
            <p className="mb-1 text-xs font-bold text-oxblood">آية اليوم</p>
            <p className="font-display font-semibold leading-relaxed text-ink text-pretty">
              {t.verse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgramSection({
  title = "فقرات اليوم",
  split = false,
}: {
  title?: string;
  split?: boolean;
}) {
  const q = useCurrentProgram();
  const hours = q.data?.hours ?? [];
  const has = hours.some((h) => h.items.length);
  return (
    <section className="mt-12">
      <SectionHeading title={title} note={q.data?.date ? fmtLongDate(q.data.date) : ""} />
      {q.isLoading ? (
        <Skeleton />
      ) : q.isError ? (
        <Failed />
      ) : !has ? (
        <Empty text="لم يُضف برنامج اليوم بعد" />
      ) : (
        <div className={split ? "space-y-10" : "grid gap-5 lg:grid-cols-2"}>
          {hours.map((h, i) =>
            h.items.length ? (
              <div key={h.title}>
                {split && <SectionHeading title={h.title} note={h.note} />}
                <ProgramHourCard hour={h} tone={i === 0 ? "paper" : "oxblood"} delay="180ms" />
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}

export function EventsSection({
  limit = 3,
  title = "الفعاليات القادمة",
  link = true,
}: {
  limit?: number;
  title?: string;
  link?: boolean;
}) {
  const q = useEvents({ upcoming: true, limit });
  return (
    <section className="mt-12">
      <SectionHeading title={title} />
      {q.isLoading ? (
        <Skeleton />
      ) : q.isError ? (
        <Failed />
      ) : !q.data?.length ? (
        <Empty text="لا توجد فعاليات قادمة" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((e, i) => (
            <EventCard key={e.id} event={toEventCard(e)} detailed delay={`${180 + i * 60}ms`} />
          ))}
        </div>
      )}
      {link && (
        <Link to="/calendar" className="mt-4 inline-block py-2 text-sm font-semibold text-oxblood">
          عرض التقويم كاملًا ←
        </Link>
      )}
    </section>
  );
}

export function AnnouncementsSection({
  limit = 2,
  title = "أحدث الإعلانات",
}: {
  limit?: number;
  title?: string;
}) {
  const q = useAnnouncements(limit);
  return (
    <section className="mt-12">
      <SectionHeading title={title} />
      {q.isLoading ? (
        <Skeleton />
      ) : q.isError ? (
        <Failed />
      ) : !q.data?.length ? (
        <Empty text="لا توجد إعلانات حالياً" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {q.data.map((a, i) => (
            <AnnouncementCard
              key={a.id}
              announcement={toAnnouncementCard(a)}
              tone={i === 0 ? "ink" : "paper"}
            />
          ))}
        </div>
      )}
      <Link
        to="/announcements"
        className="mt-4 inline-block py-2 text-sm font-semibold text-oxblood"
      >
        كل الإعلانات ←
      </Link>
    </section>
  );
}
