"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlay, FiStar, FiX } from "react-icons/fi";
import styles from "./product-reviews.module.css";

type ProductReviewsProps = {
  itemName: string;
  rating: number | string;
  reviewCount: number;
  image: string;
  additionalImage?: string;
  itemType: "product" | "book";
};

export function ProductReviews({ itemName, rating, reviewCount, image, additionalImage, itemType }: ProductReviewsProps) {
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const isBook = itemType === "book";
  const reviewImages = [image, additionalImage ?? image];

  useEffect(() => {
    if (expandedImageIndex === null && !videoOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setExpandedImageIndex(null); setVideoOpen(false); }
      if (expandedImageIndex !== null && event.key === "ArrowLeft") setExpandedImageIndex((index) => index === null ? null : (index - 1 + reviewImages.length) % reviewImages.length);
      if (expandedImageIndex !== null && event.key === "ArrowRight") setExpandedImageIndex((index) => index === null ? null : (index + 1) % reviewImages.length);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expandedImageIndex, reviewImages.length, videoOpen]);

  if (reviewCount === 0) {
    return (
      <section className={styles.reviews} id="avaliacoes" tabIndex={-1} aria-labelledby="reviews-title">
        <div className={`${styles.card} ${styles.emptyCard}`}>
          <div className={styles.heading}>
            <span>{isBook ? "Opinião dos leitores" : "Opinião de quem comprou"}</span>
            <h2 id="reviews-title">Avaliações de {itemName}</h2>
          </div>
          <p className={styles.emptyState}>Este anúncio ainda não recebeu avaliações.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.reviews} id="avaliacoes" tabIndex={-1} aria-labelledby="reviews-title">
      <div className={styles.card}>
        <div className={styles.heading}>
          <span>{isBook ? "Opinião dos leitores" : "Opinião de quem comprou"}</span>
          <h2 id="reviews-title">Avaliações de {itemName}</h2>
        </div>
        <div className={styles.score}>
          <strong>{rating}</strong>
          <span className={styles.stars} aria-label={`${rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <FiStar key={index} aria-hidden="true" />)}</span>
          <small>Baseado em {reviewCount.toLocaleString("pt-BR")} avaliações</small>
        </div>
        <div className={styles.distribution} aria-label="Distribuição das avaliações">
          {[5, 4, 3, 2, 1].map((value) => <div key={value}><span>{value}</span><FiStar aria-hidden="true" /><div><i style={{ width: value === 5 ? "86%" : value === 4 ? "12%" : "2%" }} /></div></div>)}
        </div>
        <article className={styles.review}>
          <header className={styles.reviewer}>
            <span className={styles.avatar} aria-hidden="true">{isBook ? "CM" : "MS"}</span>
            <div><strong>{isBook ? "Camila M." : "Mariana S."}</strong><time dateTime={isBook ? "2026-09-22" : "2026-09-18"}>{isBook ? "22 de setembro de 2026" : "18 de setembro de 2026"}</time></div>
            <span className={styles.verified}>Compra verificada</span>
          </header>
          <span className={styles.stars} aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <FiStar key={index} aria-hidden="true" />)}</span>
          {isBook ? <h3>Impossível parar de ler</h3> : null}
          <p>{isBook ? "A história prende desde o começo, e a edição é muito bonita. A entrega para a biblioteca digital foi imediata." : "Produto muito bem acabado e entrega rápida. A descrição corresponde ao que recebi."}</p>
          <div className={styles.media} aria-label="Fotos e vídeos anexados à avaliação">
            <span>Fotos e vídeos</span>
            <div className={styles.mediaItems}>
              <button className={styles.mediaImage} type="button" aria-label={`Ampliar foto da avaliação de ${itemName}`} onClick={() => setExpandedImageIndex(0)}><Image src={image} alt={`Mídia da avaliação de ${itemName}`} fill sizes="76px" unoptimized={image.startsWith("http")} /><small>Foto</small></button>
              <button className={styles.videoPlaceholder} type="button" aria-label="Assistir vídeo da avaliação" onClick={() => setVideoOpen(true)}><Image src="/videos/culinaria-poster.jpg" alt="" fill sizes="76px" /><FiPlay aria-hidden="true" /><small>Vídeo</small></button>
            </div>
          </div>
        </article>
        <article className={styles.review}>
          <header className={styles.reviewer}>
            <span className={styles.avatar} aria-hidden="true">RP</span>
            <div><strong>Rafael P.</strong><time dateTime="2026-09-25">25 de setembro de 2026</time></div>
            <span className={styles.verified}>Compra verificada</span>
          </header>
          <span className={styles.stars} aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <FiStar key={index} aria-hidden="true" />)}</span>
          <p>Chegou bem embalado e corresponde às fotos do anúncio. Gostei bastante da qualidade.</p>
          <div className={styles.media} aria-label="Fotos e vídeos anexados à avaliação">
            <span>Fotos e vídeos</span>
            <div className={styles.mediaItems}>
              <button className={styles.mediaImage} type="button" aria-label={`Ampliar foto da avaliação de Rafael P. sobre ${itemName}`} onClick={() => setExpandedImageIndex(1)}><Image src={reviewImages[1]} alt={`Foto enviada por Rafael P. na avaliação de ${itemName}`} fill sizes="76px" unoptimized={reviewImages[1].startsWith("http")} /><small>Foto</small></button>
            </div>
          </div>
        </article>
      </div>
      {expandedImageIndex !== null ? (
        <div className={styles.lightbox} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedImageIndex(null); }}>
          <section className={styles.lightboxDialog} role="dialog" aria-modal="true" aria-label={`Foto da avaliação de ${itemName}`}>
            <header className={styles.lightboxHeader}><span>{expandedImageIndex + 1} de {reviewImages.length} · Fotos das avaliações</span><button className={styles.closeLightbox} type="button" aria-label="Fechar imagem ampliada" onClick={() => setExpandedImageIndex(null)} autoFocus><FiX aria-hidden="true" /></button></header>
            <div className={styles.lightboxStage}>
              <button className={styles.navigateLightbox} type="button" aria-label="Foto anterior" onClick={() => setExpandedImageIndex((expandedImageIndex - 1 + reviewImages.length) % reviewImages.length)}><FiChevronLeft aria-hidden="true" /></button>
              <div className={styles.lightboxImage} key={expandedImageIndex}><Image src={reviewImages[expandedImageIndex]} alt={`Foto ${expandedImageIndex + 1} das avaliações de ${itemName}`} fill sizes="85vw" unoptimized={reviewImages[expandedImageIndex].startsWith("http")} /></div>
              <button className={styles.navigateLightbox} type="button" aria-label="Próxima foto" onClick={() => setExpandedImageIndex((expandedImageIndex + 1) % reviewImages.length)}><FiChevronRight aria-hidden="true" /></button>
            </div>
          </section>
        </div>
      ) : null}
      {videoOpen ? (
        <div className={styles.lightbox} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}>
          <section className={styles.videoDialog} role="dialog" aria-modal="true" aria-label={`Vídeo da avaliação de ${itemName}`}>
            <header className={styles.lightboxHeader}><span>Vídeo da avaliação</span><button className={styles.closeLightbox} type="button" aria-label="Fechar vídeo" onClick={() => setVideoOpen(false)} autoFocus><FiX aria-hidden="true" /></button></header>
            <video className={styles.expandedVideo} src="/videos/culinaria.mp4" controls autoPlay playsInline />
          </section>
        </div>
      ) : null}
    </section>
  );
}
