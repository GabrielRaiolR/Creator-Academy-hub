# Creator Academy

Área privada de uma mentoria para alunos de Bangladesh. O mentor escreve as aulas em português e adiciona a versão em বাংলা (bengali); os alunos assistem ao vídeo, leem o conteúdo no idioma escolhido e baixam os materiais em PDF.

Não é marketplace, rede social nem LMS: não há cadastro público, pagamentos, comentários, certificados ou progresso. Quem cria os acessos é o ADMIN.

## Stack

| Camada | Tecnologia |
| --- | --- |
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Estilo | Tailwind CSS 4, tokens derivados do design system em `System Design UXUI/` (ver `docs/UI-AUDIT.md`) |
| Banco | PostgreSQL no Neon + Drizzle ORM (migrations com drizzle-kit) |
| Autenticação | Better Auth (e-mail e senha, cadastro público desativado) |
| Arquivos | Vercel Blob **privado** (upload direto do navegador com token temporário, download via rota protegida) |
| Editor | Tiptap (conteúdo salvo como JSON e renderizado sem HTML bruto) |
| Validação | Zod |
| Testes | Vitest |

## Estrutura

```
app/[locale]/            rotas com idioma na URL (/pt, /bn)
  (auth)/login           tela de login
  (student)/             área do aluno: início, aulas, aula, perfil
  admin/                 painel, alunos, aulas (editor)
app/api/auth             handler do Better Auth
app/api/admin/uploads    emite token de upload (somente ADMIN)
app/api/resources/[id]   download protegido de PDF
components/              UI, layout, aulas (editor, renderizador, materiais)
db/schema, db/migrations Drizzle
lib/actions              Server Actions (toda mutação valida sessão/ADMIN no servidor)
lib/queries              leituras no banco
lib/permissions          regras de acesso
lib/i18n + messages/     dicionários pt-BR.json e bn-BD.json
scripts/                 seed e criação do primeiro ADMIN
```

## Rodando localmente

Pré-requisitos: Node.js 20.9+ e um PostgreSQL (Neon ou local).

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
# preencha .env.local (ver tabela abaixo)
npm run db:migrate
npm run db:seed              # opcional: dados de demonstração
npm run dev
```

Abra http://localhost:3000. A raiz redireciona para `/pt` ou `/bn` conforme o idioma salvo/navegador; sem sessão, para o login.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | Connection string do Postgres. No Neon, use a URL **pooled** (host com `-pooler`) e `sslmode=require`. |
| `BETTER_AUTH_SECRET` | sim | Segredo com 32+ caracteres. Gere com `npx @better-auth/cli secret` ou `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | sim | URL pública da aplicação, sem barra final (`http://localhost:3000` em dev). |
| `BLOB_READ_WRITE_TOKEN` | para PDFs | Token do Blob store **privado**. Sem ele o app funciona, mas o envio de PDF fica desativado com aviso. |
| `MAX_UPLOAD_SIZE_MB` | não | Tamanho máximo de PDF (padrão 20). |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | só scripts | Usadas por `db:seed` e `admin:create`. |
| `SEED_STUDENT_PASSWORD` | não | Senha dos alunos de demonstração do seed (padrão `aluno-demo-123`). |

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_`: nada disso chega ao navegador.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | gera tipos de rota do Next e roda `tsc --noEmit` |
| `npm test` | testes unitários (Vitest) |
| `npm run db:generate` | gera nova migration a partir de `db/schema` |
| `npm run db:migrate` | aplica migrations pendentes |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | dados de demonstração (idempotente) |
| `npm run admin:create` | cria ou promove um ADMIN |

## Banco de dados e migrations

O schema fica em `db/schema/` (`auth.ts` com as tabelas do Better Auth + campos `role`, `preferred_locale` e `active`; `lessons.ts` com `lesson`, `lesson_translation` e `lesson_resource`). Ao alterar o schema:

```bash
npm run db:generate   # cria o SQL em db/migrations
npm run db:migrate    # aplica
```

Faça commit da pasta `db/migrations`. Em produção, rode `npm run db:migrate` apontando `DATABASE_URL` para o Neon antes (ou logo depois) do deploy que depende da mudança.

## Seed

`npm run db:seed` cria, se ainda não existirem:

- 1 ADMIN (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`);
- 2 alunos: `aluno.pt@example.com` (português) e `aluno.bn@example.com` (bengali), senha `SEED_STUDENT_PASSWORD`;
- 3 aulas publicadas em PT e BN: só texto; texto + YouTube; texto + YouTube + PDF.

O PDF de exemplo só é enviado se `BLOB_READ_WRITE_TOKEN` estiver definido; caso contrário o seed avisa e segue. Rodar de novo não duplica nada.

## Primeiro ADMIN

Não existe cadastro público. Para criar o primeiro administrador (local ou produção):

