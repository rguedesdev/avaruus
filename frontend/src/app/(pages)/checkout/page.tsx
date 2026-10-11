import type { Metadata } from "next";
import { Checkout } from "@/features/marketplace/checkout";

export const metadata: Metadata = {
  title: "Finalizar compra | Avaruus",
  description: "Confirme a entrega e escolha como pagar sua compra.",
};

export default function CheckoutPage() {
  return <Checkout />;
}
