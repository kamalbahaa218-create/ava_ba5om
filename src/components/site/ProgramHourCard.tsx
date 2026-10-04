import type { ProgramHour } from "@/lib/content";

export function ProgramHourCard({
  hour,
  tone,
  delay = "180ms",
}: {
  hour: ProgramHour;
  tone: "paper" | "oxblood";
  delay?: string;
}) {
  const isDark = tone === "oxblood";

  return (
    <section
      className={
        "animate-rise2 rounded-3xl p-5 ring-1 ring-black/5 sm:p-7 " +
        (isDark ? "bg-oxblood text-paper" : "bg-panel")
      }
      style={{ animationDelay: delay }}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex">
        <span
          className={
            "grid size-8 shrink-0 place-items-center rounded-xl font-display text-sm font-black " +
            (isDark ? "bg-gold-soft text-oxblood" : "bg-gold text-ink")
          }
        >
          {hour.index}
        </span>
        <h3 className="truncate font-display text-xl font-extrabold">{hour.title}</h3>
        <span
          className={
            "col-span-2 w-fit rounded-full px-3 py-1 text-xs sm:col-span-1 " +
            (isDark ? "bg-black/20 text-paper/70" : "bg-ink/5 text-ink-soft")
          }
        >
          {hour.range}
        </span>
      </div>

      <p className={"mt-3 text-sm " + (isDark ? "text-paper/70" : "text-ink-soft")}>{hour.note}</p>

      <ol className="mt-5 space-y-1">
        {hour.items.map((item, i) => {
          const highlight = !isDark && i === 0;
          return (
            <li
              key={item.title}
              className={
                "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-1 rounded-2xl p-3 transition-colors duration-200 " +
                (highlight ? "bg-ink text-paper" : isDark ? "hover:bg-black/15" : "hover:bg-ink/5")
              }
            >
              <span
                className={
                  "w-14 shrink-0 text-sm font-bold " +
                  (highlight || isDark ? "text-gold-soft" : "text-ink")
                }
              >
                {item.time}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold">{item.title}</span>
                  <span
                    className={
                      "text-xs " + (highlight || isDark ? "text-paper/60" : "text-ink-soft")
                    }
                  >
                    {item.tag}
                  </span>
                </span>
                <span
                  className={
                    "mt-0.5 block text-sm " +
                    (highlight || isDark ? "text-paper/70" : "text-ink-soft")
                  }
                >
                  {item.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
