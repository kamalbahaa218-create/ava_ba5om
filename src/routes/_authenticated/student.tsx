import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccessDenied, Loading } from "@/components/site/AccessDenied";
import { SectionHeading } from "@/components/site/SectionHeading";
import {
  AnnouncementsSection,
  EventsSection,
  ProgramSection,
  TopicCard,
} from "@/components/site/live";
import { useCurrentTopic } from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { Leaderboard, MyAttendance, MyPoints } from "@/components/site/part3";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({
    meta: [
      { title: "لوحة المخدوم — أسرة أبا باخوم" },
      { name: "description", content: "فصلك، خدامك، موضوع اليوم والفقرات." },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const { user } = Route.useRouteContext();
  const profile = useMyProfile(user.id);
  const topic = useCurrentTopic();

  const myClass = useQuery({
    queryKey: ["student-class", user.id],
    queryFn: async () => {
      const { data: m } = await supabase
        .from("class_members")
        .select("class_id, classes(id, name, description)")
        .eq("student_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!m) return null;
      const { data: s } = await supabase
        .from("class_servants")
        .select("servant_id, profiles(full_name, phone)")
        .eq("class_id", m.class_id);
      return { cls: m.classes, servants: s ?? [] };
    },
  });

  if (profile.isLoading) return <Loading />;
  if (profile.data?.user_type !== "STUDENT") return <AccessDenied />;

  return (
    <>
      <section className="animate-rise grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8 lg:col-span-7">
          <p className="text-sm font-semibold text-gold-soft">لوحة المخدوم</p>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">
            مرحبًا، {profile.data.full_name || ""}
          </h1>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink">
              {myClass.data?.cls?.name ?? "لم يتم تعيين فصل بعد"}
            </span>
            <span className="rounded-2xl bg-black/20 px-4 py-2 text-paper/80">
              موضوع اليوم: {topic.data?.title ?? "—"}
            </span>
          </div>
        </div>
        <div className="rounded-3xl bg-gold-soft p-6 ring-1 ring-black/5 lg:col-span-5">
          <p className="text-xs font-bold text-oxblood">الخدام المسؤولون عنك</p>
          {myClass.data?.servants.length ? (
            <ul className="mt-3 space-y-2">
              {myClass.data.servants.map((s) => (
                <li
                  key={s.servant_id}
                  className="rounded-2xl bg-paper/70 px-4 py-2.5 text-sm font-semibold text-ink"
                >
                  {s.profiles?.full_name}
                  {s.profiles?.phone && (
                    <span className="ms-2 text-xs font-normal text-ink-soft" dir="ltr">
                      {s.profiles.phone}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/70">لا يوجد خدام معيّنون بعد.</p>
          )}
        </div>
      </section>

      <div className="mt-6 rounded-3xl bg-panel p-5 text-sm ring-1 ring-black/5">
        <p className="font-display font-black">مسح QR</p>
        <p className="mt-1 text-ink-soft">
          لتسجيل الحضور: افتح كاميرا الموبايل ووجّهها إلى الكود الذي يعرضه الخادم.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            href="#points"
            className="rounded-2xl bg-oxblood px-4 py-3 text-center font-bold text-gold-soft"
          >
            سجل النقاط
          </a>
          <a
            href="#attendance"
            className="rounded-2xl bg-ink px-4 py-3 text-center font-bold text-paper"
          >
            سجل الحضور
          </a>
          <Link
            to="/calendar"
            className="rounded-2xl bg-gold px-4 py-3 text-center font-bold text-ink"
          >
            التقويم
          </Link>
          <Link
            to="/announcements"
            className="rounded-2xl bg-gold-soft px-4 py-3 text-center font-bold text-ink"
          >
            الإعلانات
          </Link>
        </div>
      </div>

      <div id="points">
        <MyPoints userId={user.id} />
      </div>
      <div id="attendance">
        <MyAttendance userId={user.id} />
      </div>
      <Leaderboard />

      <section className="mt-12">
        <SectionHeading title="موضوع اليوم" />
        <TopicCard />
      </section>
      <ProgramSection />
      <EventsSection limit={2} title="التقويم" />
      <AnnouncementsSection title="الإعلانات" />
    </>
  );
}
