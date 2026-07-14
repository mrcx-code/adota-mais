# Patinhas Brasil — Rodada do Time 🐾
*13 de julho de 2026 · respostas do time às frentes abertas*

---

## 1. DM padrão para ONGs (pronta pra enviar) — Sofia

Texto final, sem colchetes. Se quiser personalizar, troque só o "⟨nome da ONG⟩". Vale mandar sempre com uma linha antes citando algo real do trabalho da ONG (aumenta muito a resposta).

> Oii, tudo bem? 🐾
> Aqui é do Patinhas Brasil, uma plataforma nova e **gratuita** de adoção responsável. A gente acompanha o trabalho de vocês e ficou encantado — adoraríamos ter a ⟨nome da ONG⟩ entre as primeiras ONGs parceiras.
>
> Funciona simples: você cadastra os pets num mural público (Disponível → Rumo ao lar → Família formada) e recebe todos os interessados organizados num painel só seu. Sem planilha, sem perder contato no meio do direct.
>
> É de graça e não substitui o trabalho de vocês — a ideia é fortalecer. Posso te mandar o link e, se quiser, a gente cadastra os primeiros bichinhos junto com você. Topa? 💚

**Versão curtinha (pra quem responde pouco):**
> Oi! 🐾 Somos o Patinhas Brasil, plataforma gratuita de adoção responsável. Queremos a ⟨nome da ONG⟩ entre as primeiras parceiras: cadastro dos pets grátis e interessados organizados num painel. Posso te mandar o link e ajudar no primeiro cadastro?

**Reativação (as 3 ONGs que já criaram conta):**
> Oi! Vi que vocês já criaram a conta da ⟨nome⟩ no Patinhas — que alegria! 💚 Quer uma mãozinha pra cadastrar os primeiros pets? Faço junto com você numa call de 5 minutinhos, ou te mando um passo a passo. Assim os bichinhos já aparecem no mural pras famílias.

---

## 2. Os 3 primeiros posts — o que comunicar — Duda + Marina

Sequência pensada pra ONG-first: abrir com emoção, puxar ONG, mostrar o produto.

**Post 1 — Lançamento (abrir o perfil).**
Arte recomendada: **"Chegamos!"** (Instagram) e **"Dois mundos"** espelhado no LinkedIn.
*O que comunica:* nascemos, o que é o Patinhas, para quem é. Emoção + boas-vindas.
CTA: seguir e compartilhar. (Legenda pronta no PDF de proposta e no doc de propostas.)

**Post 2 — Para ONGs (o pilar que enche o mural).**
Arte: **"É de uma ONG?"** (post-ongs).
*O que comunica:* cadastro grátis, gestão de interessados num painel, alcance nacional. "Não substituímos, fortalecemos."
CTA: cadastre sua ONG + marque uma ONG que precisa ver isso.

**Post 3 — Como funciona / transparência (converter e explicar).**
Arte: **"Kanban / produto"** (conceito-C) ou o carrossel Manifesto completo.
*O que comunica:* o mural em tempo real (Disponível → Rumo ao lar → Família formada), adoção sem custo e sem intermediário.
CTA: conheça os pets / salve o post.

**Legenda final do Post 1** (a mesma dos outros docs, revisada):
> Hoje começa o Patinhas Brasil. 🐾 A gente acredita numa coisa simples: cada patinha merece um lar de verdade — e ninguém deveria fazer isso sozinho. Conectamos ONGs, protetores e famílias para tornar a adoção responsável mais simples, organizada e transparente. Segue a gente e compartilha com quem ama os bichos. 💚 🔗 patinhasbrasil.com.br

---

## 3. Revisão do site por departamento

### ⚖️ Jurídico (Dr. Alonso) — Termos e Privacidade
**Veredito: está num nível muito bom** para o lançamento — melhor do que a média de plataformas nesse estágio. Os Termos deixam claro o papel de intermediário e a proibição de venda de animais; a Política já cita LGPD, bases legais, direitos do titular e que não há cookie de publicidade. Pontos a ajustar (não bloqueiam o lançamento, mas resolver logo):

1. **Identificação do controlador.** Hoje consta só "Patinhas Brasil". A LGPD pede identificação do controlador — incluir a pessoa/PJ responsável (e CNPJ, quando houver). Enquanto for pessoa física, deixar isso explícito.
2. **Encarregado (DPO).** Indicar um canal do encarregado de dados (pode ser o mesmo e-mail, mas nomeado como tal).
3. **Prazo de retenção.** "Pelo tempo necessário" é vago; definir prazos (ex.: contato de interessado guardado por X meses após o último contato).
4. **Consentimento no formulário de interesse.** Já há link pra política; recomendo um checkbox explícito de ciência/consentimento no envio (reforça a base legal e casa com o popup do item 5).
5. **Idade.** A política diz "maiores de 18"; vale um aviso/checkbox no formulário de interesse também.
6. **Termo de responsabilidade na adoção.** Deixar claro que a responsabilidade pela adoção (e eventual termo) é da ONG — já está implícito, mas convém uma linha direta.

> ⚠️ Importante: sou um apoio jurídico do time, não substituo a validação de um(a) advogado(a) com registro antes de decisões finais — sobretudo sobre enquadramento como controlador/operador e retenção.

### 🛠️ Engenharia (Rafa)
Prioridade: confirmar no navegador real que a lib do Supabase (via CDN) aceita a chave `sb_publishable_`; garantir empty-state bonito no mural (0 pets ≠ erro). Nice-to-have: imagem OG dinâmica por pet (link compartilhável), lazy-load de fotos.

