ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE TYPE public.content_visibility AS ENUM ('PUBLIC','MEMBERS','SERVANTS');

CREATE OR REPLACE FUNCTION public.can_see_content(_vis public.content_visibility, _class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select _vis = 'PUBLIC'
    or (auth.uid() is not null and (
         public.is_main_admin(auth.uid())
         or (_vis = 'SERVANTS' and exists (select 1 from public.profiles where id = auth.uid() and user_type = 'SERVANT'))
         or (_vis = 'MEMBERS' and (_class is null or public.is_member_of_class(auth.uid(), _class)
               or public.is_servant_of_class(auth.uid(), _class) or public.has_permission(auth.uid(), 'view_classes')))
       ))
$$;

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  verse text,
  speaker text,
  description text,
  image_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX topics_date_idx ON public.topics(topic_date DESC);

CREATE TABLE public.program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_date date NOT NULL DEFAULT CURRENT_DATE,
  hour smallint NOT NULL CHECK (hour IN (1,2)),
  category text NOT NULL DEFAULT 'other',
  start_time time,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX program_items_date_idx ON public.program_items(program_date, hour, sort_order);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  description text,
  event_type text NOT NULL DEFAULT 'meeting',
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  visibility public.content_visibility NOT NULL DEFAULT 'PUBLIC',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_date_idx ON public.events(event_date);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  published_on date NOT NULL DEFAULT CURRENT_DATE,
  author_name text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  visibility public.content_visibility NOT NULL DEFAULT 'PUBLIC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_date_idx ON public.announcements(published_on DESC);

CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'lesson',
  url text,
  item_date date NOT NULL DEFAULT CURRENT_DATE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  visibility public.content_visibility NOT NULL DEFAULT 'MEMBERS',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_items_date_idx ON public.content_items(item_date DESC);

GRANT SELECT ON public.topics, public.program_items, public.events, public.announcements, public.content_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics, public.program_items, public.events, public.announcements, public.content_items TO authenticated;
GRANT ALL ON public.topics, public.program_items, public.events, public.announcements, public.content_items TO service_role;

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY topics_select ON public.topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topics_write ON public.topics FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'manage_lessons')) WITH CHECK (public.has_permission(auth.uid(),'manage_lessons'));
CREATE POLICY program_select ON public.program_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY program_write ON public.program_items FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'manage_lessons')) WITH CHECK (public.has_permission(auth.uid(),'manage_lessons'));
CREATE POLICY events_select ON public.events FOR SELECT TO anon, authenticated USING (public.can_see_content(visibility, class_id) OR public.has_permission(auth.uid(),'manage_calendar'));
CREATE POLICY events_write ON public.events FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'manage_calendar')) WITH CHECK (public.has_permission(auth.uid(),'manage_calendar'));
CREATE POLICY ann_select ON public.announcements FOR SELECT TO anon, authenticated USING (public.can_see_content(visibility, class_id) OR public.has_permission(auth.uid(),'manage_announcements'));
CREATE POLICY ann_write ON public.announcements FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'manage_announcements')) WITH CHECK (public.has_permission(auth.uid(),'manage_announcements'));
CREATE POLICY content_select ON public.content_items FOR SELECT TO anon, authenticated USING (public.can_see_content(visibility, class_id) OR public.has_permission(auth.uid(),'manage_lessons'));
CREATE POLICY content_write ON public.content_items FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'manage_lessons')) WITH CHECK (public.has_permission(auth.uid(),'manage_lessons'));

CREATE TRIGGER topics_touch BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER program_touch BEFORE UPDATE ON public.program_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER ann_touch BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER content_touch BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.get_public_classes()
RETURNS TABLE(id uuid, name text, description text, student_count bigint, servant_names text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select c.id, c.name, c.description,
    (select count(*) from public.class_members m where m.class_id = c.id),
    coalesce((select array_agg(p.full_name order by p.full_name) from public.class_servants s join public.profiles p on p.id = s.servant_id where s.class_id = c.id and p.is_active), '{}')
  from public.classes c order by c.name
$$;
GRANT EXECUTE ON FUNCTION public.get_public_classes() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_class_summary(_class uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
begin
  if not (public.is_main_admin(auth.uid()) or public.is_servant_of_class(auth.uid(), _class) or public.has_permission(auth.uid(),'view_classes')) then
    return null; end if;
  return jsonb_build_object(
    'attendance', (select count(*) from public.attendance_records r join public.class_members m on m.student_id = r.student_id where m.class_id = _class),
    'points', (select coalesce(sum(t.amount),0) from public.point_transactions t join public.class_members m on m.student_id = t.student_id where m.class_id = _class),
    'followups', (select count(*) from public.followup_records f join public.class_members m on m.student_id = f.student_id where m.class_id = _class and f.status in ('ABSENT','NEEDS_FOLLOWUP'))
  );
end $$;
GRANT EXECUTE ON FUNCTION public.get_class_summary(uuid) TO authenticated;