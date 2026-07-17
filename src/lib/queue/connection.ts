import IORedis from "ioredis";

declare global {
  var __ddRedisConnection: IORedis | undefined;
}

function createConnection(): IORedis {
  // Sem fallback aqui, o `next build` quebra: a etapa de "collect page data"
  // importa todas as rotas (mesmo sem executá-las), e REDIS_URL só existe de
  // fato em runtime (via docker-compose). `lazyConnect` evita qualquer
  // tentativa de conexão nesse momento de build.
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  // BullMQ exige maxRetriesPerRequest: null na conexão.
  return new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: true });
}

export const redisConnection =
  globalThis.__ddRedisConnection ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ddRedisConnection = redisConnection;
}
