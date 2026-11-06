# Segurança do Sistema Natal

Este documento descreve os controles de segurança que já existem, as decisões tomadas, as regras para quem escreve código aqui e as limitações conhecidas. Quem mexe em auth, dados ou infra deve ler antes.

## O que está implementado

| Controle | Como | Onde |
|---|---|---|
| Sessão validada no servidor | Cookie com token aleatório (32 bytes); no banco fica só o SHA-256 (`sessoes`). Expira em 7 dias. | `lib/auth.ts`, `migration_v13.sql` |
| Logout e revogação reais | Logout apaga a linha em `sessoes`. Redefinir senha derruba todas as sessões; trocar a senha no perfil derruba as outras. | `lib/auth.ts`, `app/actions/auth.ts` |
| Cookie seguro | `httpOnly`, `sameSite=lax`, `secure` e prefixo `__Host-` em produção. Sessão nova a cada login (sem fixação). | `lib/auth.ts`, `lib/sessaoCookie.ts` |
| Senhas | scrypt com salt por usuário, comparação em tempo constante. Mínimo 8 caracteres (padrinho e admin), recusa senha comum, máximo 128. Sem fallback de texto puro. | `lib/auth.ts`, `lib/seguranca.ts` |
| Autorização no servidor | Toda Server Action e rota de API chama `validarPermissaoAdmin` / `getUsuarioAutenticado` / `cronAutorizado`. Papéis: `editor` (edita), `full` (cria e exclui), `master` (usuários e campanha). O layout do admin e o `proxy.ts` são só barreiras adicionais. | `lib/auth.ts`, `proxy.ts` |
| Anti-abuso | Bloqueio de login por e-mail (5 falhas, 15 min) e limites por IP/conta em login (60/15 min), cadastro (40/h), recuperação de senha, redefinição, apadrinhamento, exportação e conferência de senha atual. Contador no MySQL (funciona em serverless). | `lib/rateLimit.ts`, tabela `rate_limit` |
| Mensagens que não vazam contas | Erro único no login, hash falso quando o e-mail não existe, resposta genérica na recuperação de senha. | `app/actions/auth.ts` |
| Recuperação de senha | Token de 256 bits, validade de 1 hora, guardado como hash, uso único. | `app/actions/auth.ts` |
| Entrada validada no servidor | Validação de e-mail, telefone, tamanhos, ids e paginação. Ids de Server Action são revalidados. | `lib/seguranca.ts` e cada action |
| SQL | Só queries parametrizadas. Interpolação só de fragmentos montados no servidor (lista de `?`), checada pelo gate. | todo o código |
| Uploads de foto | Tipo pela assinatura do arquivo (JPEG/PNG/GIF), 5 MB, envio assinado ao Cloudinary (preset sem assinatura só como reserva). | `lib/imagem.ts`, `app/actions/cartinhas.ts` |
| Headers | HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, COOP; sem `X-Powered-By` e sem source maps. `no-store` em admin/usuário/checkout. | `next.config.ts` |
| CSP | Com nonce por requisição, sem `unsafe-inline` em script, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`. Libera só Cloudinary (imagens) e Google Maps (iframe). `style-src` mantém `unsafe-inline` (estilos calculados em runtime). | `proxy.ts` |
| Exportação CSV | Neutraliza injeção de fórmula, limita por usuário, `no-store`. | `app/api/admin/exportar/route.ts` |
| Crons | `CRON_SECRET` obrigatório, comparação em tempo constante, falha fechada. | `lib/cron.ts` |
| Segredos | `.env*` no `.gitignore`; nenhum segredo em variável `NEXT_PUBLIC_`. | `.gitignore`, gate |
| Dependências | `npm audit` sem vulnerabilidade moderate+ em produção. | `scripts/scan-dependencias.mjs` |
| LGPD | Exclusão de conta pelo próprio padrinho; retenção de 6 meses após o fim da campanha: o cron de limpeza apaga cartinhas, fotos no Cloudinary e desistências (nome e e-mail do padrinho) da campanha; `?dry=1` simula. | `app/actions/auth.ts`, cron |

## Decisões registradas

**RLS / isolamento no banco: não se aplica.** O MySQL não tem RLS, o sistema não é multi-tenant e o navegador nunca acessa o banco (só o servidor, por uma conexão única). A proteção real do banco é: credenciais só na Vercel, conexão com SSL, e acesso remoto liberado apenas para quem precisa.

**Dados das crianças (primeiro nome e idade) não são tratados como sensíveis** (decisão da equipe). Mesmo assim `buscarCartinhasParaCheckout` só aceita até 20 ids por chamada.

**Rate limit em MySQL, não em memória.** Na Vercel cada requisição pode cair numa instância diferente; um contador em memória não limitaria nada.

**Senha mínima de 8 para todos** (padrinho e admin): equipe pequena, login já protegido por bloqueio e recusa de senhas comuns. Senhas antigas mais curtas continuam valendo no login; a regra só vale ao definir uma senha nova.

**App instalável (PWA) sem service worker.** O `manifest.webmanifest` (gerado de `app/manifest.ts`) é estático e público: só nome, cores e ícones. Não há service worker, então nenhuma página fica em cache no aparelho e o app instalado sempre busca a versão atual. O banner de instalar aparece só para quem está logado e guarda no `localStorage` apenas a data em que foi dispensado.

## Segredos e chaves

Todos ficam nas variáveis de ambiente da Vercel (`vercel env`) e em `.env.local` (fora do git):

- `DB_*` (host, usuário, senha, banco, porta, `DB_SSL`), `CLOUDINARY_*`, `RESEND_API_KEY`, `EMAIL_FROM*`, `NEXT_PUBLIC_URL`, `CRON_SECRET`.
- `AUTH_SECRET` **não é mais usado**: a sessão passou a ser um token aleatório guardado no banco. Pode ser removida da Vercel depois que o deploy novo estiver no ar.
- Se algum segredo vazar (chat, print, commit), revogue na origem primeiro (painel do Resend, do Cloudinary, senha do banco) e só depois troque na Vercel. Não basta apagar do histórico do git.

## Regras para quem escreve código

1. **Toda Server Action e rota de API começa checando sessão/papel.** Se for pública de propósito, entre na lista `ACOES_PUBLICAS` do gate e explique o motivo no PR.
2. **Argumentos de Server Action são entrada de usuário**, mesmo os que parecem ids. Valide com `idValido` / `idsValidos` e limite tamanhos.
3. **SQL sempre com `?`.** Para `IN (...)`, gere os `?` no servidor.
4. **Nunca** `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` ou shell. O gate barra.
5. **Nada de segredo em `NEXT_PUBLIC_*`** nem no código.
6. **Upload:** valide pelo conteúdo (`lib/imagem.ts`), nunca por `File.type` ou extensão.
7. **Ação que custa** (e-mail, envio de arquivo, exportação em massa) passa por `dentroDoLimite`.
8. Mudou algo em auth, dados ou infra? Siga o [checklist de revisão](revisao-de-seguranca.md) antes de commitar.

## Como o gate funciona

- `npm run security` = toda a suíte do Vitest (comportamento + varredura estática em `__tests__/seguranca/gate.test.ts`) + `npm audit` de produção. Sem internet, o audit avisa e pula.
- O hook `.githooks/pre-commit` roda **lint → security → build**. Ele é ativado pelo `npm install` (script `prepare` aponta `core.hooksPath` para `.githooks`). Nunca use `--no-verify`.
- O gate falha quando: uma action ou rota fica sem guarda; aparecem `eval`/`innerHTML`/shell; SQL interpola algo fora da lista; surge segredo no código (chaves Resend/AWS/`sk_`, chave privada, connection string com senha, JWT); um `.env` é versionado; cookie, hash de senha, CSP ou headers regridem; o upload volta a confiar em `File.type`.
- Foi provado: um arquivo temporário com action sem guarda + `eval` + SQL interpolado + chave falsa derrubou 4 testes; depois de removido, voltou ao normal.

## Deploy: ordem obrigatória

1. Aplicar `migration_v13.sql` no banco de produção **antes** de subir o código (sem a tabela `sessoes` ninguém loga).
2. Subir o código. Todos os usuários logados precisarão entrar de novo uma vez.
3. Ligar SSL no banco (ver abaixo) e conferir o login.
4. Depois de estável, remover `AUTH_SECRET` da Vercel.

## Limitações conhecidas e próximos passos

- **Banco de produção sem SSL** (Hostinger). O código já usa SSL quando `DB_SSL=true` (com verificação de certificado); falta a hospedagem fornecer o certificado/CA e a env ser ligada. Enquanto isso, credenciais e dados trafegam sem criptografia. Restrinja no painel da Hostinger quais IPs podem conectar (o "MySQL remoto").
- Bloqueio de login por e-mail permite que alguém trave a conta de outra pessoa por 15 minutos digitando senha errada; é o preço de não vazar contas. O limite por IP reduz, mas não elimina.
- Rate limit de janela fixa: um atacante pode fazer até 2x o limite na virada da janela.
- A comparação de cadastro "e-mail já existe" revela que o e-mail está cadastrado (necessário para a experiência); é limitada por IP.
- scrypt usa os parâmetros padrão do Node (N=16384). Subir o custo exige versionar o hash (guardar os parâmetros) para não invalidar as senhas atuais.
- Sem 2FA para administradores, sem log de auditoria das ações do admin, sem backup criptografado documentado, sem CAPTCHA no cadastro/login. Candidatos, nesta ordem: log de auditoria, 2FA para `master`/`full`, Turnstile no cadastro.
- `style-src 'unsafe-inline'` permanece (estilos em runtime); risco baixo, sem script inline.
