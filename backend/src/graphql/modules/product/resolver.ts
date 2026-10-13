import ProductService from "./service.js";

const productResolvers = {
  Query: {
    myProducts: (_: unknown, __: unknown, context: any) => ProductService.list(context.authUser?.id),
    productCatalogMatches: (_: unknown, { gtin }: { gtin: string }, context: any) => ProductService.catalogMatches(context.authUser?.id, gtin),
    productCatalogSearch: (_: unknown, { search }: { search: string }, context: any) => ProductService.catalogSearch(context.authUser?.id, search),
    adminProductCandidates: (_: unknown, { search }: { search?: string }, context: any) => ProductService.adminCandidates(context.authUser?.id, search),
    catalogProducts: (_: unknown, __: unknown, context: any) => ProductService.listCatalog(context.authUser?.id),
    adminCatalogMatches: (_: unknown, { gtin }: { gtin: string }, context: any) => ProductService.adminCatalogMatches(context.authUser?.id, gtin),
    adminCandidateAlreadyOffered: (_: unknown, { productID, catalogID }: { productID: string; catalogID: string }, context: any) => ProductService.adminCandidateAlreadyOffered(context.authUser?.id, productID, catalogID),
    publicProducts: () => ProductService.publicList(),
    publicStoreProducts: (_: unknown, { slug }: { slug: string }) => ProductService.publicStoreList(slug),
    publicProductById: (_: unknown, { id }: { id: string }) => ProductService.publicByID(id),
  },
  Mutation: {
    createProduct: (_: unknown, { data }: { data: unknown }, context: any) => ProductService.create(context.authUser?.id, data),
    updateProduct: (_: unknown, { id, data }: { id: string; data: unknown }, context: any) => ProductService.update(context.authUser?.id, id, data),
    approveProductForCatalog: (_: unknown, { id, data }: { id: string; data: unknown }, context: any) => ProductService.approveForCatalog(context.authUser?.id, id, data),
    linkProductToCatalog: (_: unknown, { productID, catalogID }: { productID: string; catalogID: string }, context: any) => ProductService.linkCandidateToCatalog(context.authUser?.id, productID, catalogID),
    deleteAdminProductCandidate: (_: unknown, { id }: { id: string }, context: any) => ProductService.deleteAdminCandidate(context.authUser?.id, id),
    createCatalogProduct: (_: unknown, { data }: { data: unknown }, context: any) => ProductService.createCatalog(context.authUser?.id, data),
    updateCatalogProduct: (_: unknown, { id, data }: { id: string; data: unknown }, context: any) => ProductService.updateCatalog(context.authUser?.id, id, data),
  },
};
export { productResolvers };
