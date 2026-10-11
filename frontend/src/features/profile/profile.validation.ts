import { z } from "zod";

import { usernameSchema } from "@/features/auth/auth.validation";

function isValidCPF(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let total = 0;
    for (let index = 0; index < length; index += 1) total += Number(cpf[index]) * (length + 1 - index);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    username: usernameSchema,
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
    currentPassword: z.string().max(120),
    newPassword: z.string().max(120),
    confirmNewPassword: z.string().max(120),
    cpf: z.string().refine((value) => !value || isValidCPF(value), "Informe um CPF válido."),
  })
  .superRefine((data, context) => {
    const changingPassword = Boolean(
      data.currentPassword || data.newPassword || data.confirmNewPassword,
    );
    if (!changingPassword) return;
    if (!data.currentPassword) {
      context.addIssue({ code: "custom", path: ["currentPassword"], message: "Informe sua senha atual." });
    }
    if (data.newPassword.length < 8) {
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
  });

type ProfileFormData = z.infer<typeof profileFormSchema>;

export { profileFormSchema };
export type { ProfileFormData };
