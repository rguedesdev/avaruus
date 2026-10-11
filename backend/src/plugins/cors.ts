import Cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";

async function registerCors(app: FastifyInstance) {
  await app.register(Cors, {
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });
}

export { registerCors };
