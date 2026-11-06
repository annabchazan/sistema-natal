# Sistema Natal — Apadrinhamento de Cartinhas

Sistema web para o apadrinhamento de cartinhas de Natal de crianças atendidas por instituições parceiras. O padrinho escolhe uma cartinha na página pública, finaliza o apadrinhamento, acompanha o andamento do presente e escolhe o ponto de entrega. A equipe gerencia cartinhas, instituições, pontos de entrega, crachás e usuários em uma área administrativa.

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC, 2026). A versão avaliada está identificada pela tag `tcc-2026`.

- **Produção:** https://natal.semprecrianca.org
- **Código-fonte:** https://github.com/annabchazan/sistema-natal

## Funcionalidades

**Padrinho**
- Lista pública de cartinhas, com filtros por tag e por instituição.
- Cadastro, login, recuperação e redefinição de senha.
- Apadrinhamento com escolha do ponto de entrega.
- Área pessoal: acompanha o andamento de cada presente, desiste de um apadrinhamento, edita o perfil e exclui a conta.
- E-mails automáticos (confirmação, cancelamento, lembrete de entrega, presente entregue, recuperação de senha).

**Equipe (admin)**
- Cadastro e edição de cartinhas, instituições, tags e pontos de entrega.
- Gerenciamento de status das cartinhas, exportação em CSV e impressão de crachás.
- Painel com métricas da campanha e gerenciamento de usuários, com papéis `editor`, `full` e `master`.

**Páginas informativas:** Como funciona, Dúvidas frequentes, Quem somos e Pontos de entrega.

### Ciclo de vida da cartinha

`disponivel` → `apadrinhada` → `conferida` → `embrulhado` → `entregue`, além de `carente` e `cancelada`.

Quando uma cartinha perde o padrinho (desistência, exclusão da conta ou devolução pela equipe), ela passa para `carente` e volta a ser oferecida na página pública. Somente as cartinhas `disponivel` ou `carente` aparecem ao público.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Components e Server Actions) |
| Interface | React 19, Tailwind CSS 4 |
| Linguagem | TypeScript |
| Banco de dados | MySQL, acessado com `mysql2` (consultas SQL diretas, sem ORM) |
| E-mail | Resend e React Email |
| Imagens | Cloudinary |
| Testes | Vitest |
| Hospedagem | Vercel (implantação a partir deste repositório, com tarefas agendadas via Cron) |

## Estrutura do projeto

```
app/              Páginas, Server Actions (app/actions) e rotas de API (app/api)
  admin/          Área administrativa
  api/cron/       Tarefas agendadas (lembretes e limpeza de campanhas)
emails/           Modelos de e-mail (React Email)
lib/              Banco, autenticação, sessão, rate limit, e-mail, segurança
__tests__/        Testes automatizados
scripts/          Scripts de apoio (aplicar migration, hooks, varredura de dependências)
docs/             Documentação de segurança
proxy.ts          Barreira adicional de acesso às rotas protegidas
vercel.json       Agendamento das tarefas (Cron)
migration_v*.sql  Migrations do banco
```

## Como rodar localmente

**Pré-requisitos:** Node.js 20.9 ou superior e um servidor MySQL.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz do projeto com as variáveis descritas na próxima seção.

3. Prepare o banco de dados (ver "Banco de dados" abaixo).

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação fica disponível em http://localhost:3000.

### Variáveis de ambiente

Os valores **não** ficam no repositório (`.env*` está no `.gitignore`). Em produção, são configurados nas Environment Variables da Vercel.

| Variável | Para que serve |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o MySQL (padrões: `localhost`, `3306`, `root`, vazio, `sistemanatal`) |
| `DB_SSL` | `true` para conectar ao banco com TLS verificado |
| `NEXT_PUBLIC_URL` | URL pública do site, usada em links de e-mails |
| `RESEND_API_KEY` | Chave da API do Resend (envio de e-mails) |
| `EMAIL_FROM`, `EMAIL_FROM_NAME` | Endereço e nome do remetente dos e-mails |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET` | Envio e armazenamento de imagens |
| `CRON_SECRET` | Segredo que autoriza as chamadas às rotas de Cron |

As credenciais reais de produção (banco e serviços externos) são fornecidas separadamente, por canal seguro, e não constam neste repositório.

## Banco de dados

As alterações de schema estão em `migration_v10.sql`, `migration_v11.sql` e `migration_v13.sql`. Para aplicá-las com verificações prévias, use o script de apoio. A senha é digitada no terminal:

```bash
node scripts/aplicar-migration.mjs --host HOST --user USUARIO --db BANCO --arquivo migration_v13.sql
```

Observação: as migrations anteriores à v10 e o schema inicial não estão versionados neste repositório. Para recriar o banco do zero é preciso partir de uma cópia do banco existente.

## Testes e verificações

```bash
npm test            # testes automatizados (Vitest)
npm run lint        # análise estática (ESLint)
npm run security    # testes + varredura de dependências vulneráveis
```

O plano de testes manuais está em `TESTES.md`.

## Segurança e privacidade

Sessões validadas no servidor (token aleatório, apenas o hash fica no banco), senhas com scrypt, controle de acesso em toda Server Action e rota de API, limite de tentativas contra abuso (login, cadastro, recuperação de senha) e retenção limitada de dados de campanhas encerradas. O detalhamento está em [`docs/seguranca.md`](docs/seguranca.md).

## Tarefas agendadas

Definidas em `vercel.json` e protegidas por `CRON_SECRET`:

| Rota | Horário (UTC) | O que faz |
|---|---|---|
| `/api/cron/lembretes` | 09:00 | Lembrete de prazo (10 dias antes e vencido) aos padrinhos que ainda não entregaram |
| `/api/cron/limpeza-campanhas` | 08:00 | Remove cartas, fotos (Cloudinary) e desistências de campanhas encerradas há mais de seis meses, preservando os totais. `?dry=1` só simula |
