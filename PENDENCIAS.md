# Pendências — Sistema de Apadrinhamento de Cartinhas de Natal

Backlog vivo do projeto. Atualizar conforme itens forem concluídos ou repriorizado.

---

## Prioridade Alta — Resolver antes de ir a produção

### ~~E-mails para padrinhos não eram entregues (domínio não verificado no Resend)~~ ✅ Resolvido
Diagnosticado em 2026-07-29: `EMAIL_FROM` estava no sandbox (`onboarding@resend.dev`), e o Resend bloqueava (403) qualquer destinatário que não fosse o dono da conta. Resolvido com a verificação do domínio no Resend; confirmado em 2026-11-03 que os e-mails já chegam corretamente ao cliente.

- [x] Verificar um domínio próprio no Resend
- [x] Atualizar `EMAIL_FROM` em produção
- [ ] (Opcional) Dar visibilidade às falhas de envio — em `lib/email.ts`, erro do Resend ainda só vai pra `console.error`, então uma falha futura continuaria silenciosa

### ~~Lembretes automáticos por e-mail~~ ✅ Feito
- Cron diário às 9h via Vercel (`vercel.json`)
- Rota `GET /api/cron/lembretes` protegida por `CRON_SECRET`
- Template `emails/LembreteEntrega.tsx` (dois modos: `10d` e `vencido`)
- Controle de duplicatas na tabela `lembretes_enviados` (`migration_v4.sql`)
- Requer `CRON_SECRET` no painel da Vercel

### Lembretes automáticos via WhatsApp
Complementar o lembrete por e-mail com mensagem no WhatsApp do padrinho, usando o mesmo cron (`/api/cron/lembretes`).

**Plataforma escolhida:** WhatsApp Cloud API (Meta) — gratuita até 1.000 conversas/mês.

**O que falta fazer antes de implementar:**
- [ ] Criar conta no Meta Business Manager com CNPJ da organização
- [ ] Verificar o negócio na Meta (pode levar 1–5 dias úteis)
- [ ] Criar app no Meta for Developers e ativar o produto WhatsApp Business
- [ ] Separar um número de telefone exclusivo para a API (não pode estar no WhatsApp normal)
- [ ] Cadastrar e aprovar os templates de mensagem (~24h de revisão):
  - Template `lembrete_10d`: "Olá, {{1}}! Faltam 10 dias para entregar o presente de {{2}}. Prazo: {{3}}."
  - Template `lembrete_vencido`: "Olá, {{1}}! O prazo para entregar o presente de {{2}} venceu em {{3}}. Entre em contato com a equipe."

**O que muda no código (quando chegar a hora):**
- Adicionar `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` nas variáveis de ambiente
- Criar `lib/whatsapp.ts` com função `enviarLembreteWhatsapp()`
- Chamar junto com `enviarLembreteEntrega()` dentro do loop em `app/api/cron/lembretes/route.ts`
- Adicionar coluna `tipo` ENUM expandida em `lembretes_enviados` se quiser rastrear WPP separado do e-mail

---

### ~~Overlay do carrinho/menu ficando preto~~ ✅ Feito
- `bg-black bg-opacity-20` não funciona no Tailwind v4 — corrigido para `bg-black/20` em `Header.tsx`

### ~~Textos sem acento no `/checkout`~~ ✅ Feito
- Corrigidos em `CheckoutClient.tsx`: "Próximos Passos", "botão", "área", "ficará", "Após", "você poderá", "até", "criança", "Não é o quanto você dá", "você põe"

### ~~"ID: {cartinha.id}" visível nos cards da home~~ ✅ Feito
- Removido de `ListaCartinhasHome.tsx`

### ~~Loop infinito ao carregar a home (Maximum update depth exceeded)~~ ✅ Feito
- `temCartinha()` em `useCarrinhoApadrinhamento.ts` era recriada a cada render; o `useEffect` de `ListaCartinhasHome.tsx` dependia dela e reexecutava infinitamente
- Corrigido envolvendo `temCartinha` em `useCallback` com dependência em `cartinhas` (estado interno do hook)

