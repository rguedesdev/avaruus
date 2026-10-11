import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreVerificationBadge } from "./StoreVerificationBadge";
import { StoreSocialBar } from "./StoreSocialBar";
import { StoreCatalog } from "./StoreCatalog";
import styles from "./store.module.css";

type PublicStore = {
  slug: string;
  storeName: string;
  photoUrl: string;
  description: string;
  vacationMode: boolean;
};
type PublicProduct = { id: string; title: string; category: string; price: number; image: string; storeSlug: string };

async function getStore(slug: string): Promise<PublicStore | null> {
  const endpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "query PublicStoreBySlug($slug: String!) { publicStoreBySlug(slug: $slug) { slug storeName photoUrl description vacationMode } }",
      variables: { slug },
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    data?: { publicStoreBySlug?: PublicStore | null };
    errors?: unknown[];
  };
  if (payload.errors?.length) return null;
  return payload.data?.publicStoreBySlug ?? null;
}

async function getStoreProducts(slug: string): Promise<PublicProduct[]> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query PublicStoreProducts($slug: String!) { publicStoreProducts(slug: $slug) { id title category price image storeSlug } }", variables: { slug } }),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.errors?.length ? [] : payload.data?.publicStoreProducts ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return { title: "Loja não encontrada — Avaruus" };
  return {
    title: `${store.storeName} | Avaruus`,
    description:
      store.description || `Conheça a loja ${store.storeName} na Avaruus.`,
  };
}

export default async function StorePage({
  params,
}: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();
  const products = await getStoreProducts(store.slug);
  const isOtakuyaSample = store.slug === "otakuya-san";

  return (
    <main className={styles.page}>
      <header className={styles.storeHeader}>
        <span
          className={styles.avatar}
          style={
            store.photoUrl
              ? { backgroundImage: `url("${store.photoUrl}")` }
              : undefined
          }
          aria-hidden="true"
        />
        <div className={styles.storeIdentity}>
          <h1>
            <span>{store.storeName}</span>
            {store.slug === "otakuya-san" ? <StoreVerificationBadge variant="black" /> : null}
          </h1>
          {store.description ? <p>{store.description}</p> : null}
          <StoreSocialBar
            followerCount={isOtakuyaSample ? 1284 : 0}
            productCount={isOtakuyaSample ? 36 : products.length}
            rating={isOtakuyaSample ? 4.9 : null}
            reviewCount={isOtakuyaSample ? 823 : 0}
          />
        </div>
      </header>
      {store.vacationMode ? (
        <p className={styles.vacationNotice}>
          Esta loja está temporariamente em modo férias.
        </p>
      ) : null}
      <StoreCatalog products={products} showDemoCatalog={isOtakuyaSample} />
    </main>
  );
}
