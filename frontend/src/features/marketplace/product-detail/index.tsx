"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiPackage,
  FiShield,
  FiStar,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { RiStore3Line } from "react-icons/ri";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { DefaultShippingDestination } from "@/features/shipping/DefaultShippingDestination";
import { ProductImageGallery } from "../product-gallery";
import { ProductReviews } from "../reviews/ProductReviews";
import { RelatedProducts } from "../recommendations/RelatedProducts";
import { ProductInfoCard, ProductListingLayout, ProductTechnicalCard, SelectedOfferCard } from "../product-listing-layout";
import { products, type Product } from "../products/catalog";
import styles from "./product-detail.module.css";

type ProductDetailsProps = { product: Product };

export function ProductDetails({ product }: ProductDetailsProps) {
  const pageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const [detailsLayout, setDetailsLayout] = useState<{ marginTop: number; marginBottom: number; width: number } | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState(
    () => product.sellerOptions?.find((option) => option.selected)?.id ?? product.sellerOptions?.[0]?.id,
  );
  const [selectedVariationIds, setSelectedVariationIds] = useState<Record<string, string>>(
    {},
  );
  const colorVariation = product.variations?.find((variation) => variation.id === "color");
  const selectedColor = colorVariation?.options.find((option) => option.id === selectedVariationIds[colorVariation.id]);
  const galleryImageSources = product.images ?? [product.image];
  const selectedSeller = product.sellerOptions?.find((option) => option.id === selectedSellerId);
  const price = selectedSeller?.price ?? product.price;
  const pixPrice = selectedSeller?.pixPrice ?? product.pixPrice;
  const installments = selectedSeller?.installments ?? product.installments;
  const seller = selectedSeller?.seller ?? product.seller;
  const sellerRating = selectedSeller?.sellerRating ?? product.sellerRating;
  const fulfilledBy = selectedSeller?.fulfilledBy ?? product.fulfilledBy;
  const availability = selectedSeller?.availability ?? "Chega entre 9 e 12 de outubro";
  const isInternational = selectedSeller?.international ?? product.international ?? false;

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    const gallery = galleryRef.current;
    const summary = summaryRef.current;
    const purchasePanel = purchaseRef.current;
    const details = detailsRef.current;
    if (!page || !hero || !gallery || !summary || !purchasePanel || !details || !product.specifications.length) return;

    const updateDetailsLayout = () => {
      const pageRect = page.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();
      const summaryRect = summary.getBoundingClientRect();
      const purchaseRect = purchasePanel.getBoundingClientRect();
      const gap = 24;
      const stacked = window.matchMedia("(max-width: 1000px)").matches;
      const start = (stacked
        ? Math.max(galleryRect.bottom, summaryRect.bottom, purchaseRect.bottom)
        : Math.max(galleryRect.bottom, summaryRect.bottom)) + gap;
      const purchaseContinuesBesideIt = !stacked && purchaseRect.bottom > start;
      const rightEdge = purchaseContinuesBesideIt ? purchaseRect.left - gap : pageRect.right;
      const detailsHeight = details.offsetHeight;
      const marginTop = start - heroRect.bottom;
      const marginBottom = Math.max(0, heroRect.bottom - (start + detailsHeight));

      setDetailsLayout({ marginTop, marginBottom, width: Math.max(0, rightEdge - pageRect.left) });
    };

    updateDetailsLayout();
    const observer = new ResizeObserver(updateDetailsLayout);
    observer.observe(page);
    observer.observe(hero);
    observer.observe(gallery);
    observer.observe(summary);
    observer.observe(purchasePanel);
    observer.observe(details);
    window.addEventListener("resize", updateDetailsLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDetailsLayout);
    };
  }, [product.slug, product.specifications.length]);

  return (
    <ProductListingLayout
      category={product.category}
      categoryHref="/books"
      title={product.name}
      titleId="product-title"
      pageRef={pageRef}
      heroRef={heroRef}
      gallery={(
        <div className={styles.galleryStage} ref={galleryRef}>
        <ProductImageGallery
          images={galleryImageSources.map((src, index) => ({
            src,
            alt: index === 0 ? product.name : `${product.name} — imagem ${index + 1}`,
          }))}
          featuredImage={selectedColor?.image ? {
            src: selectedColor.image,
            alt: `${product.name} — ${selectedColor.label}`,
          } : undefined}
          variant={product.imageStyle}
        />
        </div>
      )}
      summary={(
        <div className={styles.productSummary} ref={summaryRef}>
          <div className={styles.productMeta}>
            <span>{product.conditionLabel}</span><i aria-hidden="true" />
            <span>{product.soldLabel}</span>
            <FavoriteButton className={styles.topFavoriteButton} slug={product.slug} label={product.name} />
          </div>
          <h1 id="product-title">{product.name}</h1>
          <div className={styles.ratingRow}>
            <strong>{product.rating}</strong>
            <span className={styles.stars} aria-label={`${product.rating} de 5 estrelas`}>
              {Array.from({ length: 5 }, (_, index) => <FiStar key={index} aria-hidden="true" />)}
            </span>
            <a href="#avaliacoes">{product.reviewCount} avaliações</a>
          </div>

          <ProductInfoCard eyebrow="Conheça o produto" title="Descrição e detalhes">
            <p>{product.description}</p>
            {product.highlights.length ? (
              <ul className={styles.highlights}>
                {product.highlights.map((highlight) => <li key={highlight}><FiCheck aria-hidden="true" />{highlight}</li>)}
              </ul>
            ) : null}
          </ProductInfoCard>

          {product.variations?.length ? (
            <div className={styles.variations}>
              {product.variations.map((variation) => {
                const selectedOptionId = selectedVariationIds[variation.id];
                const selectedOption = variation.options.find((option) => option.id === selectedOptionId);

                return (
                  <fieldset className={styles.variationGroup} key={variation.id}>
                    <legend>{variation.label}: <strong>{selectedOption?.label ?? "Selecione uma opção"}</strong></legend>
                    <div className={styles.variationOptions}>
                      {variation.options.map((option) => {
                        const isSelected = option.id === selectedOptionId;

                        return (
                          <button
                            className={isSelected ? styles.selectedVariation : undefined}
                            disabled={!option.available}
                            key={option.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedVariationIds((current) => ({ ...current, [variation.id]: option.id }))}
                          >
                            {option.label}
                            {!option.available && <span>Indisponível</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
      purchase={(
        <div className={styles.purchasePanel} ref={purchaseRef}>
          <SelectedOfferCard
            title="Oferta selecionada"
            className={styles.priceCard}
            international={isInternational}
          >
            <strong>{price}</strong>
            <p>{installments}</p>
            <p className={styles.pixPrice}><b>{pixPrice}</b> no Pix com 5% de desconto</p>

          <div className={styles.offerInfo} aria-label="Informações do vendedor e da entrega">
            <div>
              <span className={styles.offerIcon}><RiStore3Line aria-hidden="true" /></span>
              <p><small>Vendido por</small><strong>{seller}</strong><span><FiStar aria-hidden="true" /> {sellerRating} de reputação</span></p>
            </div>
            <div>
              <span className={styles.offerIcon}><FiTruck aria-hidden="true" /></span>
              <p><small>Enviado por</small><strong>{fulfilledBy}</strong><span>Envio acompanhado e compra protegida</span></p>
            </div>
          </div>

          {product.sellerOptions?.length ? (
            <div className={styles.sellerOptions} aria-label="Outras opções de vendedor">
              <span>Escolha a loja</span>
              {product.sellerOptions.map((option) => (
                <button
                  aria-pressed={option.id === selectedSeller?.id}
                  className={option.id === selectedSeller?.id ? styles.selectedSellerOption : undefined}
                  key={option.id}
                  onClick={() => setSelectedSellerId(option.id)}
                  type="button"
                >
                  <span><strong>{option.seller}</strong><small>{option.availability}</small></span>
                  <b>{option.price}</b>
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.shippingBox}>
            <div className={styles.deliveryEstimate}><FiTruck aria-hidden="true" /><p><strong>{availability}</strong><span><DefaultShippingDestination /></span></p></div>
          </div>

          <div className={styles.stock}><FiCheck aria-hidden="true" /><span><strong>Produto em estoque</strong> • envio em até 2 dias úteis</span></div>

          <div className={styles.actions}>
            <button className={styles.cartButton} type="button"><LiaShoppingCartSolid aria-hidden="true" />Adicionar ao carrinho</button>
            <button className={styles.buyButton} type="button"><FiZap aria-hidden="true" />Comprar agora</button>
          </div>

          <div className={styles.guarantees}>
            <span><FiShield aria-hidden="true" /> Compra protegida</span>
            <span><FiPackage aria-hidden="true" /> Devolução gratuita em até 7 dias</span>
          </div>
          </SelectedOfferCard>

        </div>
      )}
      reviews={<ProductReviews itemName={product.name} rating={product.rating} reviewCount={product.reviewCount} image={product.image} additionalImage={product.images?.[1] ?? products.find((item) => item.slug !== product.slug)?.image} itemType="product" />}
      recommendations={<RelatedProducts currentSlug={product.slug} category={product.category} itemType="product" />}
      details={(
        <ProductTechnicalCard
          eyebrow="Ficha técnica"
          title="Especificações do produto"
          titleId="product-specifications-title"
          sectionRef={detailsRef}
          style={{
            marginTop: detailsLayout ? `${detailsLayout.marginTop}px` : "24px",
            marginBottom: detailsLayout ? `${detailsLayout.marginBottom}px` : "0px",
            width: detailsLayout ? `${detailsLayout.width}px` : "100%",
          }}
        >
          <dl className={styles.specifications}>
            {product.specifications.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{label === "Cor" && selectedColor ? selectedColor.label : value}</dd>
              </div>
            ))}
          </dl>
        </ProductTechnicalCard>
      )}
    />
  );
}