### ~~`useSearchParams()` sem Suspense boundary em `/login`~~ ✅ Feito
- `LoginForm` (que usa `useSearchParams()`) já está envolvido em `<Suspense fallback={null}>` em `login/page.tsx`
- Confirmado rodando `npx next build` em 2026-07-22: `/login` prerenderiza como estático (`○`), build completo sem erros

### ~~Fotos quebradas de cartinhas antigas (`/uploads/...` 404)~~ ✅ Feito
Duas cartinhas no banco (dev) tinham `foto_cartinha` apontando para `/uploads/cartinha_...` — caminho local de uma versão antiga do código, antes da integração com Cloudinary. Era dado legado, não um bug ativo. Resolvido (marcado como feito em 2026-11-03).

### Revisão de segurança
Revisão feita em 2026-07-22: SQL injection, autenticação, sessão, upload e exportação CSV foram checados. Nenhuma injeção de SQL encontrada (todas as queries usam `?` parametrizado, inclusive filtros dinâmicos e `IN (...)`). Sessão (HMAC + expiração), hash de senha (scrypt + `timingSafeEqual`) e proteção do `/admin` (middleware + `requireAdminAccess()` revalidando no servidor) estão corretos. Três gaps menores foram encontrados e corrigidos em 2026-07-28:

- [x] **Rate limiting no login** — `loginUsuario()` (`app/actions/auth.ts`) bloqueia por 15 minutos após 5 tentativas de senha incorretas seguidas. Rastreado numa tabela nova `login_tentativas`, **por e-mail digitado** (não por `usuarios.id`) — lógica pura em `calcularBloqueioAposFalha()` (`lib/auth.ts`), `migration_v9.sql`. Linha apagada no login bem-sucedido.
- [x] **Timing side-channel no login** — `validarSenha()` agora roda sempre, mesmo quando o e-mail não existe, comparando contra `HASH_SENHA_INEXISTENTE` (hash fixo gerado uma vez em `lib/auth.ts`). Elimina a diferença de tempo de resposta entre e-mail cadastrado/não cadastrado.
- [x] **CSV injection** — `celula()` em `app/api/admin/exportar/route.ts` agora prefixa com `'` qualquer valor que comece com `=`, `+`, `-`, `@`, tab ou `\r` antes de montar a linha do CSV, neutralizando fórmulas que o Excel/Sheets executariam ao abrir o arquivo.
- [x] **Enumeração de contas via mensagem de bloqueio** (achado numa revisão de segurança em cima do fix acima, em 2026-07-28): a primeira versão do rate limiting gravava tentativas/bloqueio em colunas de `usuarios`, então só e-mails cadastrados chegavam a ver "Muitas tentativas de login" — um e-mail inexistente nunca bloqueava, o que permitia inferir quais e-mails estão cadastrados testando 5 senhas erradas. Corrigido rastreando por e-mail digitado (tabela `login_tentativas`) em vez de por usuário — agora e-mail cadastrado e inexistente se comportam de forma idêntica.
- `migration_v9.sql` (tabela `login_tentativas`) já aplicada em produção em 2026-07-28.

### ~~Revisão geral de layout e responsividade~~ ✅ Feito
Revisão de todas as páginas (visual, espaçamentos e responsividade) concluída — marcada como feita em 2026-11-03:
- [x] `/` — home com grid de cartinhas
- [x] `/checkout` — confirmação de apadrinhamento
- [x] `/usuario` — área do padrinho
- [x] `/admin` — painel administrativo (todas as abas)
- [x] `/login` e `/cadastro`
- [x] `/esqueci-senha` e `/redefinir-senha`
- [x] `/duvidas-frequentes`, `/quem-somos`, `/como-funciona`
- [x] `/pontos-entrega`

