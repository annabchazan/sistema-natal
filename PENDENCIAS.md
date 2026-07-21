# Pendências — Sistema de Apadrinhamento de Cartinhas de Natal

Backlog vivo do projeto. Atualizar conforme itens forem concluídos ou repriorizado.

---

## Prioridade Alta — Resolver antes de ir a produção

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

### `useSearchParams()` sem Suspense boundary em `/login`
Descoberto rodando `next build` (`npx next build`) pra validar a página de crachás: o build de produção falha ao prerenderizar `/login` — `useSearchParams()` precisa estar dentro de um `<Suspense>` boundary. Não impede o `next dev`, mas quebra `npm run build`/deploy.

- [ ] Envolver o componente que usa `useSearchParams()` em `/login` com `<Suspense>` (ver https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)

### Fotos quebradas de cartinhas antigas (`/uploads/...` 404)
Duas cartinhas no banco (dev) têm `foto_cartinha` apontando para `/uploads/cartinha_...` — caminho local de uma versão antiga do código, antes da integração com Cloudinary (`public/uploads` só tem `.gitkeep`, os arquivos nunca existiram neste ambiente). O código atual não escreve mais nesse caminho (só Cloudinary ou base64), então não é um bug ativo — é dado legado.

- [ ] Conferir depois: `SELECT id, nome_crianca, foto_cartinha FROM cartinhas WHERE foto_cartinha LIKE '/uploads/%';` e reeditar essas cartinhas no admin (reupload) ou limpar o campo (`UPDATE cartinhas SET foto_cartinha = NULL WHERE foto_cartinha LIKE '/uploads/%';`)

### Revisão geral de layout e responsividade
Passar por todas as páginas e alinhar visual, espaçamentos e responsividade antes do lançamento.

Páginas a revisar:
- [ ] `/` — home com grid de cartinhas
- [ ] `/checkout` — confirmação de apadrinhamento
- [ ] `/usuario` — área do padrinho
- [ ] `/admin` — painel administrativo (todas as abas)
- [ ] `/login` e `/cadastro`
- [ ] `/esqueci-senha` e `/redefinir-senha`
- [ ] `/duvidas-frequentes`, `/quem-somos`, `/como-funciona`
- [ ] `/pontos-entrega`

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

### ~~Terceiro nível de admin (Master)~~ ✅ Feito
- `master` adicionado ao ENUM `admin_role` (`migration_v6.sql`)
- `master` é o único nível que pode promover/rebaixar outros admins (`adminPodeGerenciarPermissoes()`)
- `full` perdeu a capacidade de gerenciar permissões, mas continua podendo criar/editar/excluir cartinhas, instituições, tags e pontos de entrega
- `validarPermissaoAdmin()` ganhou o valor `"users"`; aba "Usuários" no painel agora é gated por `canManageUsers`
- **Pendente:** aplicar `migration_v6.sql` em produção e promover manualmente um admin existente a `master` (senão ninguém acessa a aba Usuários)

### Exclusão de conta (LGPD)
Obrigatório por lei para sistemas com dados de usuários brasileiros.

- Página de solicitação de exclusão na área do usuário (`/usuario`)
- Ao excluir: anonimizar ou deletar dados pessoais, manter cartinhas com `apadrinhado_por_usuario_id = NULL`
- Definir política de retenção de dados com o cliente

### Impressão de crachá
Mencionado na entrevista, ainda não validado se será implementado.

- A confirmar com o cliente o formato e quando é gerado (no checkout? pelo admin?)

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
| Domínio | Vão usar subdomínio do site atual. Cliente vai conversar com o responsável pelo DNS. | ⏳ Aguardando registro DNS do lado do cliente |

---

## Novos Itens de Backlog (a partir das respostas acima)

### ~~Histórico de desistência de apadrinhamento~~ ✅ Feito
- Nova tabela `desistencias` (`migration_v8.sql`): `cartinha_id`, `usuario_id`, `nome_crianca`/`numero_sequencial` (snapshot), `data_desistencia`.
- `cancelarApadrinamento()` agora roda em transação (`beginTransaction` + `SELECT ... FOR UPDATE`, igual `finalizarApadrinamento()`): atualiza a cartinha e grava a linha em `desistencias` atomicamente.
- **Falta**: aplicar `migration_v8.sql` no banco. Consulta futura via SQL direta por enquanto (`SELECT * FROM desistencias ORDER BY data_desistencia DESC`) — aba dedicada no admin fica pra depois, se for útil.

### ~~Notificar equipe por e-mail no cancelamento~~ ✅ Feito
- `enviarAvisoDesistenciaEquipe()` em `lib/email.ts`, chamada dentro de `cancelarApadrinamento()` após o commit, para `cartinhas@semprecrianca.org`.
- Template dedicado `emails/AvisoDesistenciaEquipe.tsx` (mais simples que o e-mail do padrinho).

### Retenção de dados (LGPD) — 6 meses pós-campanha
- Não existe hoje o conceito de "fim de campanha" no schema — precisa decidir onde registrar essa data (nova tabela `campanhas`? campo de config?).
- Job (cron ou manual) que, 6 meses após o fim da campanha, anonimiza/remove dados pessoais de apadrinhamento (nome do padrinho, e-mail, telefone), mantendo dados agregados se necessário.
- Cliente faz a exportação para o Mailchimp por fora — sistema não precisa integrar com Mailchimp.

### ~~Crachá especial (PCD / alergia alimentar)~~ ✅ Feito
- Campo `necessidade_especial` (BOOLEAN) + `observacao_especial` (TEXT) em `cartinhas` (`migration_v7.sql`). Checkbox + textarea condicional em `FormularioCartinha.tsx`. Indicador "Crachá neon" na `TabelaCartinhas.tsx`.
- Nova aba **Crachás** no admin (`app/components/admin/Cracha/`): filtra por instituição, seleciona cartinhas e abre `/admin/crachas/imprimir?ids=...` — página HTML com CSS de impressão (`@page`, grid 2x2, `page-break-after`), sem depender de biblioteca de PDF (o admin usa Ctrl+P / "Salvar como PDF" do navegador).
- Logo da organização em `public/logo-sempre-crianca.png` (recebida do cliente em 2026-07-20).
- Crachás com `necessidade_especial`: card da frente vem destacado (borda/fundo verde-limão, texto "ESPECIAL — imprimir em neon") e é seguido, na mesma folha, por um segundo card com a observação — pensado pra equipe cortar e colar no verso do crachá físico impresso em papel neon (não é impressão duplex automática, que seria frágil de depender do driver da impressora).
- Header/Footer/WhatsAppButton ganharam `print:hidden` pra não aparecerem na folha impressa.

### WhatsApp — desbloqueado parcialmente
- CNPJ recebido: `12.629.489/0001-44`. Falta o cliente definir o número dedicado antes de seguir com o cadastro no Meta Business Manager.
