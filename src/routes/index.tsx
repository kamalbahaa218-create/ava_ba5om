import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHeading } from "@/components/site/SectionHeading";
import {
  AnnouncementsSection,
  EventsSection,
  ProgramSection,
  TopicCard,
} from "@/components/site/live";
import { CHURCH_NAME, SERVICE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أسرة أبا باخوم — الرئيسية" },
      {
        name: "description",
        content:
          "موضوع اليوم وفقرات الساعة الأولى والثانية والفعاليات والإعلانات لخدمة ثانوي أسرة أبا باخوم.",
      },
      { property: "og:title", content: "أسرة أبا باخوم — الرئيسية" },
      {
        property: "og:description",
        content: "خدمة مدارس الأحد للثانوي: موضوع اليوم، البرنامج، الفعاليات والإعلانات.",
      },
    ],
  }),
  component: Home,
});

const QUICK_NAV = [
  { to: "/calendar", label: "التقويم", note: "مواعيد الشهر", letter: "ق", tone: "gold-soft" },
  { to: "/classes", label: "الفصول", note: "الفصول والخدام", letter: "ف", tone: "panel" },
  { to: "/dashboard", label: "لوحتي", note: "الحضور والنقاط", letter: "د", tone: "ink" },
  { to: "/program", label: "موضوع اليوم", note: "الفقرات والمواعيد", letter: "م", tone: "gold" },
] as const;

function Home() {
  return (
    <>
      <section className="animate-rise [animation-delay:60ms]">
        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8 lg:col-span-7">
            <div className="pointer-events-none absolute -top-8 -end-8 size-40 rounded-full bg-gold/20" />
            <div className="pointer-events-none absolute -bottom-12 -start-6 size-32 rounded-full bg-oxblood/40" />
            <div className="relative">
              <p className="mb-3 text-sm font-semibold text-gold-soft">أهلاً وسهلاً بك</p>
              <h1 className="max-w-[22ch] font-display text-3xl font-black leading-[1.35] text-balance sm:text-4xl">
                {CHURCH_NAME}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink">
                  {SERVICE_NAME}
                </span>
                <span className="text-paper/70">
                  {new Date().toLocaleDateString("ar-EG", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <TopicCard />
          </div>
        </div>
      </section>

      <ProgramSection title="برنامج اليوم" />
      <EventsSection />
      <AnnouncementsSection />

      <section className="mt-12">
        <SectionHeading title="تنقّل سريع" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {QUICK_NAV.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                "animate-rise2 rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-1 " +
                (item.tone === "ink"
                  ? "bg-ink text-paper"
                  : item.tone === "gold"
                    ? "bg-gold"
                    : item.tone === "gold-soft"
                      ? "bg-gold-soft"
                      : "bg-panel ring-1 ring-black/5")
              }
              style={{ animationDelay: `${180 + i * 50}ms` }}
            >
              <span
                className={
                  "mb-4 grid size-11 place-items-center rounded-2xl font-display font-black " +
                  (item.tone === "ink"
                    ? "bg-gold text-ink"
                    : item.tone === "panel"
                      ? "bg-oxblood text-gold-soft"
                      : "bg-ink text-gold-soft")
                }
              >
                {item.letter}
              </span>
              <span className="block font-display text-base font-bold">{item.label}</span>
              <span
                className={
                  "mt-1 block text-xs " + (item.tone === "ink" ? "text-paper/70" : "text-ink-soft")
                }
              >
                {item.note}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
