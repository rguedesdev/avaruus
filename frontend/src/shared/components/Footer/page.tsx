import styles from "./footer.module.css";

function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <strong>Avaruus</strong>
        <div className={styles.footerTexts}>2026 © Avaruus • Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}

export { Footer };