### 🎨 Design (Téo)
Trocar fotos de banco por pets reais; aplicar os rótulos emocionais nas colunas (À espera de um lar / Rumo ao lar / Família formada); usar o campo "foto da nova família" que já existe no form pra criar prova social na coluna de adotados.

### 📣 Marketing (Marina)
Home precisa de um convite claro pra ONG acima da dobra ("É de uma ONG? Cadastre grátis"), além do botão do topo. Adicionar UTM nos links das campanhas (a base já registra UTM — ótimo pra medir).

### 💬 Atendimento (Sofia)
FAQ da home está boa. Sugiro um canal visível de contato (WhatsApp/e-mail) pra ONG tirar dúvida antes de cadastrar — reduz abandono no onboarding.

### 📦 Produto (Bruna)
Tudo aponta pra mesma coisa: o gargalo é oferta. As melhorias acima servem à meta única de **ONG cadastrando pet**. Priorizar nesta ordem: empty-state → convite ONG na home → rótulos emocionais → prova social de família.

---

## 4. Feature: popup "avise-me quando tiver um pet" — Bruna + Rafa + Jurídico

**Parecer do time: boa ideia, e barata de fazer.** Enquanto o mural está vazio (fase atual), em vez de perder quem chega, a gente captura o interesse e cria demanda pronta pra quando os pets entrarem. Vira também um argumento pra ONG ("já tem gente esperando adotar na sua região").

**Regras refinadas (Bruna):**
- **Quando disparar:** só quando o resultado do mural estiver **vazio** — seja porque não há pets, seja porque o filtro aplicado não retornou nada. Nunca sobre um mural cheio.
- **Não perturbar:** mostrar no máximo 1x por visitante a cada 7 dias (controle via armazenamento local). Fácil de fechar.
- **O que pedir:** e-mail (obrigatório) + preferências opcionais (estado, espécie, porte) pra notificar só o que interessa.
- **Consentimento (Jurídico):** checkbox explícito "Quero receber um aviso quando um pet compatível for cadastrado" + link da Política. Base legal: consentimento. Guardar data/hora do consentimento.
- **Confirmação:** mensagem de sucesso simples ("Prontinho! A gente te avisa 💚") e opção de descadastro em todo e-mail.

**Implementação (Rafa):**
- Nova tabela `notificacoes_interesse` (email, uf, especie, porte, consent_at, created_at, ativo).
- No primeiro momento, o disparo pode ser **manual/semi-manual**: quando uma ONG cadastra um pet, a gente consulta quem pediu aviso naquele estado/espécie e envia. Depois automatiza com uma Edge Function do Supabase + serviço de e-mail.
- Cuidado LGPD: nunca expor a lista; e-mail em cópia oculta ou envio individual.

**Recomendação:** vale fazer. Começa manual (baixo custo), valida se as pessoas topam, e a gente automatiza se engajar.

---

## 5. Prompt do dashboard de métricas — Duda + Bruna

Objetivo: uma página que a gente abre e vê a saúde do Patinhas, puxando dados do Supabase (tabelas `pets`, `profiles`, `interests`, `site_visits`).

**Métrica-norte:** nº de **ONGs ativas** (com ≥1 pet) e nº de **adoções** (pets em "Família formada").

**Métricas por bloco:**
- *Oferta:* ONGs cadastradas · ONGs com pelo menos 1 pet · pets por status (disponível / em processo / adotado) · novos pets por semana · tempo médio do cadastro até a adoção.
- *Demanda:* visitas (por dia/semana) · origem das visitas (UTM) · dispositivo · interesses enviados · taxa de interesse por visita.
- *Funil:* visitas → interesses → adoções (e taxas de conversão entre etapas).
- *Engajamento por pet:* pets com mais interesses · pets parados há muito tempo em "disponível".
- *(Social, manual):* seguidores IG/LinkedIn, alcance dos posts — entra depois.

**Prompt pronto pra gerar o dashboard:**
> Crie um dashboard web de página única (HTML) para o Patinhas Brasil que puxe dados do nosso Supabase (tabelas pets, profiles, interests, site_visits) e mostre, com o visual da marca (verde #527353, creme #F7F2E7, fonte Poppins/limpa): (1) cartões de topo com ONGs ativas com ≥1 pet, total de pets disponíveis, adoções concluídas e interessados na semana; (2) um funil visita → interesse → adoção com taxas; (3) gráfico de novos pets e interesses por semana; (4) distribuição de pets por status; (5) origem das visitas por UTM; (6) tabela dos pets com mais interessados e dos pets parados há mais tempo. Inclua um seletor de período (7/30/90 dias) e botão de atualizar. Trate o estado vazio (0 pets) com uma mensagem amigável, sem erro.

> 💡 Posso montar esse dashboard agora como um painel ao vivo (que recarrega os dados do Supabase toda vez que você abre) — é só pedir.

---

## Onde cada coisa está
- Propostas visuais e legendas → pasta `post1-lancamento/` + `Patinhas-Proposta-Lancamento.pdf`
- Lista de ONGs + abordagens → `Patinhas-ONGs-e-Abordagem.md`
- Visão e roadmap → `Patinhas-Visao-e-Roadmap.md`
- Calendário editorial → `Patinhas-Calendario-Editorial.md`
- Manual da ONG → `Patinhas-Manual-ONG-Cadastrar-Pet.md`
