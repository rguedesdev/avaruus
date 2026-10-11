import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

type AuthenticatedUser = {
  id: string;
  username: string;
  accountType: "CUSTOMER" | "SELLER" | "ADMIN";
};

function authenticateRequest(request: FastifyRequest): AuthenticatedUser | null {
  const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload !== "object" || !payload.sub || !payload.username || !payload.accountType) {
      return null;
    }

    return {
      id: String(payload.sub),
      username: String(payload.username),
      accountType: payload.accountType as AuthenticatedUser["accountType"],
    };
  } catch {
    return null;
  }
}

export { authenticateRequest };
export type { AuthenticatedUser };
