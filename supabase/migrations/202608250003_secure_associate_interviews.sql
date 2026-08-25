drop policy if exists "no direct associate interview access" on public.associate_interviews;
create policy "no direct associate interview access" on public.associate_interviews
for all to anon,authenticated using (false) with check (false);
