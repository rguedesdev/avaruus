import type { FastifyInstance } from "fastify";

import MediaService from "../graphql/modules/media/service.js";

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

function registerMediaCleanupScheduler(app: FastifyInstance) {
  const runCleanup = () => {
    void MediaService.cleanupUnattached()
      .then((result) => {
        if (result.scanned) app.log.info(result, "Uploads não associados foram limpos");
      })
      .catch((error) => app.log.error({ error }, "Falha na limpeza de uploads"));
  };

  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  timer.unref();
  app.addHook("onClose", async () => clearInterval(timer));
}

export { registerMediaCleanupScheduler };
