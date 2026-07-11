-- =========================================================
-- Patinhas — anti-spam no formulário de interesse (server-side).
-- Rodar UMA vez no SQL Editor do Supabase (idempotente).
--
-- O cliente tem honeypot + cooldown, mas isso é burlável chamando a API
-- direto. Este trigger é a proteção real: roda no banco, em SECURITY DEFINER
-- (para conseguir contar as linhas existentes, que a RLS esconde do anônimo).
--
-- Regras:
--   * Bloqueia o MESMO contato (email ou telefone) no MESMO pet em 2 minutos
--     (evita duplo-clique e repetição rápida).
--   * Cap de 20 interesses por pet por hora (evita flood direcionado).
-- =========================================================

create or replace function public.throttle_interests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_same int;
  recent_pet int;
begin
  select count(*) into recent_same
  from interests
  where pet_id = new.pet_id
    and created_at > now() - interval '2 minutes'
    and (
      (new.email is not null and lower(email) = lower(new.email))
      or (new.phone is not null and phone = new.phone)
    );
  if recent_same > 0 then
    raise exception 'Interesse duplicado recente para este pet.'
      using errcode = 'check_violation';
  end if;

  select count(*) into recent_pet
  from interests
  where pet_id = new.pet_id
    and created_at > now() - interval '1 hour';
  if recent_pet >= 20 then
    raise exception 'Muitos interesses recentes para este pet. Tente mais tarde.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Não deve ser chamável direto via RPC — só como parte do trigger.
revoke execute on function public.throttle_interests() from public, anon, authenticated;

drop trigger if exists interests_throttle on interests;
create trigger interests_throttle
  before insert on interests
  for each row execute procedure public.throttle_interests();
