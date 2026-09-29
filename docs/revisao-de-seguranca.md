# Checklist de revisão de segurança

Use antes de commitar ou de aprovar uma mudança, principalmente em auth, actions, uploads, headers, banco ou dependências. Regras e decisões completas estão em [seguranca.md](seguranca.md).

## Como revisar

1. Leia o diff inteiro (`git status` e `git diff`, incluindo arquivos novos). Para cada arquivo mudado, leia o arquivo todo, não só o trecho alterado.
2. Passe pelo checklist abaixo e classifique cada achado:
   - **Crítico:** exploração direta, vazamento de dados, quebra de autenticação.
   - **Alto:** controle ausente que exige uma condição específica para ser explorado.
   - **Médio:** endurecimento, consistência, teste faltando.
3. Para cada achado, anote `arquivo:linha`, o que está errado, como seria explorado e a correção proposta.
4. Ao final, rode `npm run security` (e `npm run build` se mudou rota, config ou `proxy.ts`). Se algo falhar, corrija a causa; nunca enfraqueça um teste para passar.

## Checklist

**Auth e autorização**
- Toda Server Action e rota nova chama guarda de sessão/papel? O papel exigido é o menor possível (`edit` / `manage` / `users`)?
- Ação sobre um objeto confere que ele pertence a quem pede (padrinho só mexe nas próprias cartinhas)?
- Nenhuma decisão de permissão só no cliente (botão escondido não é controle).

**Entrada**
- Ids, listas e paginação vindos do cliente são validados (`idValido`, `idsValidos`)?
- Textos têm limite de tamanho; e-mail, telefone e senha passam por `lib/seguranca.ts`?
- O banco recebe só campos escolhidos (nada de `body` cru; status, papel e autor não vêm do cliente)?
- SQL só com `?`; interpolação só de lista de placeholders ou condições montadas no servidor.

**Cliente / XSS**
- Sem `dangerouslySetInnerHTML`, `innerHTML`, `eval`. Links externos com `rel="noopener noreferrer"`.
- Novas origens externas (script, imagem, iframe, fonte) foram adicionadas à CSP em `proxy.ts` de forma mínima?

**Uploads**
- Tipo pela assinatura do arquivo (`lib/imagem.ts`), tamanho limitado, sem confiar em `File.type` nem na extensão.

**Segredos**
- Nenhum segredo no código, em `NEXT_PUBLIC_*`, em log ou em resposta de erro. `.env*` fora do diff.

**Sessão e abuso**
- Ação que envia e-mail, exporta em massa ou pode ser tentada em loop usa `dentroDoLimite`.
- Mudança de senha ou e-mail derruba sessões (`revogarSessoesDoUsuario`) e pede a senha atual quando aplicável.

**Dependências e infra**
- `package.json` mudou? `npm audit --omit=dev` sem moderate ou pior. Nada de `audit fix --force` sem revisar a versão maior.
- Variável de ambiente nova está documentada (`docs/seguranca.md`, `CHECKLIST_DEPLOY.md`)?
- Migration nova é aditiva e tem a ordem de deploy explicada.

**Testes**
- Comportamento novo tem teste, incluindo o caso hostil. Se é um padrão que pode regredir, avalie incluí-lo em `__tests__/seguranca/gate.test.ts`.
