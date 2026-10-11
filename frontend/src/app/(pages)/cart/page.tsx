import type { Metadata } from "next";
import { ShoppingCart } from "@/features/marketplace/cart";

export const metadata: Metadata = {
  title: "Carrinho de compras | Avaruus",
  description: "Revise seus produtos e finalize sua compra na Avaruus.",
};

export default function CartPage() {
  return <ShoppingCart />;
}
