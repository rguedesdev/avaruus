"use client";

import { useAuth } from "@/features/auth/auth-context";

function DefaultShippingDestination() {
  const { user } = useAuth();
  const address = user?.defaultAddress;
  if (!address) return <>Cadastre um endereço para calcular o frete</>;
  const postalCode = address.postalCode.replace(/(\d{5})(\d{3})/, "$1-$2");
  return <>Frete calculado automaticamente para {postalCode}</>;
}

export { DefaultShippingDestination };
