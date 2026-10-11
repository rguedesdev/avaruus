import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiShield, FiTruck } from "react-icons/fi";
import styles from "../marketplace-home.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Image className={styles.heroImage} src="/images/marketplace-hero.png" alt="Seleção de produtos para casa, moda e tecnologia" fill priority sizes="(max-width: 768px) 100vw, 1320px" />
      <div className={styles.heroShade} />
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>Uma seleção feita para você</span>
        <h1 id="hero-title">Descubra o que combina com o seu mundo.</h1>
        <p>Produtos especiais, vendedores confiáveis e uma experiência simples do primeiro clique até a entrega.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="#destaques">Explorar produtos <FiArrowRight aria-hidden="true" /></Link>
          <Link className={styles.secondaryButton} href="#categorias">Ver categorias</Link>
        </div>
        <div className={styles.heroNotes}>
          <span><FiTruck aria-hidden="true" /> Entrega para todo o Brasil</span>
          <span><FiShield aria-hidden="true" /> Compra protegida</span>
        </div>
      </div>
    </section>
  );
}
