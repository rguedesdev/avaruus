import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().trim().min(1).default("0.0.0.0"),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  API_PUBLIC_URL: z.url().default("http://localhost:3333"),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI não definida."),
  MONGODB_DB: z.string().trim().min(1).default("avaruus"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres."),
  DATA_ENCRYPTION_KEY: z.string().min(32, "DATA_ENCRYPTION_KEY deve ter pelo menos 32 caracteres."),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("7d"),
  STORAGE_LOCAL_DIR: z.string().trim().min(1).default(".uploads"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuração inválida do ambiente: ${details}`);
}

const env = parsedEnvironment.data;

export { env };
