export function SectionHeading({
  title,
  note,
  delay = "120ms",
}: {
  title: string;
  note?: string;
  delay?: string;
}) {
  return (
    <div className="mb-5 flex animate-rise2 items-center gap-3" style={{ animationDelay: delay }}>
      <h2 className="font-display text-2xl font-black">{title}</h2>
      <span className="rule-line" />
      {note && <span className="hidden text-sm text-ink-soft sm:block">{note}</span>}
    </div>
  );
}
