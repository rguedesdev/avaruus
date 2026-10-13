"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  FiBookmark,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiGift,
  FiHardDrive,
  FiHash,
  FiHeadphones,
  FiInfo,
  FiMic,
  FiRepeat,
  FiSend,
  FiShield,
  FiStar,
  FiTruck,
  FiType,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { AiOutlineBarcode } from "react-icons/ai";
import { BsBuildings } from "react-icons/bs";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { DefaultShippingDestination } from "@/features/shipping/DefaultShippingDestination";
import { LiaBookSolid, LiaGlobeAmericasSolid, LiaShoppingCartSolid } from "react-icons/lia";
import { LuCalendarRange, LuLibrary } from "react-icons/lu";
import { MdFace } from "react-icons/md";
import { RiAccessibilityLine, RiCustomSize, RiStore3Line, RiTranslate } from "react-icons/ri";
import { ProductImageGallery } from "../product-gallery";
import { ProductReviews } from "../reviews/ProductReviews";
import { RelatedProducts } from "../recommendations/RelatedProducts";
import type { ProductCardItem } from "../product-card/ProductCard";
import { PublisherProducts } from "../recommendations/PublisherProducts";
import { ProductInfoCard, ProductListingLayout, ProductPanel, ProductTechnicalCard, SelectedOfferCard } from "../product-listing-layout";
import { books, type Book, type BookFormatId } from "../books/catalog";
import styles from "./book-detail.module.css";

const formatIcons = {
  ebook: HiOutlineBookOpen,
  audiobook: FiHeadphones,
  paperback: LiaBookSolid,
  hardcover: LiaBookSolid,
} satisfies Record<BookFormatId, IconType>;

const editionDetailIcons: Record<string, IconType> = {
  "Nome da série": FiBookmark,
  "Livro na coleção": LuLibrary,
  "Número de páginas": FiFileText,
  Idioma: RiTranslate,
  Editora: BsBuildings,
  "Data da publicação": LuCalendarRange,
  "Idade de leitura": MdFace,
  Dimensões: RiCustomSize,
  "ISBN-10": AiOutlineBarcode,
  "ISBN-13": AiOutlineBarcode,
  "Duração do título": FiClock,
  Autor: FiUser,
  Narrador: FiMic,
  ASIN: FiHash,
  Versão: FiCheckCircle,
  "Tipo de programa": FiHeadphones,
  "Tamanho do arquivo": FiHardDrive,
  "Page Flip": FiRepeat,
  "Dicas de vocabulário": HiOutlineBookOpen,
  "Configuração de fonte": FiType,
  Acessibilidade: RiAccessibilityLine,
  Edição: LiaBookSolid,
  Tradução: LiaGlobeAmericasSolid,
  Ilustrações: FiEdit3,
};

type BookDetailsProps = { book: Book; relatedItems?: ProductCardItem[] };

