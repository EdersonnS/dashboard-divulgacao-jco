# Dashboard Divulgação

Painel para agendar a divulgação de matérias jornalísticas: dispara um webhook (n8n) no horário marcado e gera automaticamente os textos prontos para copiar/colar nas 5 redes que ainda exigem trabalho manual (Gettr, YouTube Comunidade 1 e 2, Twitter/X, Facebook).

## Stack

- **Next.js 16** (App Router, TypeScript, `output: standalone`)
- **PostgreSQL** via **Drizzle ORM** (`drizzle-orm` + `pg`, sem query engine binário)
- **Redis + BullMQ** para a fila durável de agendamento
- **Autenticação**: `jose` (JWT) + `bcryptjs` (hash de senha) — bibliotecas 100% JavaScript, sem binário nativo compilado
- **Docker + docker-compose**

## Estrutura de pastas

```
drizzle/
  schema/        Definições das tabelas (Drizzle)
  migrations/     SQL de migration gerado pelo drizzle-kit
scripts/
  migrate.mjs     Aplica as migrations (roda no boot do container)
  seed.mjs        Cria o usuário e os 5 templates padrão (idempotente)
src/
  app/            Rotas (App Router) — telas + API routes
  components/     Componentes React por área (materias, historico, layout, notifications)
  lib/            Regras de negócio: auth, db, queue (BullMQ), templates, webhook, status, time
  instrumentation.ts   Inicia o worker da fila + reconciliação no boot do servidor
  proxy.ts        Middleware de autenticação (Next.js 16 renomeou middleware.ts → proxy.ts)
```

## Rodando localmente

Pré-requisitos: Docker + Docker Compose.

1. Copie o arquivo de variáveis de ambiente e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

   Preencha principalmente:
   - `AUTH_SECRET`: uma string longa e aleatória (usada para assinar o JWT de sessão)
   - `SEED_USERNAME` / `SEED_PASSWORD`: credenciais do login único da equipe (criado automaticamente no primeiro boot)
   - `N8N_WEBHOOK_URL`: endpoint do seu workflow n8n
   - `PUBLIC_BASE_URL`: URL pública onde a aplicação vai responder (usada para montar o link da imagem de capa que é enviado no webhook — em produção, precisa ser a URL real HTTPS, pois é o n8n quem busca a imagem nela)

2. Suba tudo:

   ```bash
   docker compose up --build
   ```

   Isso sobe 3 serviços (`app`, `postgres`, `redis`). No boot do container `app`, as migrations e o seed rodam automaticamente antes do servidor iniciar — não é preciso nenhum passo manual.

3. Acesse [http://localhost:3000](http://localhost:3000) e entre com o `SEED_USERNAME`/`SEED_PASSWORD` definidos no `.env`.

### Rodando sem Docker (iteração rápida durante desenvolvimento)

```bash
npm install
# Suba um Postgres e um Redis à parte (ex: docker run ...) e aponte
# DATABASE_URL / REDIS_URL no .env para eles
npm run db:migrate
npm run db:seed
npm run dev
```

### Scripts úteis

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`next build`) |
| `npm run db:generate` | Gera uma nova migration a partir do schema (`drizzle-kit generate`) |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:seed` | Cria o usuário e os templates padrão (idempotente) |

## Como funciona a durabilidade da fila

Cada matéria agendada vira um job do BullMQ (`jobId = materia-<id>`) com o delay calculado até o horário marcado. O Redis roda com persistência AOF (`--appendonly yes` + volume nomeado), então os jobs sobrevivem a um restart da VPS. Além disso, no boot do servidor (`src/instrumentation.ts`) roda uma varredura que reconfere todas as matérias ainda pendentes contra o Redis e re-enfileira qualquer uma que não tenha um job correspondente — uma segurança extra além do AOF. Matérias com horário já vencido recebem `delay = 0` e disparam quase imediatamente.

## Deploy no EasyPanel

1. Suba o repositório no GitHub (a primeira verificação local com `docker compose up --build` deve estar passando limpo antes disso).
2. No EasyPanel, crie um novo serviço do tipo **App** apontando para o repositório/branch do GitHub — o EasyPanel detecta o `Dockerfile` automaticamente.
3. Configure as variáveis de ambiente do serviço `app` (as mesmas do `.env.example`):
   - `DATABASE_URL` apontando para o serviço Postgres do EasyPanel
   - `REDIS_URL` apontando para o serviço Redis do EasyPanel
   - `AUTH_SECRET`, `SEED_USERNAME`, `SEED_PASSWORD`
   - `N8N_WEBHOOK_URL`
   - `PUBLIC_BASE_URL`: o domínio público HTTPS que o EasyPanel atribuir ao serviço — **obrigatório** estar correto, pois é a URL que o n8n usa para buscar a imagem de capa da matéria
4. Crie os serviços de **Postgres** e **Redis** no EasyPanel (com volumes persistentes) e ligue as URLs de conexão nas variáveis acima.
5. Faça o deploy. As migrations e o seed rodam automaticamente no start do container, igual ao ambiente local.

## Observações importantes

- **Sem bibliotecas com binário nativo compilado** nas dependências de autenticação/criptografia (`bcryptjs` em vez de `bcrypt`, `jose` em vez de libs que dependem de binários) — foi o que quebrou o build Docker de uma tentativa anterior deste projeto.
- **Imagem de capa**: armazenada como bytes direto no Postgres (coluna `bytea`), servida via `/api/images/[id]` — sem serviço de storage externo.
- **Login único da equipe**: por enquanto existe uma tabela `users` que suporta múltiplas contas, mas só uma é criada pelo seed. Se no futuro quiserem contas individuais, basta rodar o seed com outro `SEED_USERNAME` ou inserir diretamente na tabela.
