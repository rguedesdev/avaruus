import { z } from "zod";

const addressFormSchema = z.object({
  label: z.string().trim().min(1, "Informe uma identificação.").max(40),
  recipientName: z.string().trim().min(2, "Informe o destinatário.").max(120),
  postalCode: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length === 8, "Informe um CEP válido."),
  street: z.string().trim().min(2, "Informe a rua.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(80),
  neighborhood: z.string().trim().min(2, "Informe o bairro.").max(100),
  city: z.string().trim().min(2, "Informe a cidade.").max(100),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Informe a UF."),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

export { addressFormSchema };
export type { AddressFormData };
