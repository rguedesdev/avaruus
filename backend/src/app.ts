import Fastify from "fastify";

import { registerCors } from "./plugins/cors.js";
import { registerMercurius } from "./plugins/mercurius.js";
import { registerMongoose } from "./plugins/mongoose.js";
import { registerUploadRoutes } from "./routes/uploads.js";
import { registerMediaCleanupScheduler } from "./services/media-cleanup-scheduler.js";

async function buildApp() {
  const app = Fastify({ logger: true });

  await registerCors(app);
  await registerMongoose(app);
  await registerUploadRoutes(app);
  await registerMercurius(app);
  registerMediaCleanupScheduler(app);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}

export default buildApp;
