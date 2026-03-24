-- Function to handle new user creation
delete from auth.users where email = 'test@example.com'; -- Cleanup if needed

-- Create a function that will be called by the trigger
create or replace function public.handle_new_user() 
returns trigger 
language plpgsql 
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (
    new.id, 
    new.email,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger that fires after a user is inserted in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Optional: Create a function to manually sync existing users
create or replace function public.sync_existing_users() 
returns void 
language plpgsql 
security definer set search_path = public
as $$
declare
  user_record record;
begin
  for user_record in 
    select id, email from auth.users 
    where not exists (
      select 1 from public.profiles where profiles.id = auth.users.id
    )
      loop
      insert into public.profiles (id, email, created_at)
      values (
        user_record.id, 
        user_record.email,
        now()
      )
    on conflict (id) do nothing;
  end loop;
end;
$$;

-- To run the sync manually:
-- select public.sync_existing_users();