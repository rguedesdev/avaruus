import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatBookPublicationDate } from "@/features/seller/publication-date";
import { BookDetails } from "@/features/marketplace/book-detail";
import { books, getBookBySlug, type Book } from "@/features/marketplace/books/catalog";
import { ProductDetails } from "@/features/marketplace/product-detail";
import type { ProductCardItem } from "@/features/marketplace/product-card/ProductCard";
import {
  getProductBySlug,
  products,
  type Product,
} from "@/features/marketplace/products/catalog";

type PublicProductDetails = {
  id: string; title: string; category: string; price: number; images: string[];
  description: string; gtin: string; catalogAVSIN: string | null; videoUrl: string; variations: Array<{ title: string; options: string[] }>;
  bookDetails: string | null; international: boolean; shippingMethod: string; storeSlug: string; storeName: string;
};

async function getPublicProduct(id: string): Promise<PublicProductDetails | null> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query PublicProductById($id: ID!) { publicProductById(id: $id) { id title category price images description gtin catalogAVSIN videoUrl variations { title options } bookDetails international shippingMethod storeSlug storeName } }",
        variables: { id },
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.errors?.length ? null : payload.data?.publicProductById ?? null;
  } catch {
    return null;
  }
}

async function getPublicBookRecommendations(currentID: string): Promise<ProductCardItem[]> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query { publicProducts { id title category price image storeSlug } }" }),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const rows = payload.errors?.length ? [] : payload.data?.publicProducts ?? [];
    return rows.filter((item: { id: string; category: string }) => item.id !== currentID && item.category === "BOOK").slice(0, 4).map((item: { id: string; title: string; price: number; image: string }) => ({
      slug: item.id, name: item.title, category: "Livros",
      price: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price),
      installments: "Pagamento à vista", image: item.image, imageStyle: "book",
      badge: "Novo", rating: "Novo", soldLabel: "Novo anúncio", href: `/products/${item.id}`,
    }));
  } catch {
    return [];
  }
}

function toCatalogProduct(product: PublicProductDetails): Product {
  const category = ({ BOOK: "Livros", ELECTRONICS: "Tecnologia", HOME: "Casa & decoração", FASHION: "Moda", SPORTS: "Esporte", OTHER: "Outros" } as Record<string, string>)[product.category] ?? "Produtos";
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price);
  let bookDetails: Record<string, unknown> = {};
  try { bookDetails = product.bookDetails ? JSON.parse(product.bookDetails) : {}; } catch { /* Dados técnicos opcionais. */ }
  const specifications: Array<readonly [string, string]> = Object.entries(bookDetails)
    .filter(([key, value]) => key !== "collaborators" && typeof value === "string" && value.trim())
    .map(([key, value]) => [({ author: "Autor", publisher: "Editora", format: "Formato", isbn: "ISBN", language: "Idioma", pages: "Número de páginas", publicationDate: "Data de publicação", series: "Série / volume" } as Record<string, string>)[key] ?? key, key === "publicationDate" ? formatBookPublicationDate(String(value)) : String(value)] as const);
  if (product.catalogAVSIN) specifications.unshift(["Código do catálogo (AVSIN)", product.catalogAVSIN]);
  const variations = product.variations.map((variation, index) => ({
    id: `variation-${index}`,
    label: variation.title,
    options: variation.options.map((label, optionIndex) => ({ id: `option-${optionIndex}`, label, available: true })),
  }));
  return {
    slug: product.id, name: product.title, category, price, pixPrice: price, international: product.international,
    videoUrl: product.videoUrl,
    installments: "Pagamento à vista", image: product.images[0] ?? "/images/products/placeholder.webp",
    images: product.images, imageStyle: product.category === "BOOK" ? "catalog" : "lifestyle",
    badge: "Novo", conditionLabel: "Novo", soldLabel: "Novo anúncio", rating: "—", reviewCount: 0,
    sku: product.catalogAVSIN ?? product.gtin, seller: product.storeName, sellerRating: "—",
    fulfilledBy: product.shippingMethod === "MELHOR_ENVIO" ? "Melhor Envio" : product.storeName,
    description: product.description, highlights: [], specifications, variations,
  };
}

