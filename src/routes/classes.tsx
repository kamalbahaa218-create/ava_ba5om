import { createFileRoute } from "@tanstack/react-router";
import { ClassCard } from "@/components/site/ClassCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Empty, Failed, Skeleton } from "@/components/site/live";
import { usePublicClasses } from "@/lib/content";

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "الفصول — أسرة أبا باخوم" },
      {
        name: "description",
        content: "فصول الثانوي في الساعة الثانية، عدد المخدومين وأسماء الخدام لكل فصل.",
      },
      { property: "og:title", content: "الفصول — أسرة أبا باخوم" },
      {
        property: "og:description",
        content: "تعرّف على فصول الأسرة وخدامها ومواعيد الساعة الثانية.",
      },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const q = usePublicClasses();
  const CLASSES = (q.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    count: Number(c.student_count),
    servants: c.servant_names ?? [],
  }));
  const total = CLASSES.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <section className="animate-rise rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="mb-3 text-sm font-semibold text-gold-soft">الساعة الثانية</p>
        <h1 className="font-display text-3xl font-black sm:text-4xl">فصول الأسرة</h1>
        <p className="mt-3 max-w-[58ch] text-sm text-paper/70 text-pretty">
          بعد الاجتماع العام، يتوزع المخدومون على الفصول، ولكل فصل خدامه ودرسه ومناقشته وأنشطته.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink">
            {CLASSES.length.toLocaleString("ar-EG")} فصول
          </span>
          <span className="rounded-2xl bg-black/20 px-4 py-2 text-paper/80">
            {total.toLocaleString("ar-EG")} مخدوم
          </span>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading title="كل الفصول" />
        {q.isLoading ? (
          <Skeleton />
        ) : q.isError ? (
          <Failed />
        ) : !CLASSES.length ? (
          <Empty text="لا توجد فصول بعد" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {CLASSES.map((room, i) => (
              <ClassCard key={room.id} room={room} delay={`${180 + i * 60}ms`} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
