const productTypeDefs = /* GraphQL */ `
  type ProductVariation { title: String!, options: [String!]!, imageIDs: [ID!]!, imageUrls: [String!]! }
  input ProductVariationInput { title: String!, options: [String!]!, imageIDs: [ID!]! }
  type SellerProduct { id: ID!, title: String!, gtin: String!, category: String!, description: String!, price: Float!, images: [String!]!, imageIDs: [ID!]!, videoUrl: String!, videoID: ID, variations: [ProductVariation!]!, bookDetails: String, shippingMethod: String! }
  type PublicProduct { id: ID!, title: String!, category: String!, price: Float!, image: String!, storeSlug: String! }
  type PublicProductDetails { id: ID!, title: String!, category: String!, price: Float!, images: [String!]!, description: String!, gtin: String!, variations: [PublicProductVariation!]!, bookDetails: String, shippingMethod: String!, storeSlug: String!, storeName: String! }
  type PublicProductVariation { title: String!, options: [String!]! }
  input SellerProductInput { title: String!, gtin: String, category: String!, description: String!, price: Float!, imageIDs: [ID!]!, videoID: ID, variations: [ProductVariationInput!]!, bookDetails: String, shippingMethod: String! }
  input SellerProductUpdateInput { title: String!, gtin: String, category: String!, description: String!, price: Float!, imageIDs: [ID!]!, videoID: ID, variations: [ProductVariationInput!]!, bookDetails: String, shippingMethod: String! }
  extend type Query { myProducts: [SellerProduct!]!, publicProducts: [PublicProduct!]!, publicStoreProducts(slug: String!): [PublicProduct!]!, publicProductById(id: ID!): PublicProductDetails }
  extend type Mutation { createProduct(data: SellerProductInput!): SellerProduct!, updateProduct(id: ID!, data: SellerProductUpdateInput!): SellerProduct! }
`;
export { productTypeDefs };
