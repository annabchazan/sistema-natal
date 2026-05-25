# Sistema de Apadrinhamento de Cartinhas de Natal

## Contexto do Projeto

Projeto social que conecta padrinhos (doadores) a crianças de instituições parceiras por meio de cartinhas de Natal. O padrinho escolhe uma cartinha, se compromete a entregar o presente e a equipe organizadora rastreia o fluxo até a entrega.

- **Escala:** ~500 crianças por campanha, incluindo lista de espera
- **Equipe organizadora:** ~3 pessoas (equipe pequena por design, para evitar desorganização)
- **Problema principal que o sistema resolve:** Controle do processo que antes era feito de forma manual via WhatsApp e planilhas, com risco de perda de dados e doadores que adotam e somem sem entregar

---

## Stack Técnica

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Backend:** Server Actions (sem API REST separada)
- **Banco de dados:** MySQL 2 (`mysql2/promise`) com connection pool
- **Imagens:** Cloudinary (principal). Fallback base64 no banco existe mas deve ser evitado/removido
- **Autenticação:** Sessão própria via cookie HTTP-only assinado com HMAC-SHA256 (scrypt para hash de senha)
- **Estilo:** Tailwind CSS v4
- **Deploy:** (a definir)

---

## Estrutura de Pastas

```
app/
├── actions/          # Server Actions (mutations)
│   ├── auth.ts       # Login, cadastro, permissões
│   ├── cartinhas.ts  # CRUD de cartinhas + finalizar apadrinhamento
│   ├── instituicoes.ts
│   ├── tags.ts
│   └── pontosEntrega.ts
├── admin/            # Painel administrativo (protegido por middleware)
│   ├── layout.tsx    # Verifica acesso admin
│   ├── page.tsx      # Painel com abas: cartinhas, instituicoes, tags, pontos, usuarios
│   ├── cartinhas/    # Página dedicada ao formulário de cartinha
│   └── tags/
├── components/
│   ├── admin/        # Componentes do painel admin (Form + Tabela por entidade)
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ListaCartinhasHome.tsx   # Grid de cartinhas com filtros (home pública)
│   ├── MiniCartApadrinhamento.tsx  # Carrinho flutuante
│   └── WhatsAppButton.tsx
├── hooks/
│   └── useCarrinhoApadrinhamento.ts  # Carrinho via localStorage
├── checkout/         # Página de confirmação de apadrinhamento
├── usuario/          # Área do padrinho (incompleta — só mostra dados do usuário)
├── login/ e cadastro/
├── duvidas-frequentes/  # FAQ (implementado)
├── quem-somos/          # Página institucional (implementado)
├── como-funciona/       # Explicação do processo (implementado)
└── pontos-entrega/      # Lista de pontos de entrega
lib/
├── db.ts             # Pool de conexão MySQL
└── auth.ts           # Lógica de sessão, hash, permissões
middleware.ts         # Protege rotas /admin
database_updates.sql  # Migrações manuais (histórico de ALTER TABLE)
```

---

## Banco de Dados — Schema Atual

### `usuarios`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INT PK AI | |
| nome | VARCHAR(100) | |
| telefone | VARCHAR(20) | WhatsApp |
| email | VARCHAR(100) UNIQUE | lowercase na gravação |
| senha | VARCHAR(255) | scrypt hash |
| tipo | ENUM('admin','padrinho') | default 'padrinho' |
| admin_role | ENUM('full','editor') NULL | NULL para padrinhos |

### `cartinhas`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INT PK AI | |
| nome_crianca | VARCHAR(100) | |
| idade | INT | sem validação de min/max no código |
| texto_cartinha | TEXT | mensagem da criança |
| presente_pedido | VARCHAR(150) | |
| instituicao_id | INT FK | |
| tag_id | INT FK NULL | usado para categorias (ex: Menino, Menina) |
| numero_sequencial | INT | gerado por instituição via `gerarNumeroSequencial()` |
| foto_cartinha | VARCHAR(500) | URL Cloudinary ou base64 (evitar base64) |
| data_limite_entrega | DATE NULL | prazo para entrega do presente |
| status | ENUM | ver estados abaixo |
| data_apadrinamento | DATETIME NULL | preenchido em `finalizarApadrinamento()` |
| apadrinhado_por_usuario_id | INT FK NULL | FK para usuarios.id |

> Não existe (e não deve existir) coluna `apadrinada` — era um campo legado que foi removido. O `status` é a única fonte de verdade.

**Status possíveis da cartinha:**
`disponivel` → `apadrinhada` → `conferida` → `carente` → `embrulhado` → `reapadrinhado` → `entregue`
`cancelada` (pode ser acionado de qualquer estado pelo admin)

