import type { FastifyInstance } from "fastify";
import Mercurius from "mercurius";

import { env } from "../config/env.js";
import { resolvers, schema } from "../graphql/index.js";
import { authenticateRequest } from "../services/auth/authenticate.js";

async function registerMercurius(app: FastifyInstance) {
  await app.register(Mercurius, {
    schema,
    resolvers,
    path: "/graphql",
    graphiql: env.NODE_ENV !== "production",
    context: async (request, reply) => ({
      request,
      reply,
      authUser: authenticateRequest(request),
    }),
  });
}

export { registerMercurius };
