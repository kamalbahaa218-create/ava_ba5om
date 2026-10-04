
create type public.user_type as enum ('STUDENT','SERVANT','MAIN_ADMIN');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  user_type public.user_type not null default 'STUDENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_user_type_idx on public.profiles(user_type);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);
create index class_members_student_idx on public.class_members(student_id);
create index class_members_class_idx on public.class_members(class_id);

create table public.class_servants (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  servant_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, servant_id)
);
create index class_servants_servant_idx on public.class_servants(servant_id);
create index class_servants_class_idx on public.class_servants(class_id);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, permission_id)
);
create index user_permissions_user_idx on public.user_permissions(user_id);

grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.classes, public.class_members, public.class_servants, public.user_permissions to authenticated;
grant select on public.permissions to authenticated;
grant all on public.classes, public.class_members, public.class_servants, public.permissions, public.user_permissions to service_role;

create or replace function public.is_main_admin(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and user_type = 'MAIN_ADMIN')
$$;

create or replace function public.has_permission(_uid uuid, _perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_main_admin(_uid) or exists (
    select 1 from public.user_permissions up
    join public.permissions p on p.id = up.permission_id
    join public.profiles pr on pr.id = up.user_id
    where up.user_id = _uid and p.name = _perm and pr.user_type = 'SERVANT'
  )
$$;

create or replace function public.is_servant_of_class(_uid uuid, _class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_servants where servant_id = _uid and class_id = _class)
$$;

create or replace function public.is_member_of_class(_uid uuid, _class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where student_id = _uid and class_id = _class)
$$;

create or replace function public.can_view_profile(_viewer uuid, _target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select _viewer = _target
    or public.is_main_admin(_viewer)
    or (public.has_permission(_viewer, 'view_students') and exists (select 1 from public.profiles where id = _target and user_type = 'STUDENT'))
    or (public.has_permission(_viewer, 'manage_servants') and exists (select 1 from public.profiles where id = _target and user_type = 'SERVANT'))
    or exists (select 1 from public.class_servants cs join public.class_members cm on cm.class_id = cs.class_id
               where cs.servant_id = _viewer and cm.student_id = _target)
    or exists (select 1 from public.class_servants cs
               where cs.servant_id = _target and (public.is_member_of_class(_viewer, cs.class_id) or public.is_servant_of_class(_viewer, cs.class_id)))
$$;

revoke execute on function public.is_main_admin(uuid), public.has_permission(uuid,text), public.is_servant_of_class(uuid,uuid), public.is_member_of_class(uuid,uuid), public.can_view_profile(uuid,uuid) from anon, public;
grant execute on function public.is_main_admin(uuid), public.has_permission(uuid,text), public.is_servant_of_class(uuid,uuid), public.is_member_of_class(uuid,uuid), public.can_view_profile(uuid,uuid) to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_servants enable row level security;
alter table public.permissions enable row level security;
alter table public.user_permissions enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated
  using (public.can_view_profile(auth.uid(), id));
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_main_admin(auth.uid()) or (public.has_permission(auth.uid(),'manage_students') and user_type = 'STUDENT'))
  with check (id = auth.uid() or public.is_main_admin(auth.uid()) or (public.has_permission(auth.uid(),'manage_students') and user_type = 'STUDENT'));

create policy "classes_select" on public.classes for select to authenticated
  using (public.has_permission(auth.uid(),'view_classes') or public.has_permission(auth.uid(),'manage_classes')
         or public.is_servant_of_class(auth.uid(), id) or public.is_member_of_class(auth.uid(), id));
create policy "classes_insert" on public.classes for insert to authenticated with check (public.has_permission(auth.uid(),'manage_classes'));
create policy "classes_update" on public.classes for update to authenticated using (public.has_permission(auth.uid(),'manage_classes')) with check (public.has_permission(auth.uid(),'manage_classes'));
create policy "classes_delete" on public.classes for delete to authenticated using (public.has_permission(auth.uid(),'manage_classes'));

create policy "members_select" on public.class_members for select to authenticated
  using (student_id = auth.uid() or public.has_permission(auth.uid(),'view_students') or public.is_servant_of_class(auth.uid(), class_id));
create policy "members_insert" on public.class_members for insert to authenticated with check (public.has_permission(auth.uid(),'manage_students'));
create policy "members_delete" on public.class_members for delete to authenticated using (public.has_permission(auth.uid(),'manage_students'));

create policy "servants_select" on public.class_servants for select to authenticated
  using (servant_id = auth.uid() or public.has_permission(auth.uid(),'view_classes')
         or public.is_member_of_class(auth.uid(), class_id) or public.is_servant_of_class(auth.uid(), class_id));
create policy "servants_insert" on public.class_servants for insert to authenticated with check (public.has_permission(auth.uid(),'manage_servants'));
create policy "servants_delete" on public.class_servants for delete to authenticated using (public.has_permission(auth.uid(),'manage_servants'));

create policy "permissions_select" on public.permissions for select to authenticated using (true);

create policy "user_perms_select" on public.user_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_main_admin(auth.uid()));
create policy "user_perms_insert" on public.user_permissions for insert to authenticated
  with check (public.is_main_admin(auth.uid()) and user_id <> auth.uid());
create policy "user_perms_delete" on public.user_permissions for delete to authenticated
  using (public.is_main_admin(auth.uid()));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger classes_touch before update on public.classes for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.permissions (name, description) values
 ('view_students','عرض المخدومين'),
 ('manage_students','إدارة المخدومين'),
 ('view_classes','عرض الفصول'),
 ('manage_classes','إدارة الفصول'),
 ('view_attendance','عرض الحضور'),
 ('manage_attendance','إدارة الحضور'),
 ('view_points','عرض النقاط'),
 ('manage_points','إدارة النقاط'),
 ('manage_announcements','إدارة الإعلانات'),
 ('manage_calendar','إدارة التقويم'),
 ('manage_lessons','إدارة الدروس'),
 ('manage_followup','إدارة الافتقاد'),
 ('manage_servants','إدارة الخدام'),
 ('manage_permissions','إدارة الصلاحيات');
