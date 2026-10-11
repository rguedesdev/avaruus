import { books } from "../books/catalog";
import { ProductCard, type ProductCardItem } from "../product-card/ProductCard";
import { products } from "../products/catalog";
import styles from "./related-products.module.css";

type RelatedProductsProps = {
  currentSlug: string;
  category: string;
  itemType: "product" | "book";
  items?: ProductCardItem[];
  emptyMessage?: string;
};

export function RelatedProducts({ currentSlug, category, itemType, items, emptyMessage }: RelatedProductsProps) {
  const entries = [
    ...products.map((product): ProductCardItem & { itemType: "product" } => ({
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: product.price,
      installments: product.installments,
      image: product.image,
      imageStyle: product.imageStyle,
      itemType: "product" as const,
      badge: product.badge,
      rating: product.rating,
      soldLabel: product.soldLabel,
      discount: product.discount,
    })),
    ...books.map((book): ProductCardItem & { itemType: "book" } => {
      const offer = book.formats[0].offers[0];
      return {
        slug: book.slug,
        name: book.title,
        category: book.category,
        price: offer.price,
        installments: offer.installments,
        image: book.image,
        imageStyle: "book",
        itemType: "book" as const,
        badge: "Novo",
        rating: book.rating,
        soldLabel: book.soldLabel,
        discount: book.discount,
      };
    }),
  ];

  const recommendations = items
    ? items.filter((item) => item.slug !== currentSlug)
    : entries
    .filter((entry) => entry.slug !== currentSlug)
    .sort((a, b) => {
      const score = (entry: typeof a) => (entry.category === category ? 0 : entry.itemType === itemType ? 1 : 2);
      return score(a) - score(b);
    })
    .slice(0, 4);

  if (!recommendations.length && !emptyMessage) return null;

  return (
    <section className={styles.section} aria-labelledby="related-products-title">
      <header className={styles.heading}>
        <h2 id="related-products-title">Você também pode gostar</h2>
      </header>
      {recommendations.length ? <div className={styles.grid}>
        {recommendations.map((item) => (
          <ProductCard key={item.slug} item={item} />
        ))}
      </div> : <p>{emptyMessage}</p>}
    </section>
  );
}
