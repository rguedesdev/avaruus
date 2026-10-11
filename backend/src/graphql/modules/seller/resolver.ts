import SellerService from "./service.js";

const sellerResolvers = {
  Query: {
    mySellerSettings: (_parent: unknown, _args: unknown, context: any) => SellerService.getSettings(context.authUser?.id),
    publicStoreBySlug: (_parent: unknown, { slug }: { slug: string }) => SellerService.getPublicStore(slug),
  },
  Mutation: {
    saveSellerSettings: (_parent: unknown, { data }: { data: unknown }, context: any) => SellerService.saveSettings(context.authUser?.id, data),
  },
  SellerAddress: {
    id: (parent: { _id?: { toString(): string }; id?: string }) => parent._id?.toString() ?? parent.id ?? "",
  },
};

export { sellerResolvers };
