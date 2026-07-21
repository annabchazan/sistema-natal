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

### Histórico de desistência de apadrinhamento
- Hoje `cancelarApadrinamento()` só zera `apadrinhado_por_usuario_id` e volta o status — não fica rastro de quem desistiu.
- Cliente quer histórico completo (quem, qual cartinha, quando), não só uma flag booleana.
- Precisa: nova tabela (ex.: `desistencias`) gravando `cartinha_id`, `usuario_id`, `nome_crianca`/`numero_sequencial` (snapshot), `data_desistencia`. Gravar dentro da mesma transação do `UPDATE` em `cancelarApadrinamento()`.
- Consultável futuramente numa aba do admin ("Desistências") ou export CSV.

### Notificar equipe por e-mail no cancelamento
- Adicionar envio para `cartinhas@semprecrianca.org` dentro de `cancelarApadrinamento()`, junto ao e-mail que já vai pro padrinho (`enviarCancelamentoApadrinamento` em `lib/email.ts`).
- Pode reaproveitar o mesmo template ou criar um mais simples voltado à equipe.

### Retenção de dados (LGPD) — 6 meses pós-campanha
- Não existe hoje o conceito de "fim de campanha" no schema — precisa decidir onde registrar essa data (nova tabela `campanhas`? campo de config?).
- Job (cron ou manual) que, 6 meses após o fim da campanha, anonimiza/remove dados pessoais de apadrinhamento (nome do padrinho, e-mail, telefone), mantendo dados agregados se necessário.
- Cliente faz a exportação para o Mailchimp por fora — sistema não precisa integrar com Mailchimp.

### Crachá especial (PCD / alergia alimentar)
- Exemplo de crachá enviado pelo cliente via Google Drive (não acessado ainda — ver link na conversa).
- Regular: crachá padrão. Especial: impresso em **neon**, com **observação** (tipo de necessidade/alergia) no verso.
- ✅ **Feito**: campo `necessidade_especial` (BOOLEAN) + `observacao_especial` (TEXT) em `cartinhas` (`migration_v7.sql`). Checkbox + textarea condicional em `FormularioCartinha.tsx`. Indicador "Crachá neon" na `TabelaCartinhas.tsx`.
- **Falta**: aplicar `migration_v7.sql` no banco. E decidir/implementar a geração do crachá em si — layout visual (regular vs. neon), se é PDF ou impressão direta, e se é gerado manualmente pelo admin ou automaticamente.

### WhatsApp — desbloqueado parcialmente
- CNPJ recebido: `12.629.489/0001-44`. Falta o cliente definir o número dedicado antes de seguir com o cadastro no Meta Business Manager.
