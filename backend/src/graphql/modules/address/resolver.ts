import AddressService from "./service.js";

const addressResolvers = {
  Query: {
    myAddresses: (_parent: unknown, _args: unknown, context: any) => AddressService.list(context.authUser?.id),
  },
  Mutation: {
    saveAddress: (_parent: unknown, { data }: { data: unknown }, context: any) => AddressService.save(context.authUser?.id, data),
    deleteAddress: (_parent: unknown, { id }: { id: string }, context: any) => AddressService.delete(context.authUser?.id, id),
    setDefaultAddress: (_parent: unknown, { id }: { id: string }, context: any) => AddressService.setDefault(context.authUser?.id, id),
  },
  User: {
    defaultAddress: (parent: { id: string }) => AddressService.getDefault(parent.id),
  },
};

export { addressResolvers };
