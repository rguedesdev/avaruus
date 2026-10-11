"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdFavoriteBorder, MdOutlineFavorite } from "react-icons/md";

import { useAuth } from "@/features/auth/auth-context";
import { useFavorites } from "./favorites-context";
import styles from "./favorites.module.css";

function FavoriteButton({ slug, label, className }: { slug: string; label: string; className?: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const { favoriteSlugs, toggleFavorite } = useFavorites();
  const [pending, setPending] = useState(false);
  const active = favoriteSlugs.has(slug);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    setPending(true);
    try { await toggleFavorite(slug); } finally { setPending(false); }
  }

  return <button className={`${className ?? ""} ${active ? styles.active : ""}`} type="button" onClick={() => void toggle()} disabled={pending} aria-pressed={active} aria-label={`${active ? "Remover" : "Adicionar"} ${label} ${active ? "dos" : "aos"} favoritos`}>{active ? <MdOutlineFavorite aria-hidden="true" /> : <MdFavoriteBorder aria-hidden="true" />}</button>;
}

export { FavoriteButton };