### ~~Menu lateral (drawer) para mobile~~ ✅ Feito
Em 2026-07-22, ao revisar responsividade, foram encontradas duas navegações que sumiam sem alternativa no mobile: o menu principal (`Header.tsx`, links escondidos abaixo de `lg`) e a sidebar do admin (`admin/page.tsx`, escondida abaixo de `md`). A correção rápida (painel inline no Header, `<select>` no admin) foi substituída por um drawer de verdade:

- Componente reutilizável `app/components/Drawer.tsx`: desliza da esquerda ou direita, overlay escuro (fecha ao clicar fora), fecha com **Esc**, trava o scroll do body enquanto aberto.
- `Header.tsx`: painel inline do menu público trocado pelo `Drawer` (mesmos links: Quem somos, Como funciona, Dúvidas frequentes, Pontos de entrega).
- `AdminMobileNav.tsx`: `<select>` trocado por um botão (mostra a aba atual) que abre o `Drawer` listando as abas como itens clicáveis, mesmo destaque visual da sidebar desktop.
- Testado no navegador (fluxo de abrir/fechar via overlay e Esc, scroll lock) no Header; o do admin reaproveita o mesmo componente já validado.

---

## Prioridade Média

### ~~Reapadrinhamento~~ ✅ Feito
- Padrinho pode cancelar da sua área (`/usuario`) enquanto status for `apadrinhada`
- Action `cancelarApadrinamento()` em `cartinhas.ts`: zera padrinho e volta status para `disponivel`
- Botão "Cancelar apadrinhamento" em `BotaoCancelarApadrinamento.tsx` com confirmação
- Cartinha reaparece automaticamente na home após o cancelamento

### ~~Limite de cartinhas por padrinho~~ ✅ Feito
- Limite de **20 cartinhas por checkout**
- Validado em `finalizarApadrinamento()` antes de abrir a transação
- Mensagem clara retornada ao usuário quando o limite é atingido

### ~~Notificação ao padrinho quando entregue~~ ✅ Feito
- E-mail disparado automaticamente em `salvarCartinha()` quando status muda para `entregue`
- Detecta transição via query do status anterior antes do UPDATE
- Template `emails/PresenteEntregue.tsx`, função `enviarNotificacaoEntrega()` em `lib/email.ts`
- Disparo não-bloqueante (`.catch`) — falha no e-mail não impede o salvamento

---

## Prioridade Baixa / Futuro

### ~~Paginação nas listagens~~ ✅ Feito
- Home (`/`): 12 cartinhas por página, reseta ao filtrar — `ListaCartinhasHome.tsx`
- Admin: 20 linhas por página com contador de registros — `TabelaCartinhas.tsx`

### ~~Índices no banco~~ ✅ Feito
- `idx_cartinhas_status` já criado na `migration_v2.sql`
- `idx_cartinhas_instituicao` e `idx_cartinhas_apadrinhado_por` adicionados em `migration_v5.sql`

### Débito técnico — organização do código
Encontrado numa revisão geral em 2026-07-22 (não bloqueia produção, é manutenibilidade a médio prazo):

- [ ] **Auditar duplicação de definições**: já corrigimos as cores de status (3 paletas diferentes pro mesmo status, unificadas em `lib/statusCartinha.ts`) e a FAQ (2 listas divergentes, unificadas em `app/data/faqCartinhas.ts`). Vale procurar outras duplicações parecidas no restante do código (ex: listas/labels repetidos em mais de um componente).
- [ ] **Quebrar páginas grandes em subcomponentes**: `app/usuario/page.tsx` faz praticamente tudo inline (card de perfil, lista de cartinhas, barra de progresso) — extrair pelo menos o card de cada cartinha pra um componente próprio facilitaria manutenção futura.
- [ ] Revisar outros componentes grandes do admin (`Cartinha/index.tsx`, `Cracha/index.tsx`) com o mesmo critério, se fizer sentido.