### `instituicoes`
| Campo | Tipo |
|-------|------|
| id | INT PK AI |
| nome_instituicao | VARCHAR(150) |
| responsavel | VARCHAR(100) |
| contato | VARCHAR(50) |
| quantidade_vagas | INT | define o range do numero_sequencial |

### `tags`
| Campo | Tipo |
|-------|------|
| id | INT PK AI |
| nome | VARCHAR(50) |

> Tags são usadas para categorizar cartinhas na home. **Menino/Menina são gerenciados como tags** — não existe campo `genero` separado. Isso foi uma decisão consciente do projeto.

### `pontos_entrega`
| Campo | Tipo |
|-------|------|
| id | INT PK AI |
| nome_local | VARCHAR(100) |
| endereco | VARCHAR(255) |
| horario | VARCHAR(100) |

---

## Controle de Acesso

### Tipos de usuário
- **padrinho**: usuário comum, pode ver e apadrinhar cartinhas
- **admin**: acesso ao painel `/admin`

### Papéis de admin (`admin_role`)
| Papel | Pode criar/excluir | Pode editar | Pode gerenciar usuários |
|-------|-------------------|-------------|------------------------|
| `full` | Sim | Sim | Sim |
| `editor` | Não | Sim | Não |

> A entrevista menciona 3 níveis (Master, Completo, Limitado). Hoje temos 2. Master seria um nível acima de `full` com poder exclusivo de gerenciar permissões. A ser implementado.

### Funções de permissão em `lib/auth.ts`
- `requireAdminAccess()` — redireciona se não for admin
- `adminPodeCriarOuExcluir(usuario)` — retorna bool
- `adminPodeEditar(usuario)` — retorna bool
- `validarPermissaoAdmin("manage" | "edit")` — retorna `{ ok, message, usuario }`

---

## Fluxo de Apadrinhamento

```
Home (/) → ver cartinhas disponíveis
   ↓ clica "Apadrinhar"
Carrinho (localStorage) — MiniCartApadrinhamento.tsx
   ↓ clica "Ir para Checkout"
/checkout — requer login (redireciona para /login?next=/checkout se não logado)
   ↓ clica "Confirmar Apadrinhamento"
finalizarApadrinamento() em cartinhas.ts
   ↓ sucesso
/usuario — área do padrinho
```

> Race condition resolvida: `finalizarApadrinamento()` usa `START TRANSACTION` + `SELECT ... FOR UPDATE` antes de atualizar o status.

---

## Decisões de Design Registradas

| Decisão | Motivo |
|---------|--------|
| Gênero (Menino/Menina) via Tags, não campo separado | Flexibilidade — admin pode criar categorias sem mudar schema. Tags são reutilizáveis para outras categorizações futuras. |
| Carrinho via localStorage | Sistema não precisa persistir carrinhos abandonados. Reduz complexidade de sessão. |
| Server Actions em vez de API REST | Projeto de escala pequena, Next.js fullstack simplifica deploy e segurança. |
| Scrypt para hash de senha (não bcrypt) | Scrypt é mais seguro contra ataques de hardware. Implementado via Node.js nativo (sem lib extra). |
| Sessão própria (não NextAuth) | Controle total, sem overhead de biblioteca externa para um sistema simples. |

---

## O que está Faltando (Backlog Priorizado)

### Prioridade Alta — Resolver antes de ir a produção

- [x] **Race condition no checkout**: `finalizarApadrinamento()` usa `START TRANSACTION` + `SELECT ... FOR UPDATE` — **feito**
- [x] **Status faltando no enum**: `carente`, `entregue`, `cancelada` adicionados no banco (`migration_v2.sql`) e no código — **feito**
- [x] **Remover código morto**: `hasStatusColumn()`, `hasApadrinhadoPorUsuarioColumn()` e todas as branches duplicadas removidas — **feito**
- [x] **Campo `apadrinada` legado**: removido do código. `status` é única fonte de verdade — **feito**
- [x] **AUTH_SECRET sem fallback seguro**: agora lança erro explícito se `AUTH_SECRET` não estiver definida — **feito**
- [x] **Página do padrinho**: `/usuario` lista todas as cartinhas apadrinhadas com barra de progresso, prazo com alerta, foto e status — **feito**
- [x] **Exportação CSV**: aba "Exportar" no admin com filtro por status e seleção de colunas. Rota `GET /api/admin/exportar?status=...&colunas=...` — **feito**

### Prioridade Média

