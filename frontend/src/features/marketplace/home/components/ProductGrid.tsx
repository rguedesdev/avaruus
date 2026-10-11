import Link from "next/link";
import { books } from "../../books/catalog";
import { ProductCard } from "../../product-card/ProductCard";
import { products } from "../home.data";
import styles from "../marketplace-home.module.css";

type PublicProduct = { id: string; title: string; category: string; price: number; image: string; storeSlug: string };

async function getPublicProducts(): Promise<PublicProduct[]> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query { publicProducts { id title category price image storeSlug } }" }),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.errors?.length ? [] : payload.data?.publicProducts ?? [];
  } catch {
    return [];
  }
}

export async function ProductGrid() {
  const publicProducts = await getPublicProducts();
  const productCards = products.map((product) => ({
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
    }));
  const bookCards = books.map((book) => {
      const offer = book.formats[0].offers[0];
      return {
        slug: book.slug,
        name: book.title,
        category: "Livros",
        price: offer.price,
        installments: offer.installments,
        image: book.image,
        imageStyle: "book" as const,
        badge: "Novo",
        rating: book.rating,
        soldLabel: book.soldLabel,
        discount: book.discount,
      };
    });
  const cards: Array<(typeof productCards)[number] | (typeof bookCards)[number]> = [];
  for (let index = 0; index < Math.max(productCards.length, bookCards.length); index += 1) {
    if (productCards[index]) cards.push(productCards[index]);
    if (bookCards[index]) cards.push(bookCards[index]);
  }
  const sellerCards = publicProducts.map((product) => ({
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
    <section className={`${styles.section} ${styles.productsSection}`} id="destaques" aria-labelledby="products-title">
      <div className={styles.sectionHeading}>
        <div><h2 id="products-title">Produtos em destaque</h2></div>
        <Link className={styles.textLink} href="/books">Ver todos os livros <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.productGrid}>
        {[...sellerCards, ...cards].map((card) => (
          <ProductCard key={card.slug} item={card} />
        ))}
      </div>
    </section>
  );
}
