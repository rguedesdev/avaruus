import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import styles from "./product-card.module.css";

export type ProductCardItem = {
  slug: string;
  name: string;
  category: string;
  price: string;
  installments: string;
  image: string;
  imageStyle: "catalog" | "lifestyle" | "book";
  badge: string;
  rating: string;
  soldLabel: string;
  discount?: string;
  href?: string;
};

function formatSoldLabel(label: string) {
  const match = label.match(/^\+([\d.,]+)\s*(mil)?/i);
  if (!match) return label;

  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return label;
  const count = value * (match[2] ? 1000 : 1);
  if (count < 1000) return `+${Math.floor(count)} vendidos`;
  return `+${Math.round(count / 1000)}mil vendidos`;
}

function getOriginalPrice(price: string, discount?: string) {
  if (!discount) return null;
  const currentValue = Number(price.replace(/[^\d,]/g, "").replace(",", "."));
  const percent = Number(discount.replace(/[^\d,]/g, "").replace(",", "."));
  if (!Number.isFinite(currentValue) || !Number.isFinite(percent) || percent <= 0 || percent >= 100) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(currentValue / (1 - percent / 100));
}

export function ProductCard({ item }: { item: ProductCardItem }) {
  return (
    <article className={styles.productCard}>
      <Link className={styles.productCardLink} href={item.href ?? `/products/${item.slug}`} aria-label={`Ver ${item.name}`}>
        <div className={styles.productVisual}>
          <Image
            className={`${styles.productImage} ${styles[item.imageStyle]}`}
            src={item.image}
            alt={item.name}
            fill
            unoptimized={item.image.startsWith("http")}
            sizes="(max-width: 720px) calc(100vw - 24px), (max-width: 1050px) 50vw, 25vw"
          />
        </div>
        <div className={styles.productInfo}>
          <h3>{item.name}</h3>
          <span className={styles.productSocialProof}>
            <span><FaStar aria-hidden="true" /> {item.rating}</span>
            <i aria-hidden="true" />
            <span>{formatSoldLabel(item.soldLabel)}</span>
          </span>
          <div className={styles.priceRow}>
            {item.discount ? <del>{getOriginalPrice(item.price, item.discount)}</del> : null}
            <span className={styles.currentPriceRow}>
              <strong>{item.price}</strong>
              {item.discount ? <span className={styles.discountLabel}><span>{item.discount} OFF</span></span> : null}
            </span>
          </div>
          <small>{item.installments}</small>
        </div>
      </Link>
      <FavoriteButton className={styles.favoriteButton} slug={item.slug} label={item.name} />
    </article>
  );
}
