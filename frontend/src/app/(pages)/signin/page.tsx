import type { Metadata } from "next";
import { SignIn } from "@/features/auth";

export const metadata: Metadata = {
  title: "Entrar | Avaruus",
  description: "Acesse sua conta na Avaruus.",
};

export default function SignInPage() {
  return <SignIn />;
}
