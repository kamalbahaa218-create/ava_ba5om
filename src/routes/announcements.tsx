import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementCard } from "@/components/site/AnnouncementCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Failed, Skeleton } from "@/components/site/live";
import { toAnnouncementCard, useAnnouncements } from "@/lib/content";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "الإعلانات — أسرة أبا باخوم" },
      {
        name: "description",
        content: "آخر إعلانات خدمة ثانوي أسرة أبا باخوم: المواعيد والأنشطة والخدمات.",
      },
      { property: "og:title", content: "الإعلانات — أسرة أبا باخوم" },
      {
        property: "og:description",
        content: "تابع إعلانات الأسرة عن الفصول والرحلات والترانيم وخدمة الافتقاد.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const q = useAnnouncements();
  const ANNOUNCEMENTS = (q.data ?? []).map(toAnnouncementCard);
  return (
    <>
      <section className="animate-rise rounded-3xl bg-oxblood p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="mb-3 text-sm font-semibold text-gold-soft">لوحة الإعلانات</p>
        <h1 className="font-display text-3xl font-black sm:text-4xl">آخر الإعلانات</h1>
        <p className="mt-3 max-w-[56ch] text-sm text-paper/70 text-pretty">
          كل ما يحتاج المخدوم أن يعرفه عن المواعيد والأنشطة وطلبات الخدمة.
        </p>
      </section>

      <section className="mt-10">
        <SectionHeading title="الإعلانات" />
        {q.isLoading ? (
          <Skeleton />
        ) : q.isError ? (
          <Failed />
        ) : ANNOUNCEMENTS.length === 0 ? (
          <div className="rounded-3xl bg-panel p-10 text-center ring-1 ring-black/5">
            <p className="font-display text-lg font-bold">لا توجد إعلانات حالياً</p>
            <p className="mt-2 text-sm text-ink-soft">سيظهر هنا كل إعلان جديد من خدام الأسرة.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {ANNOUNCEMENTS.map((announcement, i) => (
              <AnnouncementCard
                key={q.data![i]!.id}
                announcement={announcement}
                tone={i % 3 === 0 ? "ink" : "paper"}
                delay={`${180 + i * 60}ms`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
