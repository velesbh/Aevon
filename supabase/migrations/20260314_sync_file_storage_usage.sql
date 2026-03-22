create or replace function public.update_modified_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_profile_storage_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_profile_id uuid;
  current_used bigint;
  current_limit bigint;
  incoming_delta bigint;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  target_profile_id := new.user_id;

  select coalesce(storage_used, 0), coalesce(storage_limit, 34359738368)
    into current_used, current_limit
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'Profile % not found for file upload.', target_profile_id;
  end if;

  if tg_op = 'INSERT' then
    incoming_delta := coalesce(new.file_size, 0);
  elsif new.user_id = old.user_id then
    incoming_delta := greatest(coalesce(new.file_size, 0) - coalesce(old.file_size, 0), 0);
  else
    incoming_delta := coalesce(new.file_size, 0);
  end if;

  if current_used + incoming_delta > current_limit then
    raise exception 'Storage limit exceeded for profile %.', target_profile_id using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.sync_profile_storage_usage()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set storage_used = greatest(0, coalesce(storage_used, 0) + coalesce(new.file_size, 0))
    where id = new.user_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id = old.user_id then
      update public.profiles
      set storage_used = greatest(
        0,
        coalesce(storage_used, 0) + coalesce(new.file_size, 0) - coalesce(old.file_size, 0)
      )
      where id = new.user_id;
    else
      update public.profiles
      set storage_used = greatest(0, coalesce(storage_used, 0) - coalesce(old.file_size, 0))
      where id = old.user_id;

      update public.profiles
      set storage_used = greatest(0, coalesce(storage_used, 0) + coalesce(new.file_size, 0))
      where id = new.user_id;
    end if;

    return new;
  end if;

  update public.profiles
  set storage_used = greatest(0, coalesce(storage_used, 0) - coalesce(old.file_size, 0))
  where id = old.user_id;

  return old;
end;
$$;

drop trigger if exists enforce_profile_storage_limit_on_files on public.files;
create trigger enforce_profile_storage_limit_on_files
before insert or update on public.files
for each row execute function public.enforce_profile_storage_limit();

drop trigger if exists sync_profile_storage_usage_on_files on public.files;
create trigger sync_profile_storage_usage_on_files
after insert or update or delete on public.files
for each row execute function public.sync_profile_storage_usage();

create unique index if not exists files_file_path_idx on public.files(file_path);

with aggregated as (
  select user_id, coalesce(sum(file_size), 0)::bigint as storage_used
  from public.files
  group by user_id
)
update public.profiles as profiles
set storage_used = aggregated.storage_used
from aggregated
where profiles.id = aggregated.user_id;

update public.profiles
set storage_used = 0
where not exists (
  select 1
  from public.files
  where public.files.user_id = public.profiles.id
);
