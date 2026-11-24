-- Planos só podem apontar para agregados a que o utilizador pertence.
drop policy plans_write on plans;
create policy plans_write on plans for insert
  with check (user_id = auth.uid() and (household_id is null or household_id in (select my_households())));

-- Contador atómico para os limites da IA (por utilizador e global).
create function bump_usage(k text, d date, lim int) returns boolean
language plpgsql security definer set search_path = public as $$
declare c int;
begin
  insert into ai_usage (key, day, count) values (k, d, 1)
  on conflict (key, day) do update set count = ai_usage.count + 1 where ai_usage.count < lim
  returning count into c;
  return c is not null;
end $$;
revoke all on function bump_usage(text, date, int) from public, anon, authenticated;
