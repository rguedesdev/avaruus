"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiCheck,
  FiFileText,
  FiMapPin,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { MdOutlinePix } from "react-icons/md";
import { PiCreditCardBold } from "react-icons/pi";
import { initialCartItems } from "../cart/cart.data";
import { PurchaseSteps } from "../purchase-flow/PurchaseSteps";
import styles from "./order-review.module.css";
import { useAuth } from "@/features/auth/auth-context";

type OrderReviewProps = {
  shippingId: "standard" | "express";
  paymentId: "pix" | "card" | "boleto";
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const shippingDetails = {
  standard: { name: "Entrega padrão", date: "Chega entre 9 e 12 de outubro", price: 0 },
  express: { name: "Entrega expressa", date: "Chega até 7 de outubro", price: 24.9 },
};

const paymentDetails = {
  pix: { name: "Pix", detail: "5% de desconto • aprovação imediata", icon: MdOutlinePix },
  card: { name: "Cartão de crédito", detail: "Pagamento em até 10x sem juros", icon: PiCreditCardBold },
  boleto: { name: "Boleto bancário", detail: "Vencimento em 2 dias úteis", icon: FiFileText },
};

export function OrderReview({ shippingId, paymentId }: OrderReviewProps) {
  const { user } = useAuth();
  const address = user?.defaultAddress;
  const [confirmed, setConfirmed] = useState(false);
  const shipping = shippingDetails[shippingId];
  const payment = paymentDetails[paymentId];
  const PaymentIcon = payment.icon;
  const subtotal = initialCartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discount = paymentId === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping.price - discount;

  if (confirmed) {
    return (
      <main className={styles.successPage}>
        <PurchaseSteps current={3} />
        <section className={styles.successCard}>
          <span className={styles.successIcon}><FiCheck aria-hidden="true" /></span>
          <span className={styles.kicker}>Pedido confirmado</span>
          <h1>Obrigado pela sua compra!</h1>
          <p>Seu pedido <strong>#AVA-10482</strong> foi criado e o pagamento foi registrado com sucesso.</p>
          <div><FiTruck aria-hidden="true" /><span><strong>{shipping.date}</strong>Você receberá atualizações sobre a entrega.</span></div>
          <Link href="/">Voltar para a página inicial</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <span>Entrega e pagamento</span><span>/</span><strong>Revisão</strong>
      </nav>
      <header className={styles.pageHeader}>
        <span className={styles.kicker}>Confira antes de concluir</span>
        <h1>Revise e confirme seu pedido</h1>
        <PurchaseSteps current={3} />
      </header>

      <div className={styles.reviewLayout}>
        <div className={styles.reviewContent}>
          <section className={styles.card} aria-labelledby="products-title">
            <div className={styles.cardHeading}><div><small>1</small><h2 id="products-title">Produtos</h2></div></div>
            <div className={styles.products}>
              {initialCartItems.map((item) => (
                <article className={styles.product} key={item.id}>
                  <div className={styles.productImage}><Image src={item.image} alt={item.name} fill sizes="82px" className={styles[item.imageStyle]} /></div>
                  <div><Link href={`/products/${item.slug}`}><h3>{item.name}</h3></Link><span>{item.variation}</span><small>Vendido por {item.seller}</small><small>Quantidade: {item.quantity}</small></div>
                  <strong>{currency.format(item.unitPrice * item.quantity)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.card} aria-labelledby="delivery-title">
            <div className={styles.cardHeading}><div><small>2</small><h2 id="delivery-title">Entrega</h2></div></div>
            <div className={styles.infoGrid}>
              <div><FiMapPin aria-hidden="true" /><p><small>Enviar para</small>{address ? <><strong>{address.recipientName}</strong><span>{address.street}, {address.number}{address.complement ? ` • ${address.complement}` : ""}</span><span>{address.city} — {address.state} • {address.postalCode.replace(/(\d{5})(\d{3})/, "$1-$2")}</span></> : <><strong>Endereço não informado</strong><span>Cadastre um endereço antes de concluir o pedido.</span></>}</p></div>
              <div><FiTruck aria-hidden="true" /><p><small>Forma de envio</small><strong>{shipping.name}</strong><span>{shipping.date}</span><span>{shipping.price ? currency.format(shipping.price) : "Frete grátis"}</span></p></div>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="payment-review-title">
            <div className={styles.cardHeading}><div><small>3</small><h2 id="payment-review-title">Pagamento</h2></div></div>
            <div className={styles.paymentInfo}><PaymentIcon aria-hidden="true" /><p><small>Forma selecionada</small><strong>{payment.name}</strong><span>{payment.detail}</span></p></div>
          </section>
        </div>

        <aside className={styles.summary} aria-labelledby="final-summary-title">
          <h2 id="final-summary-title">Resumo final</h2>
          <dl>
            <div><dt>Produtos</dt><dd>{currency.format(subtotal)}</dd></div>
            <div><dt>Frete</dt><dd>{shipping.price ? currency.format(shipping.price) : "Grátis"}</dd></div>
            {discount > 0 && <div className={styles.discount}><dt>Desconto no Pix</dt><dd>- {currency.format(discount)}</dd></div>}
            <div className={styles.total}><dt>Total</dt><dd>{currency.format(total)}</dd></div>
          </dl>
          <button type="button" onClick={() => setConfirmed(true)}>Confirmar pagamento</button>
          <p>Ao confirmar, você concorda com os termos de compra e a política de privacidade.</p>
          <div className={styles.security}><FiShield aria-hidden="true" /><span><strong>Ambiente seguro</strong>Seus dados estão protegidos.</span></div>
        </aside>
      </div>
    </main>
  );
}