function toCatalogBook(product: PublicProductDetails): Book {
  let details: Record<string, unknown> = {};
  try { details = product.bookDetails ? JSON.parse(product.bookDetails) : {}; } catch { /* Dados técnicos opcionais. */ }
  const text = (key: string) => typeof details[key] === "string" ? String(details[key]).trim() : "";
  const formatID = (["paperback", "hardcover", "ebook", "audiobook"].includes(text("format")) ? text("format") : "paperback") as Book["formats"][number]["id"];
  const formatLabels = { paperback: "Capa comum", hardcover: "Capa dura", ebook: "E-book", audiobook: "Audiobook" };
  const legacyIsbn = text("isbn").replace(/[^\dXx]/g, "");
  const isbn10 = text("isbn10").replace(/[^\dXx]/g, "") || (legacyIsbn.length === 10 ? legacyIsbn : "");
  const isbn13 = text("isbn13").replace(/\D/g, "") || (legacyIsbn.length === 13 ? legacyIsbn : "");
  const dimensions = text("dimensionsWidth") && text("dimensionsHeight")
    ? `${text("dimensionsWidth")} × ${text("dimensionsHeight")} cm`
    : text("dimensions");
  const contributors = Array.isArray(details.collaborators) ? details.collaborators : [];
  const collaborators = contributors.filter((item): item is { name: string; role: string } => Boolean(item && typeof item.name === "string" && typeof item.role === "string"));
  const values: Record<string, string> = {
    "Nome da série": text("series") || "—",
    "Livro na coleção": text("seriesPosition") || "—",
    "Número de páginas": text("pages") ? `${text("pages")} páginas` : "—",
    Idioma: text("language") || "—",
    Editora: text("publisher") || "—",
    "Data da publicação": text("publicationDate") ? formatBookPublicationDate(text("publicationDate")) : "—",
    "Idade de leitura": text("readingAge") || "—",
    Dimensões: dimensions || "—",
    "ISBN-10": isbn10.length === 10 ? isbn10 : "—",
    "ISBN-13": isbn13.length === 13 ? isbn13 : "—",
    Acessibilidade: text("accessibility") || "—",
    "Tamanho do arquivo": text("fileSize") || "—",
    "Configuração de fonte": text("fontConfiguration") || "—",
    "Duração do título": text("duration") || "—",
    Narrador: text("narrator") || "—",
    Versão: text("version") || "—",
    "Tipo de programa": text("programType") || "—",
  };
  const technicalFields: Record<typeof formatID, string[]> = {
    paperback: ["Nome da série", "Livro na coleção", "Número de páginas", "Idioma", "Editora", "Data da publicação", "Idade de leitura", "Dimensões", "ISBN-10", "ISBN-13"],
    hardcover: ["Nome da série", "Livro na coleção", "Número de páginas", "Idioma", "Editora", "Data da publicação", "Idade de leitura", "Dimensões", "ISBN-10", "ISBN-13"],
    ebook: ["Idade de leitura", "Acessibilidade", "Tamanho do arquivo", "Nome da série", "Livro na coleção", "Número de páginas", "Idioma", "Editora", "Data da publicação", "Configuração de fonte", "ISBN-13"],
    audiobook: ["Nome da série", "Livro na coleção", "Duração do título", "Idioma", "Editora", "Data da publicação", "Narrador", "Tamanho do arquivo", "Versão", "Tipo de programa", "ISBN-13"],
  };
  const editionDetails: Array<readonly [string, string]> = technicalFields[formatID].map((label) => [label, values[label] ?? "—"] as const);
  if (product.catalogAVSIN) editionDetails.unshift(["Código do catálogo (AVSIN)", product.catalogAVSIN]);
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price);
  return {
    slug: product.id, title: product.title, author: text("author"), series: text("series") || "Livro",
    seriesPosition: text("seriesPosition"), category: "Livros", image: product.images[0] ?? "", images: product.images,
    rating: "—", reviewCount: 0, soldLabel: "Novo anúncio", description: product.description,
    publisher: text("publisher"), publicationDate: text("publicationDate"), language: text("language"),
    pages: text("pages"), translator: contributors.find((item: any) => item?.role === "Tradutor")?.name || "",
    collaborators,
    formats: [{
      id: formatID, label: formatLabels[formatID], detail: formatLabels[formatID], isbn: isbn13 || (formatID === "paperback" || formatID === "hardcover" ? isbn10 : ""),
      digital: formatID === "ebook" || formatID === "audiobook", editionDetails,
      offers: [{ id: "seller", seller: product.storeName, sellerRating: "—", fulfilledBy: product.shippingMethod === "MELHOR_ENVIO" ? "Melhor Envio" : product.storeName, price, installments: "Pagamento à vista", availability: "Consulte o prazo de entrega", international: product.international }],
    }],
  };
}

export function generateStaticParams() {
  return [...products, ...books].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const book = getBookBySlug(slug);
  const sellerProduct = product || book ? null : await getPublicProduct(slug);

  if (product) {
    return {
      title: `${product.name} | Avaruus`,
      description: product.description,
    };
  }

  if (book) {
    return {
      title: `${book.title}, de ${book.author} — Avaruus`,
      description: book.description,
    };
  }
  if (sellerProduct) return { title: `${sellerProduct.title} | Avaruus`, description: sellerProduct.description };

  return { title: "Produto não encontrado — Avaruus" };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const book = getBookBySlug(slug);
  const sellerProduct = product || book ? null : await getPublicProduct(slug);
  const relatedBooks = sellerProduct?.category === "BOOK" ? await getPublicBookRecommendations(sellerProduct.id) : [];

  if (product) return <ProductDetails key={product.slug} product={product} />;
  if (book) return <BookDetails book={book} />;
  if (sellerProduct) return sellerProduct.category === "BOOK"
    ? <BookDetails key={sellerProduct.id} book={toCatalogBook(sellerProduct)} relatedItems={relatedBooks} />
    : <ProductDetails key={sellerProduct.id} product={toCatalogProduct(sellerProduct)} />;

  notFound();
}
