import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";

import { env } from "../config/env.js";

async function registerMongoose(app: FastifyInstance) {
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB });
  app.log.info({ database: env.MONGODB_DB }, "MongoDB conectado");

  app.addHook("onClose", async () => {
    await mongoose.disconnect();
  });
}

export { registerMongoose };
