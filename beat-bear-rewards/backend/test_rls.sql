begin;
do $test$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); changed integer;
begin
 insert into auth.users(id, aud, role) values (a,'authenticated','authenticated'),(b,'authenticated','authenticated');
 insert into public.player_profiles(user_id,display_name) values(a,'QA Bear A'),(b,'QA Bear B');
 insert into public.demo_progress(user_id,snapshot) values(a,'{"paws":10}'),(b,'{"paws":20}');
 insert into public.paid_wallets(user_id,balance) values(a,0),(b,0);
 perform set_config('request.jwt.claim.sub',a::text,true);
 execute 'set local role authenticated';
 if (select count(*) from public.player_profiles) <> 1 then raise exception 'Profile isolation failed'; end if;
 if (select count(*) from public.demo_progress) <> 1 then raise exception 'Progress isolation failed'; end if;
 if (select count(*) from public.paid_wallets) <> 1 then raise exception 'Paid balance isolation failed'; end if;
 update public.demo_progress set snapshot='{"paws":15}' where user_id=a;
 get diagnostics changed = row_count;
 if changed <> 1 then raise exception 'Own progress update failed'; end if;
 update public.demo_progress set snapshot='{"paws":999}' where user_id=b;
 get diagnostics changed = row_count;
 if changed <> 0 then raise exception 'Cross-user update allowed'; end if;
 begin
  update public.demo_progress set user_id=b where user_id=a;
  raise exception 'Ownership reassignment allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.paid_wallets set balance=999 where user_id=a;
  raise exception 'Browser paid balance mutation allowed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 execute 'set local role anon';
 begin
  perform * from public.demo_progress;
  raise exception 'Anonymous progress access allowed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
end
$test$;
select 'PASS: own read/write, cross-user isolation, ownership protection, paid balance write denial, anonymous denial; fixtures rolled back.' as validation;
rollback;