```bash
npm run admin:create -- --name "Nome do Mentor" --email mentor@exemplo.com --password "uma-senha-forte"
```

Se o e-mail já existir, a conta é promovida a ADMIN, reativada e recebe a nova senha. Sem os parâmetros, o script usa `SEED_ADMIN_*`. Depois disso, novos alunos (e outros admins) são criados pela tela **Admin → Alunos**.

## Better Auth

- Configuração em `lib/auth/index.ts`, rota em `app/api/auth/[...all]/route.ts`.
- `disableSignUp: true`: o endpoint de cadastro responde erro; contas nascem só pelo painel ou pelo script.
- Campos `role`, `preferredLocale` e `active` são `input: false` (o cliente não consegue defini-los).
- Um hook impede criar sessão para conta inativa; desativar um aluno também apaga as sessões dele.
- Sessões duram 30 dias. Trocar a senha pelo perfil encerra as outras sessões.
- Recuperação de senha por e-mail ainda não existe: o ADMIN redefine a senha na edição do aluno.

## Vercel Blob (PDFs privados)

1. Na Vercel: **Storage → Create → Blob**, escolha acesso **Private** e conecte ao projeto. Isso cria `BLOB_READ_WRITE_TOKEN`.
2. Para desenvolvimento local, copie o token para `.env.local` (ou `vercel env pull`).

Fluxo de upload: o navegador pede um token temporário a `/api/admin/uploads` (que exige ADMIN, só aceita `application/pdf`, caminho `lessons/{id}/…pdf`, tamanho até `MAX_UPLOAD_SIZE_MB`), envia o arquivo direto para o Blob e depois uma Server Action confere tipo, tamanho e a assinatura `%PDF-` do arquivo salvo antes de registrá-lo; se algo falhar, o arquivo é apagado.

Fluxo de download: o link aponta para `/api/resources/{id}/download`, que verifica sessão, conta ativa, existência do material e se a aula é visível para aquele usuário (aluno só vê aula publicada). O arquivo é transmitido pelo servidor com `Cache-Control: private, no-store`; a URL do Blob e o token nunca chegam ao navegador.

## Neon

1. Crie um projeto em https://neon.tech (região próxima à da Vercel).
2. Copie a connection string **pooled** para `DATABASE_URL` (local e na Vercel).
3. Rode `npm run db:migrate` e `npm run admin:create` com essa URL.

A integração Neon da Vercel também funciona; nesse caso use a variável pooled que ela cria como `DATABASE_URL`.

## Deploy na Vercel

1. Suba o repositório para o GitHub/GitLab e importe na Vercel (framework detectado: Next.js).
2. Em **Settings → Environment Variables**, defina `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (a URL de produção, ex. `https://academy.seudominio.com`) e, opcionalmente, `MAX_UPLOAD_SIZE_MB`. Conecte o Blob privado para ter `BLOB_READ_WRITE_TOKEN`.
3. Aplique as migrations no banco de produção: `DATABASE_URL=... npm run db:migrate`.
4. Crie o primeiro ADMIN: `DATABASE_URL=... npm run admin:create -- --email ... --password ...`.
5. Faça o deploy. Se usar domínio próprio, atualize `BETTER_AUTH_URL` e faça um novo deploy.

## Idiomas

- URLs: `/pt/...` e `/bn/...`. Trocar o idioma mantém a página atual e salva a preferência no perfil (e em cookie).
- Textos da interface: `messages/pt-BR.json` e `messages/bn-BD.json` (mesmas chaves; o tipo `MessageKey` acusa chave inexistente em tempo de compilação).
- Conteúdo das aulas: uma linha em `lesson_translation` por idioma. Não há tradução automática.
- Se faltar a tradução de uma aula no idioma escolhido (só possível em rascunho), a página mostra a outra versão com um aviso.
- Fonte: Inter + Noto Sans Bengali, com ajustes de espaçamento e altura de linha para bengali.

## Regras de publicação

Uma aula só é publicada com slug válido e, nos dois idiomas, título e conteúdo preenchidos. Vídeo e PDF são opcionais. O editor lista exatamente o que falta. Uma aula publicada também não pode ser salva incompleta.

## Extensões futuras

O modelo foi mantido simples, mas com espaço para crescer:

- **Novos idiomas**: adicionar o locale em `lib/i18n/config.ts` e um novo `messages/*.json`; o banco já guarda traduções por locale.
- **Módulos/cursos/várias mentorias**: nova tabela (ex. `course`) com `lesson.course_id`.
- **Progresso e acesso por usuário**: tabelas de junção `user_lesson_progress` / `user_course_access`, checadas em `lib/permissions`.
- **Tradução assistida por IA**: ação que preenche o rascunho da tradução para revisão humana antes de publicar.
- **Vários admins**: já suportado (papel ADMIN).
