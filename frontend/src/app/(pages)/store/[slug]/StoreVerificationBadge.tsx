import { VscVerifiedFilled } from "react-icons/vsc";
import styles from "./store-verification-badge.module.css";

export type StoreVerificationVariant = "black" | "blue" | "gold" | "bronze" | "silver";

export function StoreVerificationBadge({ variant }: { variant: StoreVerificationVariant }) {
  return (
    <VscVerifiedFilled
      className={styles.badge}
      data-variant={variant}
      role="img"
      aria-label="Loja verificada"
    />
  );
}
