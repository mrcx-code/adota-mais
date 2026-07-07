-- =========================================================
-- Adota+ — schema do banco de dados (Supabase / Postgres)
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
  description text,
  photo_url text,
  status pet_status not null default 'disponivel',
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
  created_at timestamptz not null default now()
);

create index interests_pet_id_idx on interests (pet_id);

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
  using (auth.uid() = id);

-- pets: visíveis publicamente; só o abrigo dono pode criar/editar/excluir.
create policy "Pets são visíveis publicamente"
  on pets for select
  using (true);

create policy "Abrigo cria pets para si mesmo"
  on pets for insert
  with check (auth.uid() = org_id);

create policy "Abrigo edita seus próprios pets"
  on pets for update
  using (auth.uid() = org_id);

create policy "Abrigo exclui seus próprios pets"
  on pets for delete
  using (auth.uid() = org_id);

-- interests: qualquer pessoa pode registrar interesse (formulário público);
-- só o abrigo dono do pet pode ver os interesses recebidos.
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

-- =========================================================
-- Cria automaticamente o "profile" quando um abrigo se cadastra
-- (auth.users -> profiles), usando os dados extras enviados no
-- signUp (org_name, contact_email, contact_whatsapp).
-- =========================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, org_name, contact_email, contact_whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'org_name', 'Abrigo sem nome'),
    coalesce(new.raw_user_meta_data ->> 'contact_email', new.email),
    new.raw_user_meta_data ->> 'contact_whatsapp'
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
-- Storage: bucket público para as fotos dos pets
-- =========================================================

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Não criamos uma policy de SELECT em storage.objects aqui: como o bucket já
-- é público, os arquivos ficam acessíveis por URL direta sem precisar disso.
-- Uma policy de SELECT permitiria listar todos os arquivos do bucket via
-- API, o que não é necessário.

create policy "Usuários logados enviam fotos de pets"
  on storage.objects for insert
  with check (bucket_id = 'pet-photos' and auth.role() = 'authenticated');

create policy "Usuários logados atualizam fotos de pets"
  on storage.objects for update
  using (bucket_id = 'pet-photos' and auth.role() = 'authenticated');

create policy "Usuários logados excluem fotos de pets"
  on storage.objects for delete
  using (bucket_id = 'pet-photos' and auth.role() = 'authenticated');
