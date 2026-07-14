# Patinhas Brasil — Visão de Produto & Roadmap 🐾
*Documento do time · foco de lançamento: ONGs primeiro*

Elaborado por **Bruna (PM)**, com **Téo (Design)** e **Marina (Marketing)**. Base: análise do site patinhasbrasil.com.br (home + Sobre nós). Instagram @patinhasbrasill ainda em fase inicial — a analisar quando houver acesso.

---

## 1. Leitura do que existe hoje (Bruna)

O Patinhas é um **marketplace de dois lados**: de um lado ONGs, abrigos e protetores que cadastram pets; do outro, famílias que adotam. O produto já tem o essencial no ar:

- **Mural em Kanban** (Disponível → Em processo → Adotado) — o diferencial visual e o coração da proposta de transparência.
- **Fluxo de interesse** com um clique, que envia o contato direto pra ONG (mais formulário próprio do abrigo, quando existe).
- **Área do abrigo** (login, cadastro, gestão) e **Central de Interessados**.
- **Sobre nós** já articula bem a missão: *"Nosso objetivo não é substituir o trabalho das ONGs. É fortalecê-lo."* — essa é a nossa tese.
- **Observatório** de dados públicos — ativo de autoridade/PR ainda subaproveitado.

Todos os números de impacto estão em zero (0 ONGs, 0 pets, 0 adoções). Ou seja: **estamos no marco zero de um marketplace**, e é isso que define toda a estratégia de lançamento.

> ⚠️ **Achado crítico (Rafa precisa validar):** a home de produção está exibindo o banner "Modo demonstração" e a mensagem "Não foi possível carregar os pets agora". Se isso está no ar pro público, é o pior cartão de visita possível num lançamento. **Prioridade zero:** garantir que o Supabase conecta em produção e o mural carrega — mesmo que vazio, com um empty-state bonito em vez de erro.

---

## 2. A tese de produto: o problema do "ovo e da galinha" (Bruna)

Todo marketplace de dois lados sofre do mesmo dilema no início: **adotante não vem se o mural está vazio, e a ONG não cadastra se não vê adotantes.** Um dos lados precisa vir primeiro.

**Nossa aposta: começar pelas ONGs (a oferta).** Motivos:

1. Sem pets cadastrados, o adotante chega num mural vazio e nunca volta. Oferta primeiro evita queimar a demanda.
2. A ONG tem **dor real e recorrente** (organizar interessados, divulgar, dar conta do volume) — dá pra entregar valor pra ela mesmo com pouca demanda inicial.
3. Cada ONG traz **os próprios seguidores e a própria rede** — elas são também um canal de aquisição de adotantes.
4. Poucas ONGs âncora já enchem o mural. É um lado **concentrado e alcançável** (dá pra falar com elas uma a uma).

**Conclusão:** o lançamento é **ONG-first**. A meta da largada não é "quantos adotantes", é **quantas ONGs ativas com pets no mural**.

---

## 3. Visão de produto (Bruna)

> **Ser a camada operacional da adoção responsável no Brasil** — não só uma vitrine de pets, mas a ferramenta que organiza e fortalece o trabalho de quem resgata.

Isso muda o enquadramento: não competimos com "outro site de adoção", competimos com **a planilha bagunçada, o direct lotado e o caderninho** da ONG. Se a ONG *gerencia* a adoção dentro do Patinhas, ela fica — e o mural se enche sozinho.

Três pilares que sustentam a visão:

- **Transparência** — o Kanban público é a marca. Todo mundo vê em que etapa cada pet está.
- **Simplicidade** — cadastrar um pet e gerir interessados tem que ser mais fácil que o jeito atual da ONG.
- **Impacto** — dar à ONG números do próprio trabalho (pets, interessados, adoções) e agregá-los no Observatório como autoridade nacional.

---

## 4. Prioridades de produto pra vencer o lado ONG (Bruna)

O que faz uma ONG **entrar, ficar e trazer pets**:

1. **Onboarding em minutos.** Criar conta e cadastrar o primeiro pet sem fricção — foto tirada do celular, campos mínimos, cadastro em massa depois.
2. **Valor imediato mesmo sem demanda.** Painel de interessados organizado, cada pet com **link e imagem prontos pra compartilhar** (story, WhatsApp, bio). A ONG usa o Patinhas como a "página oficial" dos pets dela.
3. **Confiança.** Perfil da ONG, e transparência de ponta a ponta pra dar segurança ao adotante.
4. **Distribuição embutida.** Cada pet gera um card compartilhável (imagem OG) — a ONG divulga e, de quebra, divulga o Patinhas.