export function BookDetails({ book, relatedItems }: BookDetailsProps) {
  const pageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const tradePanelRef = useRef<HTMLDivElement>(null);
  const editionRef = useRef<HTMLElement>(null);
  const [editionLayout, setEditionLayout] = useState<{ marginTop: number; marginBottom: number; width: number } | null>(null);
  const [selection, setSelection] = useState({
    formatId: book.formats[0].id,
    offerId: book.formats[0].offers[0].id,
  });
  const [digitalRecipient, setDigitalRecipient] = useState("");
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [sampleRecipient, setSampleRecipient] = useState("");
  const [sampleSent, setSampleSent] = useState(false);

  useEffect(() => {
    if (!sampleModalOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSampleModalOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sampleModalOpen]);

  const selectedFormat =
    book.formats.find((format) => format.id === selection.formatId) ?? book.formats[0];
  const selectedOffer =
    selectedFormat.offers.find((offer) => offer.id === selection.offerId) ??
    selectedFormat.offers[0];
  const authorNameParts = book.author.trim().split(/\s+/);
  const authorInitials = `${authorNameParts[0]?.[0] ?? ""}${authorNameParts.at(-1)?.[0] ?? ""}`.toUpperCase();
  const authorTooltipId = `author-tooltip-${book.slug}`;
  const translatorTooltipId = `translator-tooltip-${book.slug}`;
  const coverArtistTooltipId = `cover-artist-tooltip-${book.slug}`;
  const editionDetails = selectedFormat.editionDetails ?? [];
  const editionColumnBreak = Math.ceil(editionDetails.length / 2);
  const editionDetailColumns = [
    editionDetails.slice(0, editionColumnBreak),
    editionDetails.slice(editionColumnBreak),
  ];

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    const gallery = galleryRef.current;
    const summary = summaryRef.current;
    const tradePanel = tradePanelRef.current;
    const edition = editionRef.current;
    if (!page || !hero || !gallery || !summary || !tradePanel || !edition || !editionDetails.length) return;

    const updateEditionLayout = () => {
      const pageRect = page.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();
      const summaryRect = summary.getBoundingClientRect();
      const offerRect = tradePanel.getBoundingClientRect();
      const gap = 24;
      const stacked = window.matchMedia("(max-width: 1000px)").matches;
      const start = (stacked
        ? Math.max(galleryRect.bottom, summaryRect.bottom, offerRect.bottom)
        : Math.max(galleryRect.bottom, summaryRect.bottom)) + gap;
      const offerContinuesBesideIt = !stacked && offerRect.bottom > start;
      const rightEdge = offerContinuesBesideIt ? offerRect.left - gap : pageRect.right;
      const editionHeight = edition.offsetHeight;
      const marginTop = start - heroRect.bottom;
      const marginBottom = Math.max(0, heroRect.bottom - (start + editionHeight));

      setEditionLayout({
        marginTop,
        marginBottom,
        width: Math.max(0, rightEdge - pageRect.left),
      });
    };

    updateEditionLayout();
    const observer = new ResizeObserver(updateEditionLayout);
    observer.observe(page);
    observer.observe(hero);
    observer.observe(gallery);
    observer.observe(summary);
    observer.observe(tradePanel);
    observer.observe(edition);
    window.addEventListener("resize", updateEditionLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateEditionLayout);
    };
  }, [book.slug, editionDetails.length, selectedFormat.id]);

  function selectFormat(formatId: BookFormatId) {
    const format = book.formats.find((item) => item.id === formatId);
    if (!format) return;
    setSelection({ formatId, offerId: format.offers[0].id });
  }

  function openSampleModal() {
    setSampleSent(false);
    setSampleModalOpen(true);
  }

  function sendSample(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sampleRecipient.trim().length < 3) return;
    setSampleSent(true);
  }

  return (
    <>
      <ProductListingLayout
        category="Livros"
        categoryHref="/books"
        title={book.title}
        titleId="book-title"
        pageRef={pageRef}
        heroRef={heroRef}
        gallery={(
          <div className={styles.galleryStage} ref={galleryRef}>
        <ProductImageGallery
          images={(book.images ?? [book.image]).map((src, index) => ({
            src,
            alt: index === 0
              ? `Capa do livro ${book.title}, de ${book.author}`
              : `${book.title} — imagem ${index + 1}`,
          }))}
          variant="book"
          sticky
          leftAligned
        />
        </div>
        )}
        summary={(
          <div className={styles.bookSummary} ref={summaryRef}>
          <div className={styles.topline}>
            <span>Novo</span><i aria-hidden="true" /><span>{book.soldLabel}</span>
            <FavoriteButton className={styles.topFavoriteButton} slug={book.slug} label={book.title} />
          </div>
          <h1 id="book-title">{book.title}</h1>
          <p className={styles.author}>
            por{" "}
              <span className={styles.authorProfile}>
              <button className={styles.authorTrigger} type="button" aria-describedby={authorTooltipId}>
                {book.author}
              </button>
              <span className={styles.authorTooltip} id={authorTooltipId} role="tooltip">
                <span className={styles.authorAvatar} aria-hidden="true">
                  {book.slug === "quarta-asa" ? <Image src="/images/authors/rebecca-yarros.jpg" alt="" fill sizes="48px" /> : authorInitials}
                </span>
                <span className={styles.authorDetails}>
                  <strong>{book.author}</strong>
                  <span>Autor</span>
                </span>
              </span>
              </span>
              {book.collaborators?.length ? book.collaborators.map((contributor, index) => {
                const tooltipId = `contributor-tooltip-${book.slug}-${index}`;
                const initials = contributor.name.trim().split(/\s+/).map((part) => part[0] ?? "").slice(0, 2).join("").toUpperCase();
                return (
                  <span className={styles.authorProfile} key={`${contributor.name}-${contributor.role}`}>
                    <span className={styles.contributorSeparator} aria-hidden="true">|</span>
                    <button className={styles.authorTrigger} type="button" aria-describedby={tooltipId}>{contributor.name}</button>
                    <span className={styles.authorTooltip} id={tooltipId} role="tooltip">
                      <span className={styles.authorAvatar} aria-hidden="true">{initials}</span>
                      <span className={styles.authorDetails}><strong>{contributor.name}</strong><span>{contributor.role}</span></span>
                    </span>
                  </span>
                );
              }) : book.slug === "quarta-asa" ? (
                <>
                  <span className={styles.contributorSeparator} aria-hidden="true">|</span>
                  <span className={styles.authorProfile}>
                    <a
                      className={styles.authorTrigger}
                      href="https://www.amazon.com.br/s/ref=dp_byline_sr_book_2?ie=UTF8&field-author=Ramon+Mapa&text=Ramon+Mapa&sort=relevancerank&search-alias=stripbooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-describedby={translatorTooltipId}
                    >Ramon Mapa</a>
                    <span className={styles.authorTooltip} id={translatorTooltipId} role="tooltip">
                      <span className={styles.authorAvatar} aria-hidden="true">RM</span>
                      <span className={styles.authorDetails}><strong>Ramon Mapa</strong><span>Tradutor</span></span>
                    </span>
                  </span>
                  <span className={styles.contributorSeparator} aria-hidden="true">|</span>
                  <span className={styles.authorProfile}>
                    <button className={styles.authorTrigger} type="button" aria-describedby={coverArtistTooltipId}>
                      Elisa Von Randow
                    </button>
                    <span className={styles.authorTooltip} id={coverArtistTooltipId} role="tooltip">
                      <span className={styles.authorAvatar} aria-hidden="true">EV</span>
                      <span className={styles.authorDetails}><strong>Elisa Von Randow</strong><span>Designer de Capa</span></span>
                    </span>
                  </span>
                </>
              ) : null}
          </p>
          <div className={styles.ratingRow}>
            <strong>{book.rating}</strong>
            <span className={styles.stars} aria-label={`${book.rating} de 5 estrelas`}>
              {Array.from({ length: 5 }, (_, index) => <FiStar key={index} aria-hidden="true" />)}
            </span>
            <a href="#avaliacoes">{book.reviewCount.toLocaleString("pt-BR")} avaliações</a>
            {book.series ? <span>{book.series}{book.seriesPosition ? ` • ${book.seriesPosition}` : ""}</span> : null}
          </div>
          <ProductInfoCard eyebrow="Sobre o livro" title="Uma escolha pode mudar tudo" className={styles.bookAbout}>
            <p>{book.description}</p>
            {["ebook", "audiobook"].includes(selectedFormat.id) ? <button className={styles.sampleButton} type="button" onClick={openSampleModal}>
              {selectedFormat.id === "audiobook" ? <FiHeadphones aria-hidden="true" /> : <HiOutlineBookOpen aria-hidden="true" />}
              {selectedFormat.id === "audiobook" ? "Ouvir amostra" : "Ler amostra"}
            </button> : null}
          </ProductInfoCard>
          </div>
        )}
        purchase={(
          <div className={styles.tradePanel} ref={tradePanelRef}>
            <ProductPanel className={styles.formatPanel}>
              <fieldset className={styles.formats}>
                <legend>Escolha o formato</legend>
                <div className={styles.formatGrid}>
                  {book.formats.map((format) => {
                    const Icon = formatIcons[format.id];
                    const selected = selectedFormat.id === format.id;
                    return (
                      <button
                        className={selected ? styles.selectedFormat : undefined}
                        key={format.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectFormat(format.id)}
                      >
                        <Icon className={format.digital ? undefined : styles.physicalFormatIcon} aria-hidden="true" />
                        <span><strong>{format.label}</strong><small>{format.detail}</small></span>
                        <b>{format.offers[0].price}</b>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </ProductPanel>

          <SelectedOfferCard title="Oferta selecionada" className={styles.offer} international={!selectedFormat.digital && selectedOffer.international}>
            <strong className={styles.price}>{selectedOffer.price}</strong>
            <p className={styles.installments}>{selectedOffer.installments}</p>

            <div className={styles.sellerRow}>
              <div>
                <span><RiStore3Line aria-hidden="true" /></span>
                <p>Vendido por <strong>{selectedOffer.seller}</strong><small><FiStar aria-hidden="true" /> {selectedOffer.sellerRating} de reputação</small></p>
              </div>
              <div>
                <span>{selectedFormat.digital ? <HiOutlineBookOpen aria-hidden="true" /> : <FiTruck aria-hidden="true" />}</span>
                <p>{selectedFormat.digital ? "Entregue por" : "Enviado por"} <strong>{selectedOffer.fulfilledBy}</strong><small>{selectedFormat.digital ? "Entrega digital protegida" : "Envio acompanhado"}</small></p>
              </div>
            </div>

            {selectedFormat.offers.length > 1 && (
              <div className={styles.otherOffers}>
                <span>Escolha a loja</span>
                {selectedFormat.offers.map((offer) => (
                  <button
                    className={selectedOffer.id === offer.id ? styles.selectedSeller : undefined}
                    key={offer.id}
                    type="button"
                    onClick={() => setSelection({ formatId: selectedFormat.id, offerId: offer.id })}
                  >
                    <span><strong>{offer.seller}</strong><small>{offer.availability}</small></span>
                    <b>{offer.price}</b>
                  </button>
                ))}
              </div>
            )}

            {selectedFormat.digital ? (
              <div className={styles.digitalDelivery}>
                <div className={styles.digitalDeliveryHeading}>
                  <p><strong>Entrega digital</strong><small>Leia ou ouça no formato selecionado.</small></p>
                </div>
                <label htmlFor="digital-recipient">Username ou e-mail para receber este título</label>
                <div className={styles.emailField}>
                  <FiUser aria-hidden="true" />
                  <input
                    id="digital-recipient"
                    type="text"
                    value={digitalRecipient}
                    onChange={(event) => setDigitalRecipient(event.target.value)}
                    placeholder="@username ou nome@exemplo.com"
                  />
                </div>
                <p className={styles.recipientHint}><FiGift aria-hidden="true" /> Pode ser a sua conta ou a conta de quem receberá o presente.</p>
              </div>
            ) : (
              <div className={styles.physicalDelivery}>
                <FiTruck aria-hidden="true" />
                <p><strong>{selectedOffer.availability}</strong><span><DefaultShippingDestination /></span></p>
              </div>
            )}

            <div className={`${styles.stock} ${selectedFormat.digital ? styles.digitalStock : ""}`}><FiCheck aria-hidden="true" /><span>{selectedFormat.digital ? "Disponível imediatamente" : "Produto em estoque"}</span></div>
            <div className={styles.actions}>
              <button className={styles.cartButton} type="button"><LiaShoppingCartSolid aria-hidden="true" />Adicionar ao carrinho</button>
              <button className={styles.buyButton} type="button"><FiZap aria-hidden="true" />Comprar agora</button>
            </div>
            <div className={styles.protection}><FiShield aria-hidden="true" /> Compra protegida do pagamento à entrega</div>
          </SelectedOfferCard>
          </div>
        )}
        details={selectedFormat.editionDetails?.length ? (
        <ProductTechnicalCard
          eyebrow="Ficha técnica"
          title={`Edição ${selectedFormat.label}`}
          titleId="edition-details-title"
          description="As informações exibidas correspondem ao formato selecionado."
          sectionRef={editionRef}
          style={{
            marginTop: editionLayout ? `${editionLayout.marginTop}px` : "24px",
            marginBottom: editionLayout ? `${editionLayout.marginBottom}px` : "0px",
            width: editionLayout ? `${editionLayout.width}px` : "100%",
          }}
        >
          <div className={styles.editionDetails}>
            {editionDetailColumns.map((column, columnIndex) => (
              <dl className={styles.editionDetailsColumn} key={columnIndex}>
                {column.map(([label, value]) => {
                  const DetailIcon = editionDetailIcons[label] ?? FiInfo;
                  return (
                    <div key={label}>
                    <DetailIcon aria-hidden="true" />
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  );
                })}
              </dl>
            ))}
          </div>
        </ProductTechnicalCard>
      ) : null}
        reviews={<ProductReviews itemName={book.title} rating={book.rating} reviewCount={book.reviewCount} image={book.image} additionalImage={book.images?.[1] ?? books.find((item) => item.slug !== book.slug)?.image} itemType="book" />}
        recommendations={(
          <>
            <RelatedProducts currentSlug={book.slug} category={book.category} itemType="book" items={relatedItems} emptyMessage={relatedItems ? "Ainda não há outros livros anunciados para recomendar." : undefined} />
            {!relatedItems ? <PublisherProducts currentSlug={book.slug} publisher={book.publisher} /> : null}
          </>
        )}
      />
      {sampleModalOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSampleModalOpen(false);
          }}
        >
          <section
            className={styles.sampleModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sample-modal-title"
          >
            <button
              className={styles.modalClose}
              type="button"
              aria-label="Fechar"
              onClick={() => setSampleModalOpen(false)}
            >
              <FiX aria-hidden="true" />
            </button>

            {!sampleSent ? (
              <>
                <span className={styles.kicker}>Amostra gratuita</span>
                <h2 id="sample-modal-title">Envie para sua biblioteca digital</h2>
                <p>Informe o username ou e-mail da conta que receberá a amostra de <strong>{book.title}</strong>.</p>
                <form className={styles.sampleForm} onSubmit={sendSample} autoComplete="off">
                  <label htmlFor="sample-recipient">Username ou e-mail</label>
                  <div className={styles.sampleInput}>
                    <FiUser aria-hidden="true" />
                    <input
                      id="sample-recipient"
                      type="text"
                      value={sampleRecipient}
                      onChange={(event) => setSampleRecipient(event.target.value)}
                      placeholder="@username ou nome@exemplo.com"
                      minLength={3}
                      required
                      autoFocus
                    />
                  </div>
                  <small>A amostra ficará disponível para download na biblioteca digital.</small>
                  <button type="submit"><FiSend aria-hidden="true" /> Enviar amostra</button>
                </form>
              </>
            ) : (
              <div className={styles.sampleSuccess}>
                <span><FiCheck aria-hidden="true" /></span>
                <span className={styles.kicker}>Envio solicitado</span>
                <h2 id="sample-modal-title">A amostra foi enviada</h2>
                <p>Ela ficará disponível para download na biblioteca digital de <strong>{sampleRecipient.trim()}</strong>.</p>
                <button type="button" onClick={() => setSampleModalOpen(false)}>Entendi</button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
