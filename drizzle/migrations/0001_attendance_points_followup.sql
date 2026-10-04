create type public.session_type as enum ('FIRST_HOUR','CLASS_HOUR');
create type public.point_type as enum ('attendance','activity','competition','special_event','manual_adjustment');
create type public.followup_status as enum ('PRESENT','ABSENT','CONTACTED','NEEDS_FOLLOWUP','DONE');
create type public.leaderboard_mode as enum ('DISABLED','CLASS','SERVICE');

-- helpers
create or replace function public.is_servant_of_student(_uid uuid, _student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_servants cs join public.class_members cm on cm.class_id = cs.class_id
                 where cs.servant_id = _uid and cm.student_id = _student)
$$;

-- settings (singleton)
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  leaderboard_mode public.leaderboard_mode not null default 'CLASS',
  first_hour_points int not null default 10 check (first_hour_points between 0 and 1000),
  class_hour_points int not null default 5 check (class_hour_points between 0 and 1000),
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);
grant select, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy settings_select on public.app_settings for select to authenticated using (true);
create policy settings_update on public.app_settings for update to authenticated
  using (public.is_main_admin(auth.uid())) with check (public.is_main_admin(auth.uid()));

-- sessions
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  session_type public.session_type not null,
  class_id uuid references public.classes(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint class_required check ((session_type = 'CLASS_HOUR') = (class_id is not null)),
  constraint expiry_after_start check (expires_at > start_time)
);
create index on public.attendance_sessions (is_active, expires_at);
create index on public.attendance_sessions (class_id);
grant select, insert, update on public.attendance_sessions to authenticated;
grant all on public.attendance_sessions to service_role;
alter table public.attendance_sessions enable row level security;

