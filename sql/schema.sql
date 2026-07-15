-- =========================================================
-- Patinhas — schema do banco de dados (Supabase / Postgres)
--
-- Como usar:
--   1. Crie um projeto gratuito em https://supabase.com
--   2. Vá em "SQL Editor" no painel do projeto
--   3. Cole todo este arquivo e clique em "Run"
-- =========================================================

-- Tipos usados nas colunas do Kanban e na espécie do pet
create type pet_status as enum ('disponivel', 'em_processo', 'adotado');
create type pet_species as enum ('cachorro', 'gato', 'outro');

-- Um "profile" = um abrigo/ONG que faz login na área de admin.
-- É criado automaticamente quando alguém se cadastra (ver trigger no final).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_name text not null,
  contact_email text,
  contact_whatsapp text,
  -- Cidade/estado são obrigatórios na tela de perfil (validado no app, não
  -- aqui no banco, já que perfis antigos podem não ter esses dados ainda).
  city text,
  state text,
  instagram text,
  website text,
  description text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Os pets disponíveis, em processo ou já adotados.
create table pets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  species pet_species not null default 'cachorro',
  size text,
  age_label text,
  -- 'macho' | 'femea' | null (não informado) — usado pro símbolo ♂/♀ no card
  -- e pra concordância de gênero na descrição automática.
  gender text check (gender in ('macho', 'femea')),
  -- Ordem manual dentro da coluna do kanban (drag and drop). Menor valor =
  -- mais no topo. Pets novos entram com valor negativo (topo); reordenar usa
  -- o ponto médio entre os vizinhos. Ordena por sort_order asc, created_at desc.
  sort_order double precision,
  -- Legado: texto livre da época anterior à descrição automática (ver
  -- "personality"/"favorite_toy" abaixo). Mantido só para não perder o
  -- histórico de pets já cadastrados — o formulário não edita mais este campo.
  description text,
  photo_url text,
  -- Foto da nova família com o pet (prova social): só aparece nos cards de
  -- adotado. Opcional; a ONG envia quando quer mostrar o reencontro.
  family_photo_url text,
  status pet_status not null default 'disponivel',
  vaccinated boolean not null default false,
  dewormed boolean not null default false,
  neutered boolean not null default false,
  -- Link opcional para o formulário de adoção próprio do abrigo (exibido
  -- como alternativa ao formulário padrão do Patinhas).
  adoption_form_url text,
  -- Informações adicionais opcionais — só aparecem no card quando preenchidas.
  city text,
  lives_with_dogs boolean,
  lives_with_cats boolean,
  lives_with_kids boolean,
  apartment_friendly boolean,
  -- Traços de personalidade (multi-seleção) + brinquedo/hobby favorito —
  -- usados para montar a descrição automática do pet no lugar de um texto
  -- livre, padronizando a forma como cada animal é apresentado.
  personality text[] not null default '{}',
  favorite_toy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_org_id_idx on pets (org_id);
create index pets_status_idx on pets (status);

-- Registros de "tenho interesse" feitos pelo público na página inicial.
create table interests (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  message text,
  -- Acompanhamento manual do abrigo na Central de Interessados — pipeline
  -- de adoção, em ordem lógica do processo: novo -> em_contato -> em_triagem
  -- -> aprovado -> adocao_concluida (ou reprovado/arquivado a qualquer momento).
  status text not null default 'novo' check (
    status in ('novo', 'em_contato', 'em_triagem', 'aprovado', 'adocao_concluida', 'reprovado', 'arquivado')
  ),
  created_at timestamptz not null default now()
);

create index interests_pet_id_idx on interests (pet_id);
create index interests_status_idx on interests (status);

-- =========================================================
-- Segurança (Row Level Security)
-- =========================================================

alter table profiles enable row level security;
alter table pets enable row level security;
alter table interests enable row level security;

-- profiles: qualquer visitante pode ver o nome/contato de um abrigo
-- (aparece nos cards públicos); só o próprio abrigo edita seus dados.
create policy "Perfis são visíveis publicamente"
  on profiles for select
  using (true);

create policy "Abrigo cria seu próprio perfil"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Abrigo edita seu próprio perfil"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- pets: visíveis publicamente; só o abrigo dono pode criar/editar/excluir.
create policy "Pets são visíveis publicamente"
  on pets for select
  using (true);

create policy "Abrigo cria pets para si mesmo"
  on pets for insert
  with check (auth.uid() = org_id);

create policy "Abrigo edita seus próprios pets"
  on pets for update
  using (auth.uid() = org_id)
  with check (auth.uid() = org_id);

create policy "Abrigo exclui seus próprios pets"
  on pets for delete
  using (auth.uid() = org_id);

-- interests: qualquer pessoa pode registrar interesse (formulário público);
-- só o abrigo dono do pet pode ver e atualizar (status) os interesses recebidos.
create policy "Qualquer pessoa registra interesse"
  on interests for insert
  with check (true);

create policy "Abrigo vê interesses dos seus pets"
  on interests for select
  using (
    exists (
      select 1 from pets
      where pets.id = interests.pet_id
        and pets.org_id = auth.uid()
    )
  );

create policy "Abrigo atualiza status dos interesses dos seus pets"
  on interests for update
  using (
    exists (
      select 1 from pets
      where pets.id = interests.pet_id
        and pets.org_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from pets
      where pets.id = interests.pet_id
        and pets.org_id = auth.uid()
    )
  );

