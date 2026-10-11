"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from "react-icons/fi";
import styles from "./product-gallery.module.css";

export type GalleryImage = {
  src: string;
  alt: string;
};

type ProductImageGalleryProps = {
  images: readonly GalleryImage[];
  featuredImage?: GalleryImage;
  variant: "catalog" | "lifestyle" | "book";
  sticky?: boolean;
  leftAligned?: boolean;
  className?: string;
  footer?: ReactNode;
};

export function ProductImageGallery({
  images,
  featuredImage,
  variant,
  sticky = false,
  leftAligned = false,
  className = "",
  footer,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFeaturedImage, setShowFeaturedImage] = useState(Boolean(featuredImage));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = (showFeaturedImage && featuredImage ? featuredImage : images[activeIndex]) ?? images[0];

  useEffect(() => {
    setShowFeaturedImage(Boolean(featuredImage));
  }, [featuredImage?.src]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (images.length < 2) return;
      if (event.key === "ArrowLeft") {
        setShowFeaturedImage(false);
        setActiveIndex((index) => (index - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        setShowFeaturedImage(false);
        setActiveIndex((index) => (index + 1) % images.length);
      }
    }

    document.addEventListener("keydown", handleKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, [images.length, lightboxOpen]);

  if (!activeImage) return null;

  function previousImage() {
    setShowFeaturedImage(false);
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  }

  function nextImage() {
    setShowFeaturedImage(false);
    setActiveIndex((index) => (index + 1) % images.length);
  }

  return (
    <div className={`${styles.gallery} ${sticky ? styles.sticky : ""} ${leftAligned ? styles.leftAligned : ""} ${className}`}>
      <div className={styles.thumbnails} aria-label="Imagens do produto">
        {images.map((image, index) => (
          <button
            className={!showFeaturedImage && index === activeIndex ? styles.activeThumbnail : undefined}
            key={`${image.src}-${index}`}
            type="button"
            aria-label={`Visualizar imagem ${index + 1}`}
            aria-pressed={!showFeaturedImage && index === activeIndex}
            onClick={() => {
              setActiveIndex(index);
              setShowFeaturedImage(false);
            }}
          >
            <Image src={image.src} alt="" fill sizes="76px" className={styles[variant]} unoptimized={image.src.startsWith("http")} />
          </button>
        ))}
      </div>

      <button
        className={styles.mainImage}
        type="button"
        aria-label={`Ampliar imagem: ${activeImage.alt}`}
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 50vw"
          className={styles[variant]}
          unoptimized={activeImage.src.startsWith("http")}
        />
        <span className={styles.expandHint}><FiMaximize2 aria-hidden="true" /> Ampliar</span>
      </button>

      {footer ? <div className={styles.footer}>{footer}</div> : null}

      {lightboxOpen && typeof document !== "undefined" ? createPortal(
        <div
          className={styles.lightboxBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <section
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`Galeria de imagens de ${activeImage.alt}`}
          >
            <header className={styles.lightboxHeader}>
              <span>{images.length > 1 ? `${activeIndex + 1} de ${images.length}` : "Imagem do produto"}</span>
              <button type="button" aria-label="Fechar galeria" onClick={() => setLightboxOpen(false)} autoFocus>
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className={styles.lightboxStage}>
              {images.length > 1 ? (
                <button className={styles.previousButton} type="button" aria-label="Imagem anterior" onClick={previousImage}>
                  <FiChevronLeft aria-hidden="true" />
                </button>
              ) : null}
              <div className={styles.lightboxImage} key={activeImage.src}>
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  sizes="95vw"
                  className={styles.lightboxAsset}
                  unoptimized={activeImage.src.startsWith("http")}
                />
              </div>
              {images.length > 1 ? (
                <button className={styles.nextButton} type="button" aria-label="Próxima imagem" onClick={nextImage}>
                  <FiChevronRight aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className={styles.lightboxThumbnails} aria-label="Selecionar imagem">
                {images.map((image, index) => (
                  <button
                    className={index === activeIndex ? styles.activeLightboxThumbnail : undefined}
                    key={`${image.src}-lightbox-${index}`}
                    type="button"
                    aria-label={`Abrir imagem ${index + 1}`}
                    onClick={() => {
                      setActiveIndex(index);
                      setShowFeaturedImage(false);
                    }}
                  >
                    <Image src={image.src} alt="" fill sizes="62px" className={styles.lightboxAsset} unoptimized={image.src.startsWith("http")} />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
