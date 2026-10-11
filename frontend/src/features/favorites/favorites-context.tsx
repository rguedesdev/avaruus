"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { readAuthToken } from "@/features/auth/auth-storage";
import { graphQLRequest } from "@/shared/lib/graphql/client";

type FavoritesContextValue = {
  favoriteSlugs: Set<string>;
  toggleFavorite(slug: string): Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function loadFavorites() {
      if (status !== "authenticated" || !user) {
        if (active) setFavoriteSlugs(new Set());
        return;
      }
      const token = readAuthToken();
      if (!token) return;
      try {
        const data = await graphQLRequest<
          { myFavorites: Array<{ productSlug: string }> },
          Record<string, never>
        >(`query MyFavorites { myFavorites { productSlug } }`, {}, token);
        if (active) setFavoriteSlugs(new Set(data.myFavorites.map((item) => item.productSlug)));
      } catch {
        if (active) setFavoriteSlugs(new Set());
      }
    }
    void loadFavorites();
    return () => { active = false; };
  }, [status, user]);

  async function toggleFavorite(slug: string) {
    const token = readAuthToken();
    if (!token) throw new Error("AUTH_REQUIRED");
    const data = await graphQLRequest<
      { toggleFavorite: { productSlug: string; isFavorite: boolean } },
      { productSlug: string }
    >(
      `mutation ToggleFavorite($productSlug: String!) { toggleFavorite(productSlug: $productSlug) { productSlug isFavorite } }`,
      { productSlug: slug },
      token,
    );
    setFavoriteSlugs((current) => {
      const next = new Set(current);
      if (data.toggleFavorite.isFavorite) next.add(slug); else next.delete(slug);
      return next;
    });
    return data.toggleFavorite.isFavorite;
  }

  const value = useMemo(() => ({ favoriteSlugs, toggleFavorite }), [favoriteSlugs]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider.");
  return context;
}

export { FavoritesProvider, useFavorites };
