const favoriteTypeDefs = /* GraphQL */ `
  type Favorite {
    productSlug: String!
    createdAt: String!
  }

  type FavoriteStatus {
    productSlug: String!
    isFavorite: Boolean!
  }

  extend type Query {
    myFavorites: [Favorite!]!
    isFavorite(productSlug: String!): Boolean!
  }

  extend type Mutation {
    toggleFavorite(productSlug: String!): FavoriteStatus!
  }
`;

export { favoriteTypeDefs };
