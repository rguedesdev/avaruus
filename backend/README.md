# Backend do Avaruus

API modular em Fastify, GraphQL (Mercurius), MongoDB/Mongoose e TypeScript.

## Desenvolvimento

1. Copie `.env.example` para `.env` e ajuste os valores locais.
2. Inicie somente o MongoDB do projeto:

   ```bash
   npm run docker:dev:up
   ```

3. Inicie a API:

   ```bash
   npm run dev
   ```

A API fica em `http://localhost:3333/graphql`, o GraphiQL é habilitado fora de produção e o health check fica em `http://localhost:3333/health`.

O MongoDB de desenvolvimento é exposto apenas em `127.0.0.1:37017`, evitando conflito com bancos de outros projetos. A imagem `mongo:7.0.28` está fixada porque o kernel usado neste ambiente é incompatível com as versões atuais do MongoDB 8.

## Organização

- `src/config`: leitura e validação das variáveis de ambiente.
- `src/plugins`: integrações do Fastify com CORS, MongoDB e Mercurius.
- `src/graphql/modules/<domínio>`: schema, resolver, service, model e validação de cada domínio.
- `src/services/auth`: autenticação da requisição e criação de JWT.
- `src/services/storage.ts` e `src/services/upload.ts`: armazenamento local e processamento de imagens.
- `src/routes/uploads.ts`: entrada multipart autenticada para arquivos binários.
- `src/docker/development`: infraestrutura local isolada.

O módulo `user` mantém os resolvers finos. Validação e regras de negócio ficam no service; persistência e índices ficam no model.

## Autenticação GraphQL

Operações disponíveis:

- `signUp(data: SignUpInput!)`: cria a conta e retorna `{ user, token }`.
- `signIn(data: SignInInput!)`: aceita username ou e-mail e retorna `{ user, token }`.
- `me`: resolve o usuário do token enviado em `Authorization: Bearer <token>`.
- `usernameAvailable` e `emailAvailable`: verificam disponibilidade.

As senhas são armazenadas somente como hash bcrypt. Username e e-mail são normalizados para minúsculas e possuem índices únicos no MongoDB.

## Edição de perfil e avatar

A edição dos dados e da senha acontece pela mutation GraphQL `updateProfile`. Para trocar a senha, são obrigatórias a senha atual, a nova senha e sua confirmação; o novo valor é persistido somente como hash bcrypt. O avatar segue um fluxo em duas etapas:

1. `POST /uploads/images?purpose=USER_AVATAR`, com o arquivo no campo multipart `file` e o JWT no header `Authorization`.
2. `updateProfile(data: { avatarImageID: "..." })` associa a mídia pronta ao usuário.

São aceitos JPG, PNG e WebP de até 5 MB. O conteúdo real é verificado com Sharp, a orientação é normalizada, a imagem é recortada para avatar de até 720×720 e o arquivo persistido é sempre WebP. Em desenvolvimento, os arquivos ficam em `.uploads`; uploads não associados expiram automaticamente após 24 horas.

## Verificação

```bash
npm run typecheck
```

Para encerrar o banco local:

```bash
npm run docker:dev:down
```
