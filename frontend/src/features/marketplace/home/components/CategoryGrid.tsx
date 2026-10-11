import Link from "next/link";
import { FiBookOpen, FiCpu, FiHome, FiSmile, FiTarget, FiTrendingUp } from "react-icons/fi";
import { categories } from "../home.data";
import styles from "../marketplace-home.module.css";

const icons = { tech: FiCpu, home: FiHome, fashion: FiTrendingUp, books: FiBookOpen, sport: FiTarget, beauty: FiSmile };

export function CategoryGrid() {
  return (
    <section className={styles.section} id="categorias" aria-labelledby="categories-title">
      <div className={styles.sectionHeading}>
        <div><h2 id="categories-title">Compre por categoria</h2></div>
        <Link className={styles.textLink} href="/books">Ver todas <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.categoryGrid}>
        {categories.map((category) => {
          const Icon = icons[category.icon];
          return (
            <Link className={styles.categoryCard} href="/books" key={category.name}>
              <span className={`${styles.categoryIcon} ${styles[category.color]}`}><Icon aria-hidden="true" /></span>
              <span>{category.name}</span><span className={styles.categoryArrow} aria-hidden="true">↗</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
