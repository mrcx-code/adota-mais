# Patinhas — Prompts prontos para o Code 🛠️
*Cole cada bloco no Claude Code, um de cada vez. Todos respeitam a stack: HTML/CSS/JS vanilla, sem build, sem npm. Trabalhar em branch e abrir PR — não commitar/push sem pedir.*

---

## Prompt 1 — Vídeo tutorial no FAQ da área logada da ONG

> No repositório do Patinhas (site estático vanilla), adicione o vídeo tutorial "Como cadastrar um pet" na área logada da ONG.
>
> Contexto: o arquivo do vídeo é `Patinhas-Tutorial-ONG.mp4` (vertical, ~39s). Coloque-o em `img/` ou crie uma pasta `media/` e mova pra lá. Em `admin.html`, existe a seção de FAQ do abrigo com `id="ong-faq"` (título "Perguntas frequentes do abrigo").
>
> Faça:
> 1. No topo da seção `#ong-faq`, adicione um card destacado "🎬 Como cadastrar um pet (vídeo)" com um player `<video controls playsinline preload="metadata" style="max-width:360px;width:100%;border-radius:16px">` apontando pro MP4. Legenda curta abaixo: "Passo a passo em menos de 5 minutos."
> 2. Adicione também um item de FAQ novo: pergunta "Como cadastro um pet?" com resposta em texto curto (criar conta → + Novo pet → preencher dados e foto → Salvar) e um link "assistir ao vídeo" que rola até o player.
> 3. Use as classes/estilos já existentes do FAQ pra manter o visual. Verde da marca (#527353). Responsivo no mobile.
> 4. Não altere o comportamento de login nem outras seções.
>
> Entregue numa branch e me mostre o diff.

---

## Prompt 2 — Ajustes jurídicos (LGPD) + rótulos do mural

> No site do Patinhas, faça os ajustes jurídicos abaixo (revisão do nosso apoio jurídico) e o ajuste de rótulos do mural. Stack vanilla, sem build.
>
> **A. Política de Privacidade (`privacidade.html`) e Termos (`termos.html`):**
> 1. Identificar o controlador de dados de forma completa: nome do responsável/razão social e CNPJ quando houver (deixe um placeholder claro `⟨preencher: nome/CNPJ do controlador⟩` se ainda não temos). Hoje consta só "Patinhas Brasil".
> 2. Nomear um Encarregado (DPO): adicionar frase "Encarregado pelo tratamento de dados: ⟨nome⟩ — brasilpatinhas@gmail.com".
> 3. Definir prazo de retenção concreto na seção "Por quanto tempo guardamos" (ex.: contatos de interessados mantidos por até 24 meses após o último contato, salvo obrigação legal), no lugar do genérico "pelo tempo necessário".
> 4. Termos: incluir uma linha deixando explícito que o termo de responsabilidade/adoção é de competência da ONG, não do Patinhas.
>
> **B. Consentimento no formulário de interesse (`index.html` + `js/app.js`):**
> 5. No formulário do drawer "Tenho interesse", adicionar um checkbox obrigatório: "Li e concordo com a Política de Privacidade e autorizo o envio do meu contato à ONG responsável." com link pra `privacidade.html`. Bloquear o envio se não estiver marcado.
> 6. Adicionar checkbox/afirmação "Sou maior de 18 anos."
> 7. No cadastro de ONG (signup), incluir o aceite dos Termos e Política no submit.
>
> **C. Rótulos emocionais do mural público (`index.html` + `js/app.js` + `css/style.css`):**
> 8. Trocar os rótulos exibidos ao público: "Disponível" → "À espera de um lar", "Em processo" → "Rumo ao lar", "Adotado" → "Família formada". Manter os valores internos do banco (`disponivel`/`em_processo`/`adotado`) e os nomes técnicos no painel da ONG inalterados — mudar só o texto visível na vitrine pública e no contador do topo.
>
> Trabalhe numa branch, sem publicar, e me mostre o diff de cada arquivo.

*(Observação nossa: isso é apoio jurídico do time, não substitui validação por advogado(a) com registro antes de publicar.)*

---

## Prompt 3 — Popup "avise-me quando tiver um pet" (captura de demanda)

> Implemente no site do Patinhas (vanilla, Supabase) um popup de captura de e-mail para quando o mural estiver vazio. Objetivo: enquanto ainda há poucos pets, capturar quem tem interesse e avisar quando um pet compatível for cadastrado.
>
> **Regras:**
> 1. Dispara SÓ quando o resultado do mural estiver vazio (0 pets no total, ou 0 resultados após um filtro) — nunca sobre um mural com pets. Em `js/app.js`, o momento certo é logo após `renderBoard()` quando `ALL_PETS.length === 0`.
> 2. Mostrar no máximo 1x a cada 7 dias por visitante (controlar com `localStorage`, ex.: chave `patinhas_notify_dismissed_at`). Fácil de fechar (X e clique fora).
> 3. Campos: e-mail (obrigatório) + preferências opcionais (estado UF, espécie, porte).
> 4. Consentimento LGPD: checkbox obrigatório "Quero receber um aviso quando um pet compatível for cadastrado" com link pra `privacidade.html`. Guardar data/hora do consentimento.
> 5. Sucesso: mensagem "Prontinho! A gente te avisa 💚". Erros tratados com mensagem amigável. Honeypot anti-spam como no formulário de interesse.
>
> **Banco (Supabase):** criar migração em `sql/` para a tabela:
> ```sql
> create table public.notificacoes_interesse (
>   id uuid primary key default gen_random_uuid(),
>   email text not null,
>   uf text, especie text, porte text,
>   consentimento_em timestamptz not null default now(),
>   ativo boolean not null default true,
>   created_at timestamptz not null default now()
> );
> alter table public.notificacoes_interesse enable row level security;
> create policy "qualquer um se inscreve" on public.notificacoes_interesse for insert to public with check (true);
> ```
> (Sem SELECT público — a lista não pode ser lida pelo anon; leitura só via painel/admin.)
>
> **Envio dos avisos:** no primeiro momento, manual — a gente consulta a tabela e envia. Deixe o código preparado, mas NÃO implemente disparo automático de e-mail agora (fica pra uma Edge Function depois).
>
> Visual da marca (verde/creme), responsivo. Branch + diff, sem publicar.

---

### Ordem sugerida de execução
1. Prompt 2 (jurídico) — rápido e importante pro lançamento.
2. Prompt 1 (vídeo no FAQ) — ajuda o onboarding das ONGs.
3. Prompt 3 (popup) — captura de demanda enquanto o mural enche.
