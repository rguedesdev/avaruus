import { books } from "../books/catalog";
import { ProductCard, type ProductCardItem } from "../product-card/ProductCard";
import styles from "./related-products.module.css";

export function PublisherProducts({ currentSlug, publisher }: { currentSlug: string; publisher: string }) {
  const items = books
    .filter((book) => book.publisher === publisher && book.slug !== currentSlug)
    .map((book): ProductCardItem => {
      const offer = book.formats[0].offers[0];
      return {
        slug: book.slug,
        name: book.title,
        category: book.category,
        price: offer.price,
        installments: offer.installments,
        image: book.image,
        imageStyle: "book",
        badge: "Novo",
        rating: book.rating,
        soldLabel: book.soldLabel,
        discount: book.discount,
      };
    });

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby={`publisher-products-${currentSlug}`}>
      <header className={styles.heading}>
        <h2 id={`publisher-products-${currentSlug}`}>Produtos da editora {publisher}</h2>
      </header>
      <div className={styles.grid}>
        {items.map((item) => <ProductCard key={item.slug} item={item} />)}
      </div>
    </section>
  );
}
