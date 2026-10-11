import Link from "next/link";
import type { CSSProperties, ReactNode, Ref } from "react";
import { FiChevronRight } from "react-icons/fi";
import { LiaGlobeAmericasSolid } from "react-icons/lia";
import styles from "./product-listing-layout.module.css";

type ProductListingLayoutProps = {
  category: string;
  categoryHref: string;
  title: string;
  titleId: string;
  gallery: ReactNode;
  summary: ReactNode;
  purchase: ReactNode;
  details?: ReactNode;
  reviews?: ReactNode;
  recommendations?: ReactNode;
  pageRef?: Ref<HTMLElement>;
  heroRef?: Ref<HTMLElement>;
};

type ProductListingPageFrameProps = {
  category: string;
  categoryHref: string;
  title: string;
  children: ReactNode;
  pageRef?: Ref<HTMLElement>;
};

type SelectedOfferCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  international?: boolean;
};

type ProductPanelProps = {
  children: ReactNode;
  className?: string;
};

type ProductInfoCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
};

type ProductTechnicalCardProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  sectionRef?: Ref<HTMLElement>;
};

export function ProductInfoCard({ eyebrow, title, children, className = "" }: ProductInfoCardProps) {
  return (
    <article className={`${styles.infoCard} ${className}`}>
      <span className={styles.infoCardEyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

export function ProductTechnicalCard({
  eyebrow,
  title,
  titleId,
  description,
  children,
  className = "",
  style,
  sectionRef,
}: ProductTechnicalCardProps) {
  return (
    <section className={`${styles.technicalCard} ${className}`} ref={sectionRef} style={style} aria-labelledby={titleId}>
      <div className={styles.technicalHeading}>
        <span className={styles.infoCardEyebrow}>{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className={styles.technicalContent}>{children}</div>
    </section>
  );
}

export function ProductPanel({ children, className = "" }: ProductPanelProps) {
  return (
    <section className={`${styles.selectedOfferCard} ${className}`}>
      {children}
    </section>
  );
}

export function SelectedOfferCard({ title, children, className = "", international = false }: SelectedOfferCardProps) {
  return (
    <ProductPanel className={className}>
      <div className={styles.offerHeading}>
        <span>{title}</span>
        {international ? <div className={styles.internationalFlag}><LiaGlobeAmericasSolid aria-hidden="true" /><span>Produto internacional</span></div> : null}
      </div>
      {children}
    </ProductPanel>
  );
}

export function ProductListingPageFrame({ category, categoryHref, title, children, pageRef }: ProductListingPageFrameProps) {
  return (
    <main className={styles.page} ref={pageRef}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/">Home</Link><FiChevronRight aria-hidden="true" />
        <Link href={categoryHref}>{category}</Link><FiChevronRight aria-hidden="true" />
        <span>{title}</span>
      </nav>
      {children}
    </main>
  );
}

type ProductListingGridProps = {
  titleId: string;
  children: ReactNode;
  heroRef?: Ref<HTMLElement>;
  className?: string;
};

export function ProductListingGrid({ titleId, children, heroRef, className = "" }: ProductListingGridProps) {
  return (
    <section className={`${styles.hero} ${className}`} ref={heroRef} aria-labelledby={titleId}>
      {children}
    </section>
  );
}

export function ProductListingLayout({
  category,
  categoryHref,
  title,
  titleId,
  gallery,
  summary,
  purchase,
  details,
  reviews,
  recommendations,
  pageRef,
  heroRef,
}: ProductListingLayoutProps) {
  return (
    <ProductListingPageFrame category={category} categoryHref={categoryHref} title={title} pageRef={pageRef}>
      <ProductListingGrid titleId={titleId} heroRef={heroRef}>
        <div className={styles.gallery}>{gallery}</div>
        <div className={styles.summary}>{summary}</div>
        <div className={styles.purchase}>{purchase}</div>
      </ProductListingGrid>

      {details}
      {reviews}
      {recommendations}
    </ProductListingPageFrame>
  );
}
