import { ZodError } from "zod";

import { graphQLError } from "../../errors.js";
import { AddressModel } from "./model.js";
import { addressInputSchema } from "./validation.js";

function serializeAddress(address: any) {
  return {
    id: address._id?.toString() ?? address.id?.toString(),
    label: address.label,
    recipientName: address.recipientName,
    postalCode: address.postalCode,
    street: address.street,
    number: address.number,
    complement: address.complement ?? null,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    isDefault: address.isDefault,
  };
}

class AddressService {
  static requireUser(userID?: string) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    return userID;
  }

  static async list(userID?: string) {
    const id = this.requireUser(userID);
    const addresses = await AddressModel.find({ userID: id }).sort({ isDefault: -1, createdAt: 1 }).lean();
    return addresses.map(serializeAddress);
  }

  static async getDefault(userID: string) {
    const address = await AddressModel.findOne({ userID, isDefault: true }).lean();
    return address ? serializeAddress(address) : null;
  }

  static async save(userID: string | undefined, data: unknown) {
    const ownerID = this.requireUser(userID);
    let input;
    try {
      input = addressInputSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) throw graphQLError(error.issues[0]?.message ?? "Endereço inválido.", "BAD_USER_INPUT");
      throw error;
    }

    const existingCount = await AddressModel.countDocuments({ userID: ownerID });
    if (!input.id && existingCount >= 10) throw graphQLError("Você atingiu o limite de 10 endereços.", "CONFLICT");
    const shouldBeDefault = input.isDefault || existingCount === 0;
    if (shouldBeDefault) await AddressModel.updateMany({ userID: ownerID }, { $set: { isDefault: false } });

    const values = {
      ...input,
      complement: input.complement || null,
      isDefault: shouldBeDefault,
    };
    delete (values as any).id;
    const address = input.id
      ? await AddressModel.findOneAndUpdate({ _id: input.id, userID: ownerID }, { $set: values }, { new: true, runValidators: true })
      : await AddressModel.create({ ...values, userID: ownerID });
    if (!address) throw graphQLError("Endereço não encontrado.", "NOT_FOUND");
    return serializeAddress(address.toObject());
  }

  static async setDefault(userID: string | undefined, addressID: string) {
    const ownerID = this.requireUser(userID);
    const address = await AddressModel.findOne({ _id: addressID, userID: ownerID });
    if (!address) throw graphQLError("Endereço não encontrado.", "NOT_FOUND");
    await AddressModel.updateMany({ userID: ownerID }, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();
    return serializeAddress(address.toObject());
  }

  static async delete(userID: string | undefined, addressID: string) {
    const ownerID = this.requireUser(userID);
    const address = await AddressModel.findOneAndDelete({ _id: addressID, userID: ownerID });
    if (!address) return false;
    if (address.isDefault) {
      await AddressModel.findOneAndUpdate({ userID: ownerID }, { $set: { isDefault: true } }, { sort: { createdAt: 1 } });
    }
    return true;
  }
}

export { serializeAddress };
export default AddressService;
