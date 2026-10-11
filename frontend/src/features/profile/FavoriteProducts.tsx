"use client";

import Image from "next/image";
import Link from "next/link";
import { MdFavoriteBorder } from "react-icons/md";

import { useFavorites } from "@/features/favorites/favorites-context";
import { books } from "@/features/marketplace/books/catalog";
import { products } from "@/features/marketplace/products/catalog";
import styles from "./profile.module.css";

function FavoriteProducts() {
  const { favoriteSlugs } = useFavorites();
  const items = [
    ...products.map((product) => ({ slug: product.slug, title: product.name, image: product.image, detail: product.price })),
    ...books.map((book) => ({ slug: book.slug, title: book.title, image: book.image, detail: `por ${book.author}` })),
  ].filter((item) => favoriteSlugs.has(item.slug));

  if (!items.length) return <section className={styles.emptySection}><span><MdFavoriteBorder /></span><h2>Seus favoritos</h2><p>Os produtos que você salvar aparecerão aqui para serem encontrados com facilidade.</p><Link href="/">Explorar produtos</Link></section>;

  return <section className={styles.favoritesSection}><div>{items.map((item) => <Link href={`/products/${item.slug}`} key={item.slug}><span><Image src={item.image} alt={item.title} fill sizes="110px" /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div></Link>)}</div></section>;
}

export { FavoriteProducts };