### ~~Terceiro nível de admin (Master)~~ ✅ Feito
- `master` adicionado ao ENUM `admin_role` (`migration_v6.sql`)
- `master` é o único nível que pode promover/rebaixar outros admins (`adminPodeGerenciarPermissoes()`)
- `full` perdeu a capacidade de gerenciar permissões, mas continua podendo criar/editar/excluir cartinhas, instituições, tags e pontos de entrega
- `validarPermissaoAdmin()` ganhou o valor `"users"`; aba "Usuários" no painel agora é gated por `canManageUsers`
- `migration_v6.sql` já aplicada em produção, e confirmado em 2026-11-03 que há admin `master` e tudo funcionando em produção.

### ~~Exclusão de conta (LGPD)~~ ✅ Feito
- `excluirConta()` em `app/actions/auth.ts` + botão `BotaoExcluirConta` no rodapé de `/usuario`, com testes em `__tests__/actions/auth.test.ts`
- Transação com `FOR UPDATE`; admins não podem se excluir por aqui; bloqueia se houver cartinha `conferida` ou `embrulhado`
- Cartinhas `apadrinhada` voltam para `carente` e geram linha em `desistencias` (com snapshot de nome/e-mail do padrinho)
- Cartinhas `entregue` perdem o vínculo mas guardam `nome_padrinho`/`email_padrinho` (`migration_v10.sql`, `migration_v11.sql`)
- Sessão só é limpa depois do commit

**Ajustes menores (todos resolvidos em 2026-11-03):**
- ~~`nome_padrinho`/`email_padrinho` em `desistencias` sem prazo~~ — decidido: o cliente apaga quando quiser (ver "Retenção de dados")
- [x] Removido o `DELETE FROM lembretes_enviados WHERE usuario_id = ?` de `excluirConta()` (o cron só grava `cartinha_id` e `tipo`, então a query não fazia nada)
- [x] Texto de confirmação do `BotaoExcluirConta` agora avisa que as cartinhas apadrinhadas voltam a ficar disponíveis (continua sendo `confirm()` nativo)

---

## Decisões Respondidas pelo Cliente (2026-07-20)

Respostas de Gabi (responsável pelo projeto) às perguntas pendentes.

| Decisão | Resposta do cliente | Status |
|---------|---------------------|--------|
| Limite de cartinhas por padrinho | **20 está bom.** Empresas que apadrinham em volume recebem uma instituição inteira por fora do site, então não passa pelo limite. | ✅ Confirmado — nenhuma mudança de código necessária |
| Histórico de desistência | **Querem sim** um registro de quem desistiu e quando (histórico completo, não só uma marcação simples). Cliente perguntou se a desistência ocorre no fechamento do carrinho ou depois da "compra" — resposta: só existe desistência **depois** da confirmação (`cancelarApadrinamento()`); abandono de carrinho antes disso é só localStorage e não precisa de rastro. | 🔧 A implementar — ver item novo abaixo |
| Aviso de desistência por e-mail | **Sim.** Notificar `cartinhas@semprecrianca.org` sempre que um padrinho desistir depois de confirmado. | 🔧 A implementar — ver item novo abaixo |
| Formato do crachá | Exemplo enviado pelo cliente (Google Drive). Crianças com necessidade especial (PCD ou alergia alimentar) têm crachá **impresso em neon**, com **observação no verso**. Ainda não definido se geração é no admin ou automática. | ⏳ Aguardando análise do exemplo enviado — ver item no backlog |
| Retenção de dados (LGPD) | **6 meses** após o fim da campanha. Depois disso, o cliente migra os dados relevantes para o Mailchimp (banco de dados geral deles) por conta própria. | 🔧 A implementar — ver item novo abaixo |
| WhatsApp — CNPJ | `12.629.489/0001-44` | ✅ Recebido |
| WhatsApp — número dedicado | Cliente ainda vai definir internamente quem fica com essa função (não pode ser um número institucional já em uso). | ⏳ Bloqueado — aguardando definição interna do cliente |
| WhatsApp — aprovação dos templates | Ainda não respondido nesta rodada. | ⏳ Pendente |
| Domínio | Vão usar subdomínio do site atual. Cliente vai conversar com o responsável pelo DNS. | ✅ Resolvido (confirmado em 2026-11-03) |

---

