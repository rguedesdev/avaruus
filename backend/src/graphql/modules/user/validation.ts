import { z } from "zod";

import { isValidCPF, normalizeCPF } from "./cpf.js";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O username precisa ter pelo menos 3 caracteres.")
  .max(30, "O username deve ter no máximo 30 caracteres.")
  .regex(
    /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/,
    "Use letras minúsculas, números, ponto ou sublinhado, sem pontuação nas extremidades.",
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .email("Informe um e-mail válido.")
  .max(254, "O e-mail deve ter no máximo 254 caracteres.");

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    username: usernameSchema,
    email: emailSchema,
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(120),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

const signInSchema = z.object({
  login: z.string().trim().min(1, "Informe seu username ou e-mail."),
  password: z.string().min(1, "Informe sua senha."),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120).optional(),
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    avatarImageID: z.string().regex(/^[a-f\d]{24}$/i, "Imagem inválida.").optional(),
    removeAvatar: z.boolean().optional(),
    currentPassword: z.string().max(120).optional(),
    newPassword: z.string().max(120).optional(),
    confirmNewPassword: z.string().max(120).optional(),
    cpf: z.string().transform(normalizeCPF).refine(isValidCPF, "Informe um CPF válido.").optional(),
  })
  .superRefine((data, context) => {
    if (!Object.keys(data).length) {
      context.addIssue({ code: "custom", message: "Nenhuma alteração foi informada." });
    }
    if (data.avatarImageID && data.removeAvatar) {
      context.addIssue({
        code: "custom",
        path: ["avatarImageID"],
        message: "Não envie uma imagem e a remoção do avatar ao mesmo tempo.",
      });
    }
    const changingPassword =
      data.currentPassword !== undefined ||
      data.newPassword !== undefined ||
      data.confirmNewPassword !== undefined;
    if (changingPassword) {
      if (!data.currentPassword) {
        context.addIssue({ code: "custom", path: ["currentPassword"], message: "Informe sua senha atual." });
      }
      if (!data.newPassword || data.newPassword.length < 8) {
        context.addIssue({ code: "custom", path: ["newPassword"], message: "A nova senha precisa ter pelo menos 8 caracteres." });
      }
      if (!data.confirmNewPassword) {
        context.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "Confirme a nova senha." });
      } else if (data.newPassword !== data.confirmNewPassword) {
        context.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "As novas senhas não coincidem." });
      }
      if (data.currentPassword && data.newPassword === data.currentPassword) {
        context.addIssue({ code: "custom", path: ["newPassword"], message: "A nova senha deve ser diferente da atual." });
      }
    }
  });

export { emailSchema, signInSchema, signUpSchema, updateProfileSchema, usernameSchema };
