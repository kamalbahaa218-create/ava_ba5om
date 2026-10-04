export type ClassRoom = {
  name: string;
  description: string;
  count: number;
  servants: string[];
  room?: string;
};

export function ClassCard({ room, delay = "180ms" }: { room: ClassRoom; delay?: string }) {
  return (
    <article
      className="animate-rise2 rounded-3xl bg-panel p-5 ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h4 className="min-w-0 font-display text-lg font-bold leading-snug">{room.name}</h4>
        <span className="shrink-0 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-ink">
          {room.count} مخدوم
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft text-pretty">{room.description}</p>

      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-xs font-bold text-oxblood">الخدام</p>
        <ul className="flex flex-wrap gap-2">
          {room.servants.map((servant) => (
            <li
              key={servant}
              className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink"
            >
              {servant}
            </li>
          ))}
        </ul>
        {room.room && <p className="mt-3 text-xs text-ink-soft">مكان الفصل: {room.room}</p>}
      </div>
    </article>
  );
}