## Novos Itens de Backlog (a partir das respostas acima)

### ~~Histórico de desistência de apadrinhamento~~ ✅ Feito
- Nova tabela `desistencias` (`migration_v8.sql`): `cartinha_id`, `usuario_id`, `nome_crianca`/`numero_sequencial` (snapshot), `data_desistencia`.
- `cancelarApadrinamento()` agora roda em transação (`beginTransaction` + `SELECT ... FOR UPDATE`, igual `finalizarApadrinamento()`): atualiza a cartinha e grava a linha em `desistencias` atomicamente.
- `migration_v8.sql` aplicada (confirmado em 2026-11-03 que tudo roda em produção). Consulta via SQL direta por enquanto (`SELECT * FROM desistencias ORDER BY data_desistencia DESC`) — aba dedicada no admin fica pra depois, se for útil.

### ~~Notificar equipe por e-mail no cancelamento~~ ✅ Feito
- `enviarAvisoDesistenciaEquipe()` em `lib/email.ts`, chamada dentro de `cancelarApadrinamento()` após o commit, para `cartinhas@semprecrianca.org`.
- Template dedicado `emails/AvisoDesistenciaEquipe.tsx` (mais simples que o e-mail do padrinho).

### ~~Retenção de dados (LGPD) — 6 meses pós-campanha~~ ✅ Feito
- "Fim da campanha" = `campanhas.data_encerramento`, preenchido por `finalizarCampanha()` (`app/actions/campanhas.ts`), ação **manual** do Super Adm na aba Campanhas.
- Cron diário `/api/cron/limpeza-campanhas` (`app/api/cron/limpeza-campanhas/route.ts`, 08:00): para campanhas encerradas há mais de 6 meses e com `dados_removidos_em IS NULL`, apaga as cartinhas da campanha e marca `dados_removidos_em`. Os totais agregados em `campanhas` ficam. Também limpa `rate_limit` vencido. Testado manualmente em 2026-09-21 (sem campanha elegível ainda).
- Cliente faz a exportação para o Mailchimp por fora — sistema não precisa integrar com Mailchimp.
- **Decidido (2026-11-03):** `desistencias` sobrevive à limpeza e o cliente apaga esses registros quando quiser, por conta própria — o cron não mexe nela. As cartinhas `entregue` já somem junto com o resto, então o snapshot delas deixa de ser problema.
- Contas em `usuarios` não são tocadas pelo cron (padrinho pode participar de várias campanhas) — só saem pela exclusão de conta.

### ~~Crachá especial (PCD / alergia alimentar)~~ ✅ Feito
- Campo `necessidade_especial` (BOOLEAN) + `observacao_especial` (TEXT) em `cartinhas` (`migration_v7.sql`). Checkbox + textarea condicional em `FormularioCartinha.tsx`. Indicador "Crachá neon" na `TabelaCartinhas.tsx`.
- Nova aba **Crachás** no admin (`app/components/admin/Cracha/`): filtra por instituição, seleciona cartinhas e abre `/admin/crachas/imprimir?ids=...` — página HTML com CSS de impressão (`@page`, grid 2x2, `page-break-after`), sem depender de biblioteca de PDF (o admin usa Ctrl+P / "Salvar como PDF" do navegador).
- Logo da organização em `public/logo-sempre-crianca.png` (recebida do cliente em 2026-07-20).
- Crachás com `necessidade_especial`: card da frente vem destacado (borda/fundo verde-limão, texto "ESPECIAL — imprimir em neon") e é seguido, na mesma folha, por um segundo card com a observação — pensado pra equipe cortar e colar no verso do crachá físico impresso em papel neon (não é impressão duplex automática, que seria frágil de depender do driver da impressora).
- Header/Footer/WhatsAppButton ganharam `print:hidden` pra não aparecerem na folha impressa.

### WhatsApp — desbloqueado parcialmente
- CNPJ recebido: `12.629.489/0001-44`. Falta o cliente definir o número dedicado antes de seguir com o cadastro no Meta Business Manager.
