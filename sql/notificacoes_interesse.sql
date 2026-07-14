-- =========================================================
-- Captura de demanda: "avise-me quando tiver um pet"
-- Popup exibido quando o mural está vazio (0 pets ou 0 resultados).
-- Sem SELECT público: a lista NÃO pode ser lida pelo anon; leitura só
-- pelo painel do Supabase (ou por uma Edge Function futura).
-- =========================================================

create table if not exists public.notificacoes_interesse (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  uf text,
  especie text,
  porte text,
  consentimento_em timestamptz not null default now(),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.notificacoes_interesse enable row level security;

-- Qualquer visitante pode se inscrever (INSERT). Não há policy de SELECT/UPDATE/
-- DELETE de propósito — a fila é consumida pelo painel/admin.
drop policy if exists "qualquer um se inscreve" on public.notificacoes_interesse;
create policy "qualquer um se inscreve"
  on public.notificacoes_interesse
  for insert
  to anon, authenticated
  with check (true);
