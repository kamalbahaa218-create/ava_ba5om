import type { Event } from "@/lib/content";

export function EventCard({
  event,
  delay = "180ms",
  detailed = false,
}: {
  event: Event;
  delay?: string;
  detailed?: boolean;
}) {
  return (
    <article
      className="animate-rise2 rounded-3xl bg-panel p-5 ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-black text-gold">{event.day}</span>
        <span className="text-sm text-ink-soft">{event.month}</span>
      </div>
      <h4 className="mb-1 font-display text-lg font-bold leading-snug">{event.title}</h4>
      <p className="text-sm text-ink-soft">{event.description}</p>
      {detailed && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-ink/5 px-3 py-1 text-ink-soft">{event.time}</span>
          <span className="rounded-full bg-gold-soft px-3 py-1 font-semibold text-ink">
            {event.place}
          </span>
        </div>
      )}
    </article>
  );
}
