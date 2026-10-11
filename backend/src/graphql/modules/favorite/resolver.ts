import FavoriteService from "./service.js";

const favoriteResolvers = {
  Query: {
    myFavorites: (_parent: unknown, _args: unknown, context: any) => FavoriteService.list(context.authUser?.id),
    isFavorite: (_parent: unknown, { productSlug }: { productSlug: string }, context: any) => FavoriteService.isFavorite(context.authUser?.id, productSlug),
  },
  Mutation: {
    toggleFavorite: (_parent: unknown, { productSlug }: { productSlug: string }, context: any) => FavoriteService.toggle(context.authUser?.id, productSlug),
  },
};

export { favoriteResolvers };
