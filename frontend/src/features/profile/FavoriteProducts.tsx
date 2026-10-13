"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdFavoriteBorder } from "react-icons/md";

import { useFavorites } from "@/features/favorites/favorites-context";
import { readAuthToken } from "@/features/auth/auth-storage";
import { books } from "@/features/marketplace/books/catalog";
import { products } from "@/features/marketplace/products/catalog";
import { graphQLRequest } from "@/shared/lib/graphql/client";
import styles from "./profile.module.css";

type SellerFavorite = { id: string; title: string; price: number; images: string[] };

function FavoriteProducts() {
  const { favoriteSlugs } = useFavorites();
  const [sellerFavorites, setSellerFavorites] = useState<SellerFavorite[]>([]);
  useEffect(() => {
    let active = true;
    const staticSlugs = new Set<string>([...products.map((item) => item.slug), ...books.map((item) => item.slug)]);
    const ids = [...favoriteSlugs].filter((slug) => !staticSlugs.has(slug) && /^[a-f\d]{24}$/i.test(slug));
    if (!ids.length) { setSellerFavorites([]); return () => { active = false; }; }
    const token = readAuthToken();
    if (!token) { setSellerFavorites([]); return () => { active = false; }; }
    void Promise.all(ids.map((id) => graphQLRequest<{ publicProductById: SellerFavorite | null }, { id: string }>(
      `query FavoriteProduct($id: ID!) { publicProductById(id: $id) { id title price images } }`, { id }, token,
    ).then((result) => result.publicProductById).catch(() => null))).then((rows) => {
      if (active) setSellerFavorites(rows.filter((row): row is SellerFavorite => Boolean(row)));
    });
    return () => { active = false; };
  }, [favoriteSlugs]);
  const items = [
    ...products.map((product) => ({ slug: product.slug, title: product.name, image: product.image, detail: product.price })),
    ...books.map((book) => ({ slug: book.slug, title: book.title, image: book.image, detail: `por ${book.author}` })),
    ...sellerFavorites.map((product) => ({ slug: product.id, title: product.title, image: product.images[0] ?? "/images/products/placeholder.webp", detail: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price), unoptimized: Boolean(product.images[0]) })),
  ].filter((item) => favoriteSlugs.has(item.slug));

  if (!items.length) return <section className={styles.emptySection}><span><MdFavoriteBorder /></span><h2>Seus favoritos</h2><p>Os produtos que você salvar aparecerão aqui para serem encontrados com facilidade.</p><Link href="/">Explorar produtos</Link></section>;

  return <section className={styles.favoritesSection}><div>{items.map((item) => <Link href={`/products/${item.slug}`} key={item.slug}><span><Image src={item.image} alt={item.title} fill sizes="110px" unoptimized={"unoptimized" in item && item.unoptimized} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div></Link>)}</div></section>;
}

export { FavoriteProducts };
