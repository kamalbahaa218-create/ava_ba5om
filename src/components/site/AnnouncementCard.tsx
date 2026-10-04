import type { Announcement } from "@/lib/content";

export function AnnouncementCard({
  announcement,
  tone = "paper",
  delay = "180ms",
  withAction = false,
}: {
  announcement: Announcement;
  tone?: "paper" | "ink";
  delay?: string;
  withAction?: boolean;
}) {
  const isDark = tone === "ink";

  return (
    <article
      className={
        "animate-rise2 rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-1 " +
        (isDark ? "bg-ink text-paper" : "bg-panel ring-1 ring-black/5")
      }
      style={{ animationDelay: delay }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (isDark ? "bg-gold/20 text-gold-soft" : "bg-oxblood/10 text-oxblood")
          }
        >
          {announcement.badge}
        </span>
        <span className={"text-xs " + (isDark ? "text-paper/60" : "text-ink-soft")}>
          {announcement.date}
        </span>
      </div>
      <h4 className="mb-1 mt-3 font-display text-lg font-bold">{announcement.title}</h4>
      <p className={"text-sm text-pretty " + (isDark ? "text-paper/70" : "text-ink-soft")}>
        {announcement.description}
      </p>
      {withAction && (
        <button
          type="button"
          className={
            "mt-4 rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 " +
            (isDark ? "bg-gold text-ink" : "bg-ink text-paper")
          }
        >
          قراءة التفاصيل
        </button>
      )}
    </article>
  );
}
