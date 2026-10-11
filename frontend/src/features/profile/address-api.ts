import type { Address } from "@/features/auth/auth.types";
import { readAuthToken } from "@/features/auth/auth-storage";
import { graphQLRequest } from "@/shared/lib/graphql/client";

type AddressInput = Omit<Address, "id" | "isDefault"> & { id?: string; isDefault?: boolean };

function token() {
  const value = readAuthToken();
  if (!value) throw new Error("Sua sessão expirou. Entre novamente.");
  return value;
}

async function listAddresses() {
  const data = await graphQLRequest<{ myAddresses: Address[] }, Record<string, never>>(
    `query MyAddresses { myAddresses { id label recipientName postalCode street number complement neighborhood city state isDefault } }`,
    {}, token(),
  );
  return data.myAddresses;
}

async function saveAddress(input: AddressInput) {
  const data = await graphQLRequest<{ saveAddress: Address }, { data: AddressInput }>(
    `mutation SaveAddress($data: AddressInput!) { saveAddress(data: $data) { id label recipientName postalCode street number complement neighborhood city state isDefault } }`,
    { data: input }, token(),
  );
  return data.saveAddress;
}

async function setDefaultAddress(id: string) {
  await graphQLRequest<{ setDefaultAddress: Address }, { id: string }>(
    `mutation SetDefaultAddress($id: ID!) { setDefaultAddress(id: $id) { id } }`,
    { id }, token(),
  );
}

async function deleteAddress(id: string) {
  await graphQLRequest<{ deleteAddress: boolean }, { id: string }>(
    `mutation DeleteAddress($id: ID!) { deleteAddress(id: $id) }`,
    { id }, token(),
  );
}

export { deleteAddress, listAddresses, saveAddress, setDefaultAddress };
export type { AddressInput };
