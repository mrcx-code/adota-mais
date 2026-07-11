# Patinhas Brasil 🐾

Plataforma de adoção de pets. Página pública em formato **Kanban**
(Disponível → Em processo → Adotado) + área de **admin** para abrigos/ONGs
cadastrarem e gerenciarem seus pets.

- **Produção:** https://patinhasbrasil.com.br (e www)
- **Repositório:** https://github.com/mrcx-code/patinhas (código na raiz do repo)
- **Código-fonte local:** raiz deste repositório.

## Arquitetura

- **Site 100% estático** — HTML + CSS + JS puro (vanilla), **sem build, sem npm**.
- **Backend:** Supabase (Postgres + Auth + Storage de fotos). Config em `js/config.js`.
- **Biblioteca Supabase:** carregada via CDN jsdelivr (`@supabase/supabase-js@2`) em cada HTML.
- **Hospedagem:** Vercel, deploy automático a cada push na raiz. (Root Directory na
  Vercel deve ser `/` — antes era `petadopt`.)
- **DNS:** Hostinger apontando para a Vercel; HTTPS automático.

## Como rodar localmente

Servidor estático na raiz do repo:

```bash
python -m http.server 8000
```

Acesse http://localhost:8000. Já existe `.claude/launch.json` com o config
`patinhas-local` (use `/run` ou preview_start).

⚠️ **IMPORTANTE — o local usa o banco de PRODUÇÃO.** `config.js` tem as chaves
reais do Supabase, então rodar local conecta ao **banco de dados de produção**.
Qualquer escrita (cadastrar/editar/mover pet, registrar interesse) **altera dados
reais**. Para testes que escrevem, criar/usar dados de teste claramente marcados,
ou considerar um projeto Supabase separado de staging.

> Modo demonstração: se a lib do Supabase não carregar (ex: sem internet) ou as
> chaves forem placeholder, o site cai em `DEMO_MODE` e usa `js/mockData.js`
> (nada é salvo). O banner "Modo demonstração" fica escondido (`display:none`)
> quando o Supabase conecta — vê-lo na árvore de acessibilidade sem checar a
> visibilidade computada é falso positivo.

## Mapa dos arquivos (raiz do repo)

| Arquivo | Papel |
|---|---|
| `index.html` / `js/app.js` | Página pública (Kanban, filtros, drawer de interesse) |
| `admin.html` / `js/admin.js` | Login e painel do abrigo (cadastro/edição/mover pets) |
| `admin-interessados.html` / `js/admin-interessados.js` | Central de Interessados (contatos recebidos) |
| `sobre.html` / `js/sobre.js` | Página institucional + métricas de impacto |
| `observatorio/index.html` / `js/observatorio.js` / `css/observatorio.css` | Observatório: dados públicos sobre adoção no Brasil (design isolado do resto) |
| `js/config.js` | ⚠️ Chaves do Supabase (URL + anon key) |
| `js/supabaseClient.js` | Inicializa Supabase ou ativa DEMO_MODE |
| `js/utils.js` | Helpers, incluindo auth compartilhada da área logada |
| `js/analytics.js` | Registro de visitas (tabela `site_visits`) |
| `js/mockData.js` | Dados de exemplo (só no DEMO_MODE) |
| `css/style.css` | Design system / todo o visual (exceto Observatório) |
| `sql/schema.sql` | Schema das tabelas do Supabase |

## Deploy

Push para `main` → Vercel publica em ~1 min. Branches:
`main` (produção), `dev`. Fazer trabalho em branch e abrir PR; não commitar/push
sem o usuário pedir.

## Convenções

- Mensagens de commit em português, estilo Conventional Commits
  (`feat:`, `fix:`, `refactor:`, `chore:`).
- Código e comentários em português.
- Sem framework/build — manter vanilla JS. Não introduzir dependências de build
  sem alinhar com o usuário.