- [x] **E-mail de confirmação pós-apadrinhamento**: enviado via Resend após `finalizarApadrinamento()`. Template em `emails/ConfirmacaoApadrinhamento.tsx`, cliente em `lib/email.ts` — **feito**
- [x] **Lembretes automáticos**: cron diário às 9h via Vercel (`vercel.json`). Rota `GET /api/cron/lembretes` protegida por `CRON_SECRET`. Templates em `emails/LembreteEntrega.tsx`. Controle de duplicatas em `lembretes_enviados` (`migration_v4.sql`) — **feito**
- [x] **Cancelar apadrinhamento**: padrinho cancela da área dele enquanto status for `apadrinhada`. Cartinha volta para `disponivel`. Action `cancelarApadrinamento()` em `cartinhas.ts` — **feito**
- [x] **Limite de cartinhas por padrinho**: 20 por checkout, validado em `finalizarApadrinamento()` — **feito**
- [x] **Recuperação de senha**: fluxo completo via e-mail (Resend). Páginas `/esqueci-senha` e `/redefinir-senha`. Requer `migration_v3.sql` aplicada — **feito**
- [x] **Limpar localStorage no logout**: `limparCarrinho()` chamado em `handleLogout()` no Header — **feito**

### Prioridade Baixa / Futuro

- [ ] **Terceiro nível de admin (Master)**: `admin_role` ENUM com `master`, `full`, `editor`
- [ ] **Paginação nas listagens**: admin e home carregam tudo sem limite
- [x] **Dashboard admin com métricas**: cards por status, total de padrinhos, % entregues, barra de progresso e alerta de prazos vencidos — **feito**
- [ ] **Índices no banco**: `idx_cartinhas_status`, `idx_cartinhas_instituicao`, `idx_cartinhas_apadrinhado_por`
- [ ] **Impressão de crachá**: mencionado na entrevista como "a verificar"
- [x] **Notificação quando entregue**: e-mail disparado em `salvarCartinha()` ao detectar transição para `entregue`. Template `emails/PresenteEntregue.tsx` — **feito**
- [ ] **Exclusão de conta (LGPD)**: obrigatório legalmente

---

## Problemas de Qualidade a Corrigir

- ~~`console.log` de debug em `ListaCartinhasHome.tsx`~~ — **removido**
- ~~Typo `"✓ Apadinhada"`~~ — **corrigido para "Apadrinhada"**
- ~~Textos sem acento no Header e admin~~ — **corrigidos**
- [ ] **Revisão geral de layout**: passar por todas as páginas (home, checkout, usuário, admin, login, cadastro, esqueci/redefinir senha) e alinhar visual, espaçamentos e responsividade antes de ir a produção

---

## Como Rodar Localmente

```bash
npm install
# Criar .env.local com as variáveis abaixo
npm run dev
```

### Variáveis de ambiente necessárias (`.env.local`)
```
DATABASE_URL=mysql://user:pass@host/dbname
# OU variáveis separadas: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
AUTH_SECRET=<string aleatória longa — obrigatório>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...   # preferir unsigned preset
# CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET só se usar signed upload

# E-mail (Resend) — obrigatório para confirmação de apadrinhamento e recuperação de senha
RESEND_API_KEY=re_...
EMAIL_FROM=contato@seudominio.com.br   # domínio verificado no Resend; sem isso usa sandbox
EMAIL_FROM_NAME=Natal Solidário        # nome exibido como remetente (opcional, tem fallback)

# URL pública — usada para montar links nos e-mails (ex: link de redefinição de senha)
NEXT_PUBLIC_URL=https://seudominio.com.br   # em dev o padrão é http://localhost:3000

# Cron de lembretes automáticos (Vercel injeta automaticamente nas rotas cron)
CRON_SECRET=<string aleatória longa>   # protege GET /api/cron/lembretes
```

### Popular o banco
Executar `database_updates.sql` no MySQL após criar o schema base.
Em seguida, executar as migrations na ordem: `migration_v2.sql` (status extras) → `migration_v3.sql` (recuperação de senha) → `migration_v4.sql` (tabela `lembretes_enviados`).

---

## Notas da Entrevista com o Cliente

- Projeto atende ~500 crianças com lista de espera
- Maior dor: doadores que adotam e somem — lembretes automáticos são críticos
- Equipe pequena por design (3 pessoas) — sistema deve ser simples de operar
- Processo atual: planilhas + WhatsApp. Em um ano perderam tudo por desorganização
- Comunicação com doadores: WhatsApp e e-mail
- Impressão de crachá: mencionado, ainda não validado se será implementado
