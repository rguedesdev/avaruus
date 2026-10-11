import type { Metadata } from "next";
import { OrderReview } from "@/features/marketplace/order-review";

export const metadata: Metadata = {
  title: "Revisar e confirmar — Avaruus",
  description: "Revise sua entrega e confirme o pagamento do pedido.",
};

export default async function ReviewPage({ searchParams }: PageProps<"/checkout/review">) {
  const query = await searchParams;
  const shipping = query.shipping === "express" ? "express" : "standard";
  const payment = query.payment === "card" || query.payment === "boleto" ? query.payment : "pix";

  return <OrderReview shippingId={shipping} paymentId={payment} />;
}
