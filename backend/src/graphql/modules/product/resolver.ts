import ProductService from "./service.js";

const productResolvers = {
  Query: {
    myProducts: (_: unknown, __: unknown, context: any) => ProductService.list(context.authUser?.id),
    publicProducts: () => ProductService.publicList(),
    publicStoreProducts: (_: unknown, { slug }: { slug: string }) => ProductService.publicStoreList(slug),
    publicProductById: (_: unknown, { id }: { id: string }) => ProductService.publicByID(id),
  },
  Mutation: {
    createProduct: (_: unknown, { data }: { data: unknown }, context: any) => ProductService.create(context.authUser?.id, data),
    updateProduct: (_: unknown, { id, data }: { id: string; data: unknown }, context: any) => ProductService.update(context.authUser?.id, id, data),
  },
};
export { productResolvers };
