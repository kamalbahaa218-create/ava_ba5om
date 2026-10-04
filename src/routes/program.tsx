import { createFileRoute } from "@tanstack/react-router";
import { ProgramSection, TopicCard } from "@/components/site/live";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      { title: "موضوع وفقرات اليوم — أسرة أبا باخوم" },
      {
        name: "description",
        content: "موضوع اليوم وآية اليوم وفقرات الساعة الأولى والساعة الثانية بمواعيدها.",
      },
      { property: "og:title", content: "موضوع وفقرات اليوم — أسرة أبا باخوم" },
      {
        property: "og:description",
        content: "برنامج اجتماع الثانوي: الساعة الأولى معًا، والساعة الثانية في الفصول.",
      },
    ],
  }),
  component: ProgramPage,
});

function ProgramPage() {
  return (
    <>
      <section className="animate-rise rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="mb-3 text-sm font-semibold text-gold-soft">موضوع وفقرات اليوم</p>
        <h1 className="font-display text-3xl font-black leading-snug sm:text-4xl">
          برنامج الاجتماع
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm text-paper/70 text-pretty">
          الساعة الأولى معًا، والساعة الثانية داخل الفصول.
        </p>
      </section>
      <section className="mt-8">
        <TopicCard />
      </section>
      <ProgramSection title="فقرات اليوم" split />
    </>
  );
}
