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

### Terceiro nível de admin (Master)
Mencionado na entrevista como nível exclusivo para gerenciar permissões.

- Adicionar `master` ao ENUM `admin_role` em migração nova
- `master` pode promover/rebaixar outros admins (hoje só `full` pode)
- `full` perde a capacidade de gerenciar permissões (passa a ser exclusiva do `master`)
- Atualizar `validarPermissaoAdmin()` e as verificações no painel

### Exclusão de conta (LGPD)
Obrigatório por lei para sistemas com dados de usuários brasileiros.

- Página de solicitação de exclusão na área do usuário (`/usuario`)
- Ao excluir: anonimizar ou deletar dados pessoais, manter cartinhas com `apadrinhado_por_usuario_id = NULL`
- Definir política de retenção de dados com o cliente

### Impressão de crachá
Mencionado na entrevista, ainda não validado se será implementado.

- A confirmar com o cliente o formato e quando é gerado (no checkout? pelo admin?)

---

## Decisões Abertas com o Cliente

| Decisão | Contexto |
|---------|----------|
| Limite de cartinhas por padrinho | Sugestão: 3 por campanha. Confirmar. |
| Fluxo de reapadrinhamento | Zera padrinho e volta para `disponivel`, ou fica como `reapadrinhado` separado? |
| O padrinho original é notificado no cancelamento? | Define se precisa de template de e-mail adicional. |
| Formato do crachá | Se implementar: PDF? Impressão direta? Gerado pelo admin ou pelo padrinho? |
| Política de retenção de dados (LGPD) | Quantos anos manter histórico de apadrinhamentos após a campanha? |
