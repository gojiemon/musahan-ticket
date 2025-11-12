-- Dummy show and three performances
insert into shows (id, title, description, visual_url)
values
  (uuid_generate_v4(), '無佐半一座 第1回公演', '初演', null)
on conflict do nothing;

-- Get show id
with s as (
  select id from shows order by created_at asc limit 1
)
insert into performances (show_id, start_at, venue, capacity)
select s.id, now() + interval '0 day', '小劇場A', 30 from s
union all
select s.id, now() + interval '1 day', '小劇場A', 30 from s
union all
select s.id, now() + interval '7 day', '小劇場B', 50 from s;

