"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiChevronRight,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShield,
  FiTag,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { initialCartItems } from "./cart.data";
import { PurchaseSteps } from "../purchase-flow/PurchaseSteps";
import styles from "./cart.module.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ShoppingCart() {
  const [items, setItems] = useState(initialCartItems);

  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [items]);
  const pixTotal = subtotal * 0.95;

  function updateQuantity(id: string, quantity: number) {
    setItems((current) => current.map((item) => item.id === id
      ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
      : item));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/">Home</Link><FiChevronRight aria-hidden="true" /><span>Carrinho</span>
      </nav>

      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div><span className={styles.kicker}>Sua seleção</span><h1>Carrinho de compras</h1></div>
          <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
        </div>
        <PurchaseSteps current={1} />
      </header>

      {items.length ? (
        <div className={styles.cartLayout}>
          <section className={styles.itemsPanel} aria-label="Produtos no carrinho">
            <div className={styles.shippingNotice}><FiTruck aria-hidden="true" /><span><strong>Frete grátis</strong> nos produtos enviados pela Avaruus</span></div>

            {items.map((item) => (
              <article className={styles.cartItem} key={item.id}>
                <Link className={styles.itemImage} href={`/products/${item.slug}`} aria-label={`Ver ${item.name}`}>
                  <Image className={styles[item.imageStyle]} src={item.image} alt={item.name} fill sizes="(max-width: 600px) 104px, 144px" />
                </Link>

                <div className={styles.itemContent}>
                  <div className={styles.itemTop}>
                    <div>
                      <span>Vendido por {item.seller}</span>
                      <Link href={`/products/${item.slug}`}><h2>{item.name}</h2></Link>
                      <p>{item.variation}</p>
                      <small>Enviado por <strong>{item.fulfilledBy}</strong></small>
                    </div>
                    <strong className={styles.itemPrice}>{currency.format(item.unitPrice)}</strong>
                  </div>

                  <div className={styles.itemBottom}>
                    <div className={styles.quantity} aria-label={`Quantidade de ${item.name}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity === 1} aria-label="Diminuir quantidade"><FiMinus aria-hidden="true" /></button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity === item.maxQuantity} aria-label="Aumentar quantidade"><FiPlus aria-hidden="true" /></button>
                    </div>
                    <button className={styles.textAction} type="button"><FiHeart aria-hidden="true" />Salvar para depois</button>
                    <button className={styles.textAction} type="button" onClick={() => removeItem(item.id)}><FiTrash2 aria-hidden="true" />Remover</button>
                    <strong className={styles.itemTotal}>{currency.format(item.unitPrice * item.quantity)}</strong>
                  </div>
                </div>
              </article>
            ))}

            <Link className={styles.continueLink} href="/"><FiArrowLeft aria-hidden="true" />Continuar comprando</Link>
          </section>

          <aside className={styles.summary} aria-labelledby="summary-title">
            <h2 id="summary-title">Resumo do pedido</h2>
            <dl className={styles.totals}>
              <div><dt>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</dt><dd>{currency.format(subtotal)}</dd></div>
              <div><dt>Frete</dt><dd className={styles.freeShipping}>Grátis</dd></div>
              <div className={styles.total}><dt>Total</dt><dd>{currency.format(subtotal)}</dd></div>
            </dl>
            <p className={styles.pix}><strong>{currency.format(pixTotal)}</strong> no Pix com 5% de desconto</p>
            <Link className={styles.checkoutButton} href="/checkout">Continuar</Link>

            <div className={styles.couponBox}>
              <FiTag aria-hidden="true" /><div><strong>Possui um cupom?</strong><button type="button">Adicionar cupom</button></div>
            </div>
            <div className={styles.safePurchase}><FiShield aria-hidden="true" /><p><strong>Compra segura</strong><span>Seus dados e pagamentos estão protegidos.</span></p></div>
          </aside>
        </div>
      ) : (
        <section className={styles.emptyCart}>
          <div><FiTruck aria-hidden="true" /></div>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore a Avaruus e encontre produtos para adicionar por aqui.</p>
          <Link href="/">Explorar produtos</Link>
        </section>
      )}
    </main>
  );
}