create or replace function public.can_manage_session(_uid uuid, _type public.session_type, _class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_permission(_uid, 'manage_attendance')
    or (_type = 'CLASS_HOUR' and exists (select 1 from public.profiles where id = _uid and user_type = 'SERVANT')
        and public.is_servant_of_class(_uid, _class))
$$;

create policy sessions_select on public.attendance_sessions for select to authenticated
  using (public.can_manage_session(auth.uid(), session_type, class_id) or public.has_permission(auth.uid(), 'view_attendance'));
create policy sessions_insert on public.attendance_sessions for insert to authenticated
  with check (created_by = auth.uid() and public.can_manage_session(auth.uid(), session_type, class_id));
create policy sessions_update on public.attendance_sessions for update to authenticated
  using (public.can_manage_session(auth.uid(), session_type, class_id))
  with check (public.can_manage_session(auth.uid(), session_type, class_id));

-- records
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index on public.attendance_records (student_id, recorded_at desc);
grant select on public.attendance_records to authenticated;
grant all on public.attendance_records to service_role;
alter table public.attendance_records enable row level security;
create policy records_select on public.attendance_records for select to authenticated
  using (student_id = auth.uid() or public.has_permission(auth.uid(), 'view_attendance')
         or public.has_permission(auth.uid(), 'manage_attendance') or public.is_servant_of_student(auth.uid(), student_id));

-- points
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount between -10000 and 10000 and amount <> 0),
  type public.point_type not null,
  reason text not null,
  note text,
  attendance_record_id uuid unique references public.attendance_records(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.point_transactions (student_id, created_at desc);
grant select, insert, update, delete on public.point_transactions to authenticated;
grant all on public.point_transactions to service_role;
alter table public.point_transactions enable row level security;
create policy points_select on public.point_transactions for select to authenticated
  using (student_id = auth.uid() or public.has_permission(auth.uid(), 'view_points')
         or public.has_permission(auth.uid(), 'manage_points') or public.is_servant_of_student(auth.uid(), student_id));
create policy points_insert on public.point_transactions for insert to authenticated
  with check (public.has_permission(auth.uid(), 'manage_points') and created_by = auth.uid()
              and attendance_record_id is null and student_id <> auth.uid()
              and exists (select 1 from public.profiles where id = student_id and user_type = 'STUDENT'));
create policy points_update on public.point_transactions for update to authenticated
  using (public.has_permission(auth.uid(), 'manage_points'))
  with check (public.has_permission(auth.uid(), 'manage_points') and student_id <> auth.uid());
create policy points_delete on public.point_transactions for delete to authenticated
  using (public.has_permission(auth.uid(), 'manage_points'));

-- followup (private: never visible to students)
create table public.followup_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  servant_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  status public.followup_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index on public.followup_records (student_id, date desc);
grant select, insert, update, delete on public.followup_records to authenticated;
grant all on public.followup_records to service_role;
alter table public.followup_records enable row level security;

create or replace function public.can_followup(_uid uuid, _student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _uid <> _student and exists (select 1 from public.profiles where id = _uid and user_type in ('SERVANT','MAIN_ADMIN'))
    and (public.has_permission(_uid, 'manage_followup') or public.is_servant_of_student(_uid, _student))
$$;

create policy followup_select on public.followup_records for select to authenticated
  using (public.can_followup(auth.uid(), student_id));
create policy followup_insert on public.followup_records for insert to authenticated
  with check (servant_id = auth.uid() and public.can_followup(auth.uid(), student_id));
create policy followup_update on public.followup_records for update to authenticated
  using (servant_id = auth.uid() or public.is_main_admin(auth.uid()))
  with check (public.can_followup(auth.uid(), student_id));
create policy followup_delete on public.followup_records for delete to authenticated
  using (servant_id = auth.uid() or public.is_main_admin(auth.uid()));

-- secure scan: only way to create attendance
create or replace function public.record_attendance(_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  s public.attendance_sessions%rowtype;
  _rec uuid;
  _pts int;
begin
  if _uid is null then return jsonb_build_object('ok', false, 'code', 'auth'); end if;
  if not exists (select 1 from public.profiles where id = _uid and user_type = 'STUDENT') then
    return jsonb_build_object('ok', false, 'code', 'not_student'); end if;
  select * into s from public.attendance_sessions where token = _token;
  if not found or not s.is_active or now() > s.expires_at or now() < s.start_time then
    return jsonb_build_object('ok', false, 'code', 'invalid'); end if;
  if s.session_type = 'CLASS_HOUR' and not public.is_member_of_class(_uid, s.class_id) then
    return jsonb_build_object('ok', false, 'code', 'wrong_class'); end if;
  insert into public.attendance_records (session_id, student_id) values (s.id, _uid)
    on conflict (session_id, student_id) do nothing returning id into _rec;
  if _rec is null then return jsonb_build_object('ok', false, 'code', 'duplicate'); end if;
  select case when s.session_type = 'FIRST_HOUR' then first_hour_points else class_hour_points end
    into _pts from public.app_settings where id = 1;
  if coalesce(_pts, 0) > 0 then
    insert into public.point_transactions (student_id, amount, type, reason, attendance_record_id, created_by)
    values (_uid, _pts, 'attendance',
            case when s.session_type = 'FIRST_HOUR' then 'حضور الساعة الأولى' else 'حضور الفصل' end,
            _rec, s.created_by)
    on conflict (attendance_record_id) do nothing;
  end if;
  return jsonb_build_object('ok', true, 'points', coalesce(_pts, 0), 'type', s.session_type);
end $$;
revoke execute on function public.record_attendance(uuid) from public, anon;
grant execute on function public.record_attendance(uuid) to authenticated;

-- leaderboard: names + totals only
create or replace function public.get_leaderboard(_class uuid default null)
returns table (rank bigint, student_id uuid, full_name text, total bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _mode public.leaderboard_mode;
  _admin boolean := public.is_main_admin(_uid);
  _cls uuid := _class;
begin
  if _uid is null then return; end if;
  select leaderboard_mode into _mode from public.app_settings where id = 1;
  if _mode = 'DISABLED' and not _admin then return; end if;
  if _cls is null and _mode = 'CLASS' and not _admin then
    select class_id into _cls from public.class_members where class_members.student_id = _uid limit 1;
    if _cls is null then
      select class_id into _cls from public.class_servants where servant_id = _uid limit 1;
    end if;
    if _cls is null then return; end if;
  end if;
  if _cls is not null and not (_admin or public.is_member_of_class(_uid, _cls) or public.is_servant_of_class(_uid, _cls)
       or public.has_permission(_uid, 'view_points')) then return; end if;
  return query
    select dense_rank() over (order by coalesce(sum(pt.amount), 0) desc), p.id, p.full_name,
           coalesce(sum(pt.amount), 0)::bigint, p.id = _uid
    from public.profiles p
    left join public.point_transactions pt on pt.student_id = p.id
    where p.user_type = 'STUDENT'
      and (_cls is null or exists (select 1 from public.class_members cm where cm.class_id = _cls and cm.student_id = p.id))
    group by p.id, p.full_name
    order by 4 desc, p.full_name
    limit 100;
end $$;
revoke execute on function public.get_leaderboard(uuid) from public, anon;
grant execute on function public.get_leaderboard(uuid) to authenticated;