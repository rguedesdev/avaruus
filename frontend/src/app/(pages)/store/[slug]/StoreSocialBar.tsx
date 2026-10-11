"use client";

import { useState } from "react";
import { FiStar } from "react-icons/fi";
import { BsBoxSeam } from "react-icons/bs";
import { FaCheck, FaPlus } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import styles from "./store-social-bar.module.css";

type StoreSocialBarProps = {
  followerCount: number;
  productCount: number;
  rating: number | null;
  reviewCount: number;
};

export function StoreSocialBar({ followerCount, productCount, rating, reviewCount }: StoreSocialBarProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const displayedFollowerCount = followerCount + (isFollowing ? 1 : 0);

  return (
    <div className={styles.socialBar}>
      <div className={styles.socialRow}>
        <div className={styles.metrics} aria-label="Informações da loja">
          <div className={styles.metric}>
            <MdOutlinePeopleAlt aria-hidden="true" />
            <span><strong>{displayedFollowerCount.toLocaleString("pt-BR")}</strong><small>Seguidores</small></span>
          </div>
          <div className={styles.metric}>
            <BsBoxSeam className={styles.productIcon} aria-hidden="true" />
            <span><strong>{productCount.toLocaleString("pt-BR")}</strong><small>Produtos</small></span>
          </div>
          <div className={styles.metric}>
            <FiStar aria-hidden="true" />
            <span>
              <strong>{rating === null ? "—" : rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
              <small>{reviewCount ? `${reviewCount.toLocaleString("pt-BR")} avaliações` : "Sem avaliações"}</small>
            </span>
          </div>
        </div>
        <button
          className={styles.followButton}
          type="button"
          aria-pressed={isFollowing}
          onClick={() => setIsFollowing((following) => !following)}
        >
          {isFollowing ? <FaCheck aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
          {isFollowing ? "Seguindo" : "Seguir loja"}
        </button>
      </div>
    </div>
  );
}
