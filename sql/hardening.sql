-- =========================================================
-- Patinhas — endurecimento de segurança (rodar UMA vez no SQL Editor
-- do Supabase, sobre um banco que já tem o schema.sql aplicado).
--
-- Corrige 2 fragilidades de integridade encontradas na auditoria:
--   1) Policies de UPDATE sem WITH CHECK — permitiam a uma ONG logada
--      "reatribuir" a posse de uma linha (ex: mudar pets.org_id para outra
--      ONG, ou interests.pet_id para um pet de outra ONG).
--   2) Policies de Storage checavam só auth.role()='authenticated' — qualquer
--      ONG logada podia sobrescrever/excluir arquivos (fotos, logos) de outra.
--
-- É idempotente: pode rodar mais de uma vez sem erro.
-- =========================================================

-- ---------- 1. WITH CHECK nas policies de UPDATE ----------

drop policy if exists "Abrigo edita seu próprio perfil" on profiles;
create policy "Abrigo edita seu próprio perfil"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Abrigo edita seus próprios pets" on pets;
create policy "Abrigo edita seus próprios pets"
  on pets for update
  using (auth.uid() = org_id)
  with check (auth.uid() = org_id);

drop policy if exists "Abrigo atualiza status dos interesses dos seus pets" on interests;
create policy "Abrigo atualiza status dos interesses dos seus pets"
  on interests for update
  using (
    exists (select 1 from pets where pets.id = interests.pet_id and pets.org_id = auth.uid())
  )
  with check (
    exists (select 1 from pets where pets.id = interests.pet_id and pets.org_id = auth.uid())
  );

-- ---------- 2. Storage escopado ao dono (1º nível do caminho = auth.uid) ----------
-- Caminhos gravados pelo app: "<org_id>/<arquivo>" (fotos de pet e logo).
-- storage.foldername(name)[1] é a primeira pasta do caminho.

drop policy if exists "Usuários logados enviam fotos de pets" on storage.objects;
create policy "ONG envia arquivos na sua própria pasta"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuários logados atualizam fotos de pets" on storage.objects;
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

drop policy if exists "Usuários logados excluem fotos de pets" on storage.objects;
create policy "ONG exclui arquivos da sua própria pasta"
  on storage.objects for delete
  using (
    bucket_id = 'pet-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Observação: logos antigos salvos em "logos/<org_id>.ext" (formato anterior)
-- continuam acessíveis por URL pública, mas passam a ser somente-leitura pela
-- API. O app já salva o logo novo em "<org_id>/logo.ext", dentro da regra acima.
