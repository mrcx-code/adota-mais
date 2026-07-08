# Patinhas 🐾

Plataforma simples de adoção de pets: uma página pública em formato **Kanban**
(Disponível → Em processo → Adotado) e uma área de **admin** para abrigos/ONGs
cadastrarem e gerenciarem seus pets.

É um site 100% estático (HTML + CSS + JS puro, sem build), usando o
[Supabase](https://supabase.com) como banco de dados, autenticação e
armazenamento de fotos — os dois são gratuitos para começar.

Abra `index.html` num navegador e você já vê o site funcionando em **modo
demonstração** (com pets de exemplo, nada é salvo de verdade). Siga os passos
abaixo para conectar seu próprio banco de dados e publicar o site de verdade.

> ✅ **O banco de dados já está pronto!** Criei o projeto no Supabase, rodei
> o schema (`sql/schema.sql`) e já deixei as chaves preenchidas em
> `js/config.js` — pode pular direto para o **Passo 3** abaixo. O Passo 1
> fica aqui só de referência, caso um dia vocês precisem recriar o banco em
> outro projeto Supabase.

---

## Estrutura do projeto

```
index.html          → página pública (quadro Kanban)
admin.html           → login e painel do abrigo/ONG
css/style.css         → todo o visual do site
js/config.js          → ⚠️ único arquivo que você precisa editar
js/supabaseClient.js  → conecta ao Supabase (ou ativa o modo demonstração)
js/utils.js           → funções auxiliares
js/mockData.js        → dados de exemplo usados só no modo demonstração
js/app.js             → lógica da página pública
js/admin.js           → lógica da área de admin
sql/schema.sql         → script para criar as tabelas no Supabase
```

---

## Passo 1 — Criar o banco de dados (Supabase, grátis)

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New
   project** (plano gratuito).
2. Espere o projeto ser criado (leva 1–2 minutos) e vá em **SQL Editor** no
   menu lateral.
3. Abra o arquivo `sql/schema.sql` deste projeto, copie todo o conteúdo, cole
   no SQL Editor e clique em **Run**. Isso cria as tabelas de pets, abrigos
   (profiles), interesses e o bucket de fotos.
4. Vá em **Project Settings → API**. Copie o **Project URL** e a chave
   **anon public**.
5. Abra `js/config.js` neste projeto e cole os dois valores:

   ```js
   window.SUPABASE_URL = "https://xxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

6. (Recomendado para testar rápido) Em **Authentication → Providers → Email**,
   desligue a opção **Confirm email**. Assim, quando um abrigo criar a conta
   pela tela de cadastro, ele já consegue entrar direto, sem precisar
   confirmar por e-mail. Você pode reativar isso depois, se quiser mais
   segurança.

Pronto — o banco de dados está criado e configurado.

## Passo 2 — Testar localmente (opcional)

Você pode simplesmente abrir `index.html` e `admin.html` direto no navegador
(duplo clique no arquivo). Como o Supabase já está configurado no passo 1, o
site vai usar dados reais em vez do modo demonstração.

Se preferir simular um servidor local, dentro da pasta do projeto rode:

```bash
python3 -m http.server 8000
```

e acesse `http://localhost:8000` no navegador.

## Passo 3 — Publicar o site (já está no ar ✅)

O site já está publicado e com deploy automático configurado:

- **Repositório:** [github.com/mrcx-code/adota-mais](https://github.com/mrcx-code/adota-mais)
  (o código vive dentro da pasta `petadopt/` do repositório).
- **Hospedagem:** Vercel, conectada diretamente a esse repositório. Toda vez
  que a pasta `petadopt/` é atualizada no GitHub (via upload manual na aba
  "Add file → Upload files" do repositório, ou via `git push` se um dia
  vocês passarem a usar Git de linha de comando), a Vercel detecta sozinha e
  publica a nova versão — não precisa mais arrastar zip em lugar nenhum.
- **Domínio:** [patinhasbrasil.com.br](https://patinhasbrasil.com.br) (e
  `www.patinhasbrasil.com.br`), com HTTPS automático. O DNS está configurado na
  Hostinger, apontando para a Vercel.

> **Como atualizar o site no futuro:** edite os arquivos, depois vá em
> `github.com/mrcx-code/adota-mais/upload/main/petadopt` e arraste os
> arquivos alterados por cima dos existentes, com a mesma estrutura de
> pastas (`css/`, `js/`, etc.). Clique em **Commit changes** — a Vercel
> publica a nova versão automaticamente em cerca de 1 minuto.

## Como usar depois de publicado

- **Abrigos/ONGs**: acessam `/admin.html`, clicam em "Cadastrar meu abrigo" na
  primeira vez, e depois fazem login normalmente para cadastrar pets e mover
  os cards entre as colunas (Disponível → Em processo → Adotado).
- **Público**: acessa a página inicial, vê os pets em cada coluna, e clica em
  "Tenho interesse" para mandar seus dados de contato para o abrigo
  responsável.

## Próximos passos (ideias para depois)

- Filtros de busca (espécie, porte, cidade).
- Notificação por e-mail para o abrigo quando alguém demonstra interesse.
- Múltiplas fotos por pet.
