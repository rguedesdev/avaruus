import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiStar } from "react-icons/fi";
import { books } from "@/features/marketplace/books/catalog";
import styles from "./books.module.css";

export default function BooksPage() {
  return (
    <main className={styles.page} style={{ minHeight: "100vh" }}>
      <header className={styles.header}>
        <span>Livros na Avaruus</span>
        <h1>Encontre sua próxima história</h1>
        <p>Escolha a obra e depois compare formatos, vendedores e formas de entrega.</p>
      </header>
      <section className={styles.grid} aria-label="Catálogo de livros">
        {books.map((book) => (
          <Link className={styles.card} href={`/products/${book.slug}`} key={book.slug}>
            <div className={styles.cover}><Image src={book.image} alt={`Capa de ${book.title}`} width={684} height={1000} /></div>
            <div className={styles.cardBody}>
              <small>{book.category}</small>
              <h2>{book.title}</h2>
              <p>{book.author}</p>
              <span><FiStar aria-hidden="true" /> {book.rating} • {book.reviewCount.toLocaleString("pt-BR")} avaliações</span>
              <strong>A partir de {book.formats[0].offers[0].price}</strong>
              <b>Ver formatos <FiArrowRight aria-hidden="true" /></b>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