*(Rafa entra aqui pra dimensionar esforço — o stack é vanilla + Supabase, então priorizar o que dá mais valor com menos peso.)*

---

## 5. Roadmap por fases (Bruna)

| Fase | Janela | Meta principal | Foco |
|---|---|---|---|
| **0 · Fundação** | Agora | Site 100% no ar (sem erro), 5–10 ONGs âncora, mural populado | Corrigir carregamento, recrutar ONGs manualmente, validar fluxo ponta a ponta |
| **1 · Lançamento ONG-first** | ~30 dias | 20–30 ONGs ativas com pets reais | Campanha e conteúdo focados em ONG; onboarding assistido; provas sociais |
| **2 · Ativar a demanda** | 30–60 dias | Primeiras adoções pelo Patinhas | Empurrar adotantes (mural já cheio), SEO, histórias de adoção, compartilhamento |
| **3 · Retenção & rede** | 60–90+ dias | ONGs que voltam toda semana | Métricas de impacto pra ONG, Observatório como PR, parcerias e indicação |

**Regra de ouro:** só abrir a torneira de adotantes (Fase 2) **depois** que o mural estiver com pets suficientes pra não decepcionar quem chega.

---

## 6. Leitura de design (Téo)

O que está bom: **identidade coesa** — logo "patinhas" com a pegada no "i", verde da marca (#527353) e paleta creme passam acolhimento e seriedade ao mesmo tempo. Serve bem à causa.

Ajustes que recomendo antes/durante o lançamento:

- **Fotos reais no lugar dos placeholders.** A home usa imagens de banco (Unsplash). No lançamento, priorizar fotos dos pets reais das ONGs âncora — autenticidade converte muito mais.
- **Empty-state caprichado.** Enquanto o mural tiver poucos pets, mostrar um estado vazio bonito e humano ("Os primeiros bichinhos estão chegando 🐾"), nunca um erro.
- **Sistema visual pro social.** Já temos os templates do post 1 (verde/creme, Poppins, pegadas). Vale fechar um kit: capa, card de pet, selo de etapa, story. Mantém tudo reconhecível como Patinhas.
- **Card de pet compartilhável.** Um layout padrão (foto + nome + etapa + logo + link) que a ONG posta direto. É design a serviço de distribuição.

---

## 7. Plano de conteúdo & aquisição de ONGs (Marina)

Como o lançamento é ONG-first, o conteúdo tem **dois trabalhos**: encantar o público geral (marca) e, principalmente, **convencer ONGs a se cadastrarem**.

**Canais:**
- **Instagram (@patinhasbrasill)** — marca, emoção, alcance, compartilhamento. Público amplo + protetores.
- **LinkedIn** — institucional, ótimo pra falar com fundadores de ONG, parceiros e imprensa. Reforça credibilidade.

**Pilares de conteúdo:**
1. **Manifesto/marca** — quem somos, por que existimos (post 1 já pronto).
2. **Para ONGs** — "cadastre grátis", como funciona, benefícios, provas sociais das primeiras parceiras. *Este é o pilar prioritário na largada.*
3. **Produto/transparência** — o mural Kanban, o diferencial (conceito Kanban já pronto).
4. **Histórias & impacto** — adoções reais, bastidores de ONG, dados do Observatório.

**Aquisição direta de ONGs (o que move o ponteiro na Fase 0/1):**
- Lista de ONGs/protetores alvo por região + abordagem 1:1 (DM, e-mail, WhatsApp).
- Onboarding assistido pras primeiras: a gente ajuda a cadastrar os primeiros pets.
- Transformar cada ONG parceira em prova social ("A [ONG] já está no Patinhas 💚").

**Proposta de time — nova pessoa de conteúdo:**
Pra sustentar frequência (3–4 posts/semana + stories) sem sobrecarregar, proponho adicionar ao time a **Duda — Criadora de Conteúdo / Social Media**. Ela cuidaria de calendário editorial, roteiros de reels/stories, legendas e adaptação dos posts pra cada rede, trabalhando junto do Téo (arte) e da Marina (estratégia). *Confirma que quer a Duda no time?*

---

## 8. Próximos passos sugeridos

1. **Rafa:** validar/consertar o carregamento do mural em produção (prioridade zero).
2. **Bruna + Rafa:** priorizar 2–3 melhorias de onboarding de ONG pra Fase 0.
3. **Marina:** montar a lista de ONGs âncora e o roteiro de abordagem.
4. **Téo + Duda:** fechar o kit visual (card de pet + templates de post/story).
5. **Time:** publicar o post 1 (Manifesto) e o post "para ONGs" pra abrir o perfil.
