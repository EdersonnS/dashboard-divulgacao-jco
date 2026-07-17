import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  // O tracing automático do output "standalone" às vezes não detecta
  // corretamente pacotes usados só em rotas de servidor/proxy — força a
  // inclusão dos que ficaram de fora (confirmado inspecionando .next/standalone).
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/bcryptjs/**/*",
      "./node_modules/jose/**/*",
      "./node_modules/drizzle-orm/**/*",
      "./node_modules/zod/**/*",
      "./node_modules/date-fns-tz/**/*",
    ],
  },
};

export default nextConfig;
