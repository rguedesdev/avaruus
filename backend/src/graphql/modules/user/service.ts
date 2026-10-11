import bcrypt from "bcrypt";
import { ZodError, type ZodType } from "zod";

import { createAccessToken } from "../../../services/auth/create-access-token.js";
import { encryptSensitiveValue, hashSensitiveValue } from "../../../services/crypto.js";
import { graphQLError } from "../../errors.js";
import MediaService, { mediaUrl } from "../media/service.js";
import { maskCPF } from "./cpf.js";
import { UserModel } from "./model.js";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
  usernameSchema,
} from "./validation.js";

const serializeUser = (user: any) => {
  const avatarImageID = user.avatarImageID?.toString();
  return {
    id: user._id?.toString() ?? user.id?.toString(),
    accountType: user.accountType,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: avatarImageID ? mediaUrl(avatarImageID) : user.avatarUrl ?? null,
    cpfMasked: maskCPF(user.cpfLastFour),
    createdAt: new Date(user.createdAt).toISOString(),
  };
};

function parseInput<T>(schema: ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw graphQLError(error.issues[0]?.message ?? "Dados inválidos.", "BAD_USER_INPUT");
    }
    throw error;
  }
}

class UserService {
  static async usernameAvailable(username: string) {
    const normalized = usernameSchema.safeParse(username);
    if (!normalized.success) return false;
    return !(await UserModel.exists({ username: normalized.data }));
  }

  static async emailAvailable(email: string) {
    const normalized = emailSchema.safeParse(email);
    if (!normalized.success) return false;
    return !(await UserModel.exists({ email: normalized.data }));
  }

  static async signUp(data: unknown) {
    const input = parseInput(signUpSchema, data);
    const duplicate = await UserModel.findOne({
      $or: [{ username: input.username }, { email: input.email }],
    }).lean();

    if (duplicate?.username === input.username) {
      throw graphQLError("Este username já está em uso.", "CONFLICT");
    }
    if (duplicate?.email === input.email) {
      throw graphQLError("Este e-mail já está em uso.", "CONFLICT");
    }

    try {
      const user = await UserModel.create({
        name: input.name,
        username: input.username,
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
      });

      return {
        user: serializeUser(user.toObject()),
        token: createAccessToken(user),
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        const field = error?.keyPattern?.email ? "e-mail" : "username";
        throw graphQLError(`Este ${field} já está em uso.`, "CONFLICT");
      }
      throw error;
    }
  }

  static async signIn(data: unknown) {
    const input = parseInput(signInSchema, data);
    const login = input.login.toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ username: login }, { email: login }],
    })
      .select("+passwordHash")
      .lean();

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw graphQLError("Username, e-mail ou senha inválidos.", "UNAUTHENTICATED");
    }

    return { user: serializeUser(user), token: createAccessToken(user) };
  }

  static async me(userID: string | undefined) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    const user = await UserModel.findById(userID).lean();
    if (!user) throw graphQLError("Usuário não encontrado.", "NOT_FOUND");
    return serializeUser(user);
  }

  static async updateProfile(userID: string | undefined, data: unknown) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    const input = parseInput(updateProfileSchema, data);
    const current = await UserModel.findById(userID).select("+passwordHash +cpfHash").lean();
    if (!current) throw graphQLError("Usuário não encontrado.", "NOT_FOUND");

    const duplicateFilters: Array<{ username: string } | { email: string }> = [];
    if (input.username) duplicateFilters.push({ username: input.username });
    if (input.email) duplicateFilters.push({ email: input.email });
    if (duplicateFilters.length) {
      const duplicate = await UserModel.findOne({
        _id: { $ne: userID },
        $or: duplicateFilters,
      }).lean();
      if (duplicate?.username === input.username) {
        throw graphQLError("Este username já está em uso.", "CONFLICT");
      }
      if (duplicate?.email === input.email) {
        throw graphQLError("Este e-mail já está em uso.", "CONFLICT");
      }
    }
    if (input.cpf) {
      const cpfHash = hashSensitiveValue(input.cpf);
      const duplicateCPF = await UserModel.exists({ _id: { $ne: userID }, cpfHash });
      if (duplicateCPF) throw graphQLError("Este CPF já está vinculado a outra conta.", "CONFLICT");
    }

    if (input.avatarImageID) {
      await MediaService.requireAttachableAvatar(input.avatarImageID, userID);
    }
    if (
      input.newPassword &&
      !(await bcrypt.compare(input.currentPassword!, current.passwordHash))
    ) {
      throw graphQLError("A senha atual está incorreta.", "UNAUTHENTICATED");
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.username !== undefined) updates.username = input.username;
    if (input.email !== undefined) updates.email = input.email;
    if (input.newPassword) updates.passwordHash = await bcrypt.hash(input.newPassword, 12);
    if (input.cpf) {
      updates.cpfEncrypted = encryptSensitiveValue(input.cpf);
      updates.cpfHash = hashSensitiveValue(input.cpf);
      updates.cpfLastFour = input.cpf.slice(-4);
    }
    if (input.avatarImageID !== undefined) updates.avatarImageID = input.avatarImageID;
    if (input.removeAvatar) updates.avatarImageID = null;

    let updated;
    try {
      updated = await UserModel.findByIdAndUpdate(userID, { $set: updates }, {
        new: true,
        runValidators: true,
      }).lean();
    } catch (error: any) {
      if (error?.code === 11000) {
        const field = error?.keyPattern?.email ? "e-mail" : "username";
        throw graphQLError(`Este ${field} já está em uso.`, "CONFLICT");
      }
      throw error;
    }
    if (!updated) throw graphQLError("Usuário não encontrado.", "NOT_FOUND");

    const previousAvatarID = current.avatarImageID?.toString();
    if (input.avatarImageID) {
      try {
        await MediaService.attachAvatar(input.avatarImageID, userID);
      } catch (error) {
        await UserModel.updateOne(
          { _id: userID, avatarImageID: input.avatarImageID },
          { $set: { avatarImageID: current.avatarImageID ?? null } },
        );
        throw error;
      }
    }

    if (previousAvatarID && (input.avatarImageID || input.removeAvatar)) {
      try {
        await MediaService.deleteAttachedAvatar(previousAvatarID, userID);
      } catch (error) {
        console.error("Falha ao remover o avatar anterior", previousAvatarID, error);
      }
    }

    return serializeUser(updated);
  }
}

export { serializeUser };
export default UserService;
