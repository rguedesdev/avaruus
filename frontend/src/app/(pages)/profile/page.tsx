import type { Metadata } from "next";
import { Suspense } from "react";

import { Profile } from "@/features/profile";

export const metadata: Metadata = {
  title: "Minha conta | Avaruus",
  description: "Acompanhe sua conta, compras e preferências na Avaruus.",
};

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
