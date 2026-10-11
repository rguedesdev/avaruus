import styles from "./store.module.css";
import { books } from "@/features/marketplace/books/catalog";
import { ProductCard } from "@/features/marketplace/product-card/ProductCard";
import { products } from "@/features/marketplace/products/catalog";

type PublicProduct = { id: string; title: string; category: string; price: number; image: string; storeSlug: string };

export function StoreCatalog({ products: sellerProducts, showDemoCatalog = false }: { products: PublicProduct[]; showDemoCatalog?: boolean }) {
  const sellerCards = sellerProducts.map((product) => ({
    slug: product.id,
    name: product.title,
    category: ({ BOOK: "Livros", ELECTRONICS: "Tecnologia", HOME: "Casa & decoração", FASHION: "Moda", SPORTS: "Esporte", OTHER: "Outros" } as Record<string, string>)[product.category] ?? "Produtos",
    price: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price),
    installments: "Pagamento à vista",
    image: product.image,
    imageStyle: product.category === "BOOK" ? "book" as const : "catalog" as const,
    badge: "Novo",
    rating: "Novo",
    soldLabel: "Novo anúncio",
    href: `/products/${product.id}`,
  }));
  return (
    <section className={styles.catalog} aria-labelledby="store-catalog-title">
      <div className={styles.emptyState}>
        <h2 id="store-catalog-title">Produtos da loja</h2>
        <div className={styles.catalogGrid}>
          {sellerCards.map((item) => <ProductCard key={item.slug} item={item} />)}
          {showDemoCatalog ? products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.slug}
              item={{
                slug: product.slug,
                name: product.name,
                category: product.category,
                price: product.price,
                installments: product.installments,
                image: product.image,
                imageStyle: product.imageStyle,
                badge: product.badge,
                rating: product.rating,
                soldLabel: product.soldLabel,
                discount: product.discount,
              }}
            />
          )) : null}
          {showDemoCatalog ? books.slice(0, 2).map((book) => (
            <ProductCard
              key={book.slug}
              item={{
                slug: book.slug,
                name: book.title,
                category: "Livros",
                price: book.formats[0].offers[0].price,
                installments: book.formats[0].offers[0].installments,
                image: book.image,
                imageStyle: "book",
                badge: "Novo",
                rating: book.rating,
                soldLabel: book.soldLabel,
                discount: book.discount,
              }}
            />
          )) : null}
          {!sellerCards.length && !showDemoCatalog ? <p>Esta loja ainda não publicou produtos.</p> : null}
        </div>
      </div>
    </section>
  );
}