-- =========================================================
-- pets.updated_at é tocado automaticamente em qualquer UPDATE — cobre
-- edição de cadastro, troca de status (drag-and-drop) e o botão "Confirmar
-- disponibilidade", sem depender de cada ponto do app lembrar de setar o
-- campo manualmente.
-- =========================================================

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pets_touch_updated_at
  before update on pets
  for each row execute procedure public.touch_updated_at();

-- =========================================================
-- Cria automaticamente o "profile" quando um abrigo se cadastra
-- (auth.users -> profiles), usando os dados extras enviados no
-- signUp (org_name, contact_email, contact_whatsapp, city, state).
-- =========================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, org_name, contact_email, contact_whatsapp, city, state, is_staff)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'org_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'Abrigo sem nome'
    ),
    coalesce(new.raw_user_meta_data ->> 'contact_email', new.email),
    new.raw_user_meta_data ->> 'contact_whatsapp',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'state',
    -- E-mails da equipe Patinhas já entram como staff (veem a caixa de suporte).
    (lower(new.email) = any (array['brasilpatinhas@gmail.com']))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- A função do trigger não deve ser chamável diretamente via RPC por
-- usuários anônimos/autenticados — só deve rodar como parte do trigger
-- acima (isso não impede o trigger de funcionar).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =========================================================
-- Storage: bucket público para as fotos dos pets (e também para o
-- logo/foto do abrigo, salvo em storage.objects sob o prefixo "logos/").
-- =========================================================

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Não criamos uma policy de SELECT em storage.objects aqui: como o bucket já
-- é público, os arquivos ficam acessíveis por URL direta sem precisar disso.
-- Uma policy de SELECT permitiria listar todos os arquivos do bucket via
-- API, o que não é necessário.

-- Cada ONG só grava/edita/exclui dentro da sua própria pasta ("<org_id>/..."),
-- para não conseguir sobrescrever ou apagar arquivos de outra ONG.
create policy "ONG envia arquivos na sua própria pasta"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ONG atualiza arquivos da sua própria pasta"
  on storage.objects for update
  using (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ONG exclui arquivos da sua própria pasta"
  on storage.objects for delete
  using (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================================================
-- Estatísticas públicas agregadas (página "Sobre Nós") — só contagens,
-- nenhum dado privado é exposto. security definer é seguro aqui porque a
-- função só retorna 4 números, nunca linhas de "interests" (que têm
-- nome/contato de quem demonstrou interesse).
-- =========================================================

create or replace function public.get_public_stats()
returns table (
  total_orgs bigint,
  total_pets bigint,
  total_adopted bigint,
  total_interests bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    -- Não conta contas de teste (@patinhas.test) como ONGs parceiras.
    (select count(*) from profiles p
       where not exists (
         select 1 from auth.users u
         where u.id = p.id and u.email like '%@patinhas.test'
       )) as total_orgs,
    (select count(*) from pets) as total_pets,
    (select count(*) from pets where status = 'adotado') as total_adopted,
    (select count(*) from interests) as total_interests;
$$;

grant execute on function public.get_public_stats() to anon, authenticated;

-- =========================================================
-- Analytics simples de visitas (js/analytics.js) — só métricas agregadas
-- de navegação, sem dado pessoal identificável além de um visitor_id
-- gerado no próprio navegador.
-- =========================================================

create table site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  visitor_id text
);

alter table site_visits enable row level security;

-- Registrado tanto pelo visitante anônimo quanto por uma ONG logada
-- navegando pelo próprio site público — por isso libera pros dois papéis.
create policy "Anyone can log a visit"
  on site_visits for insert
  to anon, authenticated
  with check (true);

-- =========================================================
-- Fila de sugestões de melhoria (widget de feedback, js/utils.js).
-- Qualquer visitante pode enviar; ninguém consegue ler pela API pública
-- (sem policy de select) — a fila é consumida pelo painel do Supabase.
-- =========================================================

create table platform_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null,
  page text,
  user_agent text,
  -- Marcado como true quando a sugestão já foi implementada (controle manual
  -- de quem processa a fila).
  implemented boolean not null default false
);

alter table platform_feedback enable row level security;

create policy "Qualquer pessoa envia sugestão"
  on platform_feedback for insert
  to anon, authenticated
  with check (true);


-- =========================================================
-- Suporte: assistente do abrigo + tickets
-- =========================================================
-- Dúvidas que o assistente (chatbot de FAQ, client-side) não resolveu viram
-- tickets aqui, respondidos pela equipe. profiles.is_staff marca quem é da
-- equipe Patinhas (vê a caixa de suporte de todas as ONGs).

alter table profiles add column if not exists is_staff boolean not null default false;

create table if not exists suporte_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references profiles (id) on delete cascade,
  org_name text,
  pergunta text not null,
  contexto text,                 -- última pergunta feita ao bot (opcional)
  status text not null default 'aberto' check (status in ('aberto','respondido','fechado')),
  resposta text,
  created_at timestamptz not null default now(),
  respondido_em timestamptz
);
create index if not exists suporte_tickets_org_idx on suporte_tickets (org_id);
create index if not exists suporte_tickets_status_idx on suporte_tickets (status);

alter table suporte_tickets enable row level security;

-- O usuário logado é da equipe? (security definer evita recursão de RLS)
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_staff from profiles where id = auth.uid()), false);
$$;

create policy "ONG cria ticket de suporte"
  on suporte_tickets for insert to authenticated
  with check (auth.uid() = org_id);

create policy "Ticket visivel para dono ou equipe"
  on suporte_tickets for select to authenticated
  using (auth.uid() = org_id or public.is_staff());

create policy "Equipe responde tickets"
  on suporte_tickets for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());
