import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccessDenied, Loading } from "@/components/site/AccessDenied";
import { SectionHeading } from "@/components/site/SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import { useMyPermissions, useMyProfile } from "@/lib/auth";
import { FollowupPanel, Leaderboard, PointsManager, SessionsPanel } from "@/components/site/part3";
import { Link } from "@tanstack/react-router";
import {
  AnnouncementsSection,
  EventsSection,
  ProgramSection,
  TopicCard,
} from "@/components/site/live";
import { ContentManager } from "@/components/site/ContentManager";

export const Route = createFileRoute("/_authenticated/servant")({
  head: () => ({
    meta: [
      { title: "لوحة الخادم — أسرة أبا باخوم" },
      { name: "description", content: "فصولك ومخدوموك وصلاحياتك." },
    ],
  }),
  component: ServantPage,
});

function ServantPage() {
  const { user } = Route.useRouteContext();
  const profile = useMyProfile(user.id);
  const perms = useMyPermissions(user.id);

  const classes = useQuery({
    queryKey: ["servant-classes", user.id],
    queryFn: async () => {
      const { data: cs } = await supabase
        .from("class_servants")
        .select("class_id, classes(id, name, description)")
        .eq("servant_id", user.id);
      const ids = (cs ?? []).map((c) => c.class_id);
      const { data: members } = ids.length
        ? await supabase
            .from("class_members")
            .select("class_id, student_id, profiles(full_name, phone)")
            .in("class_id", ids)
        : { data: [] as never[] };
      return (cs ?? []).map((c) => ({
        ...c.classes!,
        students: (members ?? []).filter((m) => m.class_id === c.class_id),
      }));
    },
  });

  if (profile.isLoading) return <Loading />;
  if (profile.data?.user_type !== "SERVANT") return <AccessDenied />;
  const has = (n: string) => !!perms.data?.some((p) => p.name === n);
  const cls = classes.data ?? [];
  const myStudents = cls.flatMap((c) =>
    c.students.map((s) => ({
      id: s.student_id,
      full_name: s.profiles?.full_name ?? "",
      className: c.name,
    })),
  );
  const uniq = [...new Map(myStudents.map((s) => [s.id, s])).values()];

  return (
    <>
      <section className="animate-rise rounded-3xl bg-ink p-6 text-paper ring-1 ring-black/5 sm:p-8">
        <p className="text-sm font-semibold text-gold-soft">لوحة الخادم</p>
        <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">
          {profile.data.full_name}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink">
            {classes.data?.length ?? 0} فصول
          </span>
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading title="تسجيل الحضور" note="جلسات QR" />
        {cls.length || has("manage_attendance") ? (
          <SessionsPanel
            userId={user.id}
            classes={cls.map((c) => ({ id: c.id, name: c.name }))}
            canFirstHour={has("manage_attendance")}
          />
        ) : (
          <p className="text-sm text-ink-soft">لا يمكنك إنشاء جلسات حضور حاليًا.</p>
        )}
      </section>

      {(uniq.length > 0 || has("manage_followup")) && (
        <section className="mt-12">
          <SectionHeading title="الافتقاد" />
          <FollowupPanel userId={user.id} students={uniq} />
        </section>
      )}

      {has("manage_points") && (
        <section className="mt-12">
          <SectionHeading title="النقاط" />
          <PointsManager userId={user.id} students={uniq} />
        </section>
      )}

      {cls[0] && <Leaderboard classId={cls[0].id} title={`ترتيب الفصل — ${cls[0].name}`} />}

      <section className="mt-12">
        <SectionHeading title="موضوع اليوم" />
        <TopicCard compact />
      </section>
      <ProgramSection />
      <EventsSection limit={3} title="التقويم" />
      <AnnouncementsSection title="الإعلانات" />

      {(has("manage_lessons") || has("manage_calendar") || has("manage_announcements")) && (
        <section className="mt-12 space-y-10">
          <SectionHeading title="إدارة المحتوى" note="حسب صلاحياتك" />
          {has("manage_lessons") && (
            <ContentManager kind="topics" userId={user.id} userName={profile.data.full_name} />
          )}
          {has("manage_lessons") && (
            <ContentManager kind="program" userId={user.id} userName={profile.data.full_name} />
          )}
          {has("manage_calendar") && (
            <ContentManager kind="events" userId={user.id} userName={profile.data.full_name} />
          )}
          {has("manage_announcements") && (
            <ContentManager
              kind="announcements"
              userId={user.id}
              userName={profile.data.full_name}
            />
          )}
          {has("manage_lessons") && (
            <ContentManager kind="content" userId={user.id} userName={profile.data.full_name} />
          )}
        </section>
      )}

      <section className="mt-12">
        <SectionHeading title="الصلاحيات المتاحة لك" />
        {perms.data?.length ? (
          <div className="flex flex-wrap gap-2">
            {perms.data.map((p) => (
              <span
                key={p.name}
                className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-bold text-ink"
              >
                {p.description ?? p.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">لا توجد صلاحيات إضافية. يمكنك رؤية فصولك فقط.</p>
        )}
      </section>

      <section className="mt-12">
        <SectionHeading title="فصولي ومخدوميني" />
        {classes.isLoading ? (
          <Loading />
        ) : classes.data?.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {classes.data.map((c) => (
              <article key={c.id} className="rounded-3xl bg-panel p-6 ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-black">{c.name}</h3>
                  <span className="rounded-full bg-ink/5 px-3 py-1 text-xs">
                    {c.students.length} مخدوم
                  </span>
                </div>
                {c.description && <p className="mt-2 text-sm text-ink-soft">{c.description}</p>}
                <ul className="mt-4 space-y-1.5">
                  {c.students.map((s) => (
                    <li
                      key={s.student_id}
                      className="flex justify-between rounded-2xl bg-paper px-4 py-2 text-sm"
                    >
                      <span>{s.profiles?.full_name}</span>
                      <span className="text-xs text-ink-soft" dir="ltr">
                        {s.profiles?.phone}
                      </span>
                    </li>
                  ))}
                  {!c.students.length && (
                    <li className="text-sm text-ink-soft">لا يوجد مخدومون بعد.</li>
                  )}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">لم يتم تعيينك لأي فصل بعد.</p>
        )}
      </section>
    </>
  );
}
