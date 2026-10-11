import { addressResolvers } from "./modules/address/resolver.js";
import { addressTypeDefs } from "./modules/address/schema.js";
import { favoriteResolvers } from "./modules/favorite/resolver.js";
import { favoriteTypeDefs } from "./modules/favorite/schema.js";
import { sellerResolvers } from "./modules/seller/resolver.js";
import { sellerTypeDefs } from "./modules/seller/schema.js";
import { productResolvers } from "./modules/product/resolver.js";
import { productTypeDefs } from "./modules/product/schema.js";
import { userResolvers } from "./modules/user/resolver.js";
import { userTypeDefs } from "./modules/user/schema.js";

const schema = [userTypeDefs, addressTypeDefs, favoriteTypeDefs, sellerTypeDefs, productTypeDefs];

const resolvers = {
  Query: { ...userResolvers.Query, ...addressResolvers.Query, ...favoriteResolvers.Query, ...sellerResolvers.Query, ...productResolvers.Query },
  Mutation: { ...userResolvers.Mutation, ...addressResolvers.Mutation, ...favoriteResolvers.Mutation, ...sellerResolvers.Mutation, ...productResolvers.Mutation },
  User: { ...addressResolvers.User },
  SellerAddress: { ...sellerResolvers.SellerAddress },
};

export { resolvers, schema };
