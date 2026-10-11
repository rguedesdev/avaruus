import { Benefits } from "./components/Benefits";
import { CategoryGrid } from "./components/CategoryGrid";
import { HeroSection } from "./components/HeroSection";
import { ProductGrid } from "./components/ProductGrid";
import styles from "./marketplace-home.module.css";

export function MarketplaceHome() {
  return (
    <main className={styles.page}>
      <HeroSection />
      <CategoryGrid />
      <ProductGrid />
      <Benefits />
    </main>
  );
}
