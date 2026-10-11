import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

type TokenUser = {
  _id: { toString(): string } | string;
  username: string;
  accountType: "CUSTOMER" | "SELLER" | "ADMIN";
};

function createAccessToken(user: TokenUser) {
  return jwt.sign(
    { username: user.username, accountType: user.accountType },
    env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions["expiresIn"]>,
    },
  );
}

export { createAccessToken };
