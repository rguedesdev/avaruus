import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O username precisa ter pelo menos 3 caracteres.")
  .max(30, "O username deve ter no máximo 30 caracteres.")
  .regex(
    /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/,
    "Use letras minúsculas, números, ponto ou sublinhado.",
  );

const signInFormSchema = z.object({
  login: z.string().trim().min(1, "Informe seu username ou e-mail."),
  password: z.string().min(1, "Informe sua senha."),
  remember: z.boolean(),
});

const signUpFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    username: usernameSchema,
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(120),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    terms: z.boolean().refine(Boolean, "Aceite os termos para continuar."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type SignInFormData = z.infer<typeof signInFormSchema>;
type SignUpFormData = z.infer<typeof signUpFormSchema>;

export { signInFormSchema, signUpFormSchema, usernameSchema };
export type { SignInFormData, SignUpFormData };
