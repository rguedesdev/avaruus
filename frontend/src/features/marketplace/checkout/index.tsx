"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiChevronRight,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiMapPin,
  FiPlus,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { MdOutlinePix } from "react-icons/md";
import { PiCreditCardBold } from "react-icons/pi";
import { initialCartItems } from "../cart/cart.data";
import { PurchaseSteps } from "../purchase-flow/PurchaseSteps";
import styles from "./checkout.module.css";
import { useAuth } from "@/features/auth/auth-context";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const shippingOptions = [
  { id: "standard", name: "Entrega padrão", detail: "Chega entre 9 e 12 de outubro", price: 0, badge: "Grátis" },
  { id: "express", name: "Entrega expressa", detail: "Chega até 7 de outubro", price: 24.9, badge: "Mais rápida" },
] as const;

const paymentOptions = [
  { id: "pix", name: "Pix", detail: "Aprovação imediata e 5% de desconto", icon: MdOutlinePix },
  { id: "card", name: "Cartão de crédito", detail: "Parcele em até 10x sem juros", icon: PiCreditCardBold },
  { id: "boleto", name: "Boleto bancário", detail: "Vencimento em 2 dias úteis", icon: FiFileText },
] as const;

export function Checkout() {
  const { user } = useAuth();
  const address = user?.defaultAddress;
  const [shippingId, setShippingId] = useState<(typeof shippingOptions)[number]["id"]>("standard");
  const [paymentId, setPaymentId] = useState<(typeof paymentOptions)[number]["id"]>("pix");

  const subtotal = initialCartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const shipping = shippingOptions.find((option) => option.id === shippingId) ?? shippingOptions[0];
  const hasPixDiscount = paymentId === "pix";
  const discount = hasPixDiscount ? subtotal * 0.05 : 0;
  const total = subtotal + shipping.price - discount;

  return (
    <main className={styles.page} style={{ minHeight: "100vh" }}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/cart">Carrinho</Link><FiChevronRight aria-hidden="true" /><span>Entrega e pagamento</span>
      </nav>

      <header className={styles.pageHeader}>
        <span className={styles.kicker}>Última etapa</span>
        <h1>Finalizar compra</h1>
        <PurchaseSteps current={2} />
      </header>

      <div className={styles.checkoutLayout}>
        <div className={styles.checkoutContent}>
          <section className={styles.sectionCard} aria-labelledby="address-title">
            <div className={styles.sectionHeading}><span><FiMapPin aria-hidden="true" /></span><div><small>1</small><h2 id="address-title">Endereço de entrega</h2></div></div>
            <div className={styles.addressCard}>
              <div>{address ? <><strong>{address.recipientName}</strong><span>{address.street}, {address.number}{address.complement ? ` • ${address.complement}` : ""}</span><span>{address.neighborhood} • {address.city} — {address.state}</span><span>{address.postalCode.replace(/(\d{5})(\d{3})/, "$1-$2")}</span></> : <><strong>Nenhum endereço selecionado</strong><span>Cadastre um endereço no seu perfil para calcular o frete.</span></>}</div>
              <button type="button"><FiEdit2 aria-hidden="true" />Alterar</button>
            </div>
            <button className={styles.addAddress} type="button"><FiPlus aria-hidden="true" />Adicionar outro endereço</button>
          </section>

          <section className={styles.sectionCard} aria-labelledby="shipping-title">
            <div className={styles.sectionHeading}><span><FiTruck aria-hidden="true" /></span><div><small>2</small><h2 id="shipping-title">Escolha o frete</h2></div></div>
            <div className={styles.optionList}>
              {shippingOptions.map((option) => (
                <label className={`${styles.optionCard} ${shippingId === option.id ? styles.selected : ""}`} key={option.id}>
                  <input type="radio" name="shipping" value={option.id} checked={shippingId === option.id} onChange={() => setShippingId(option.id)} />
                  <span className={styles.radio} />
                  <div><strong>{option.name}</strong><small>{option.detail}</small></div>
                  <p><b>{option.price ? currency.format(option.price) : "Grátis"}</b><span>{option.badge}</span></p>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard} aria-labelledby="payment-title">
            <div className={styles.sectionHeading}><span><FiCreditCard aria-hidden="true" /></span><div><small>3</small><h2 id="payment-title">Forma de pagamento</h2></div></div>
            <div className={styles.optionList}>
              {paymentOptions.map(({ id, name, detail, icon: Icon }) => (
                <label className={`${styles.optionCard} ${paymentId === id ? styles.selected : ""}`} key={id}>
                  <input type="radio" name="payment" value={id} checked={paymentId === id} onChange={() => setPaymentId(id)} />
                  <span className={styles.radio} />
                  <Icon className={`${styles.optionIcon} ${id === "pix" ? styles.pixIcon : ""} ${id === "card" ? styles.cardIcon : ""} ${id === "boleto" ? styles.boletoIcon : ""}`} aria-hidden="true" />
                  <div><strong>{name}</strong><small>{detail}</small></div>
                </label>
              ))}
            </div>
            {paymentId === "card" && (
              <div className={styles.cardPreview}><FiCreditCard aria-hidden="true" /><div><strong>Dados do cartão</strong><span>Os campos do cartão serão adicionados na integração de pagamentos.</span></div></div>
            )}
          </section>
        </div>

        <aside className={styles.summary} aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Resumo da compra</h2>
          <div className={styles.productList}>
            {initialCartItems.map((item) => (
              <div className={styles.product} key={item.id}>
                <div className={styles.productImage}><Image src={item.image} alt="" fill sizes="58px" className={styles[item.imageStyle]} /></div>
                <p><strong>{item.name}</strong><span>Qtd. {item.quantity}</span></p>
                <b>{currency.format(item.unitPrice * item.quantity)}</b>
              </div>
            ))}
          </div>
          <dl className={styles.totals}>
            <div><dt>Subtotal</dt><dd>{currency.format(subtotal)}</dd></div>
            <div><dt>Frete</dt><dd>{shipping.price ? currency.format(shipping.price) : "Grátis"}</dd></div>
            {hasPixDiscount && <div className={styles.discount}><dt>Desconto no Pix</dt><dd>- {currency.format(discount)}</dd></div>}
            <div className={styles.total}><dt>Total</dt><dd>{currency.format(total)}</dd></div>
          </dl>
          <Link className={styles.confirmButton} href={`/checkout/review?shipping=${shippingId}&payment=${paymentId}`}>Revisar pedido</Link>
          <p className={styles.terms}>Ao confirmar, você concorda com os termos de compra e com a política de privacidade da Avaruus.</p>
          <div className={styles.security}><FiShield aria-hidden="true" /><div><strong>Pagamento seguro</strong><span>Seus dados são protegidos durante toda a compra.</span></div></div>
        </aside>
      </div>
    </main>
  );
}
