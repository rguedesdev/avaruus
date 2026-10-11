import type { Metadata } from "next";
import { SignUp } from "@/features/auth";

export const metadata: Metadata = {
  title: "Criar conta | Avaruus",
  description: "Crie sua conta para comprar e vender na Avaruus.",
};

export default function SignUpPage() {
  return <SignUp />;
}
