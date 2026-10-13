import { readAuthToken } from "@/features/auth/auth-storage";
import { graphQLRequest } from "@/shared/lib/graphql/client";

export type CatalogVariation = { title: string; options: string[]; imageIDs: string[]; imageUrls: string[] };
export type AdminProductCandidate = { id: string; title: string; gtin: string; category: string; description: string; price: number; images: string[]; imageIDs: string[]; videoUrl: string; variations: CatalogVariation[]; bookDetails: string | null; international: boolean; shippingMethod: string; storeName: string; possibleCatalogMatches: Array<{ id: string; avsin: string; title: string; gtin: string; category: string; description: string; image: string; bookDetails: string | null }> };
export type CatalogProduct = { id: string; avsin: string; title: string; gtin: string; category: string; description: string; images: string[]; imageIDs: string[]; videoUrl: string; videoID: string | null; variations: CatalogVariation[]; bookDetails: string | null };
export type CatalogProductInput = { title: string; gtin: string; category: string; description: string; imageIDs: string[]; videoID: string | null; variations: Array<{ title: string; options: string[]; imageIDs: string[] }>; bookDetails: string | null };

function token() {
  const value = readAuthToken();
  if (!value) throw new Error("Sua sessão expirou. Entre novamente.");
  return value;
}

const variationFields = "title options imageIDs imageUrls";
const catalogFields = `id avsin title gtin category description images imageIDs videoUrl videoID variations { ${variationFields} } bookDetails`;
async function getAdminProducts() {
  const data = await graphQLRequest<{ adminProductCandidates: AdminProductCandidate[]; catalogProducts: CatalogProduct[] }, Record<string, never>>(
    `query AdminCatalog { adminProductCandidates { id title gtin category description price images imageIDs videoUrl variations { ${variationFields} } bookDetails international shippingMethod storeName possibleCatalogMatches { id avsin title gtin category description image bookDetails } } catalogProducts { ${catalogFields} } }`, {}, token(),
  );
  return data;
}
async function searchAdminCandidates(search: string) {
  const data = await graphQLRequest<{ adminProductCandidates: AdminProductCandidate[] }, { search: string }>(
    `query SearchAdminProductCandidates($search: String) { adminProductCandidates(search: $search) { id title gtin category description price images imageIDs videoUrl variations { ${variationFields} } bookDetails international shippingMethod storeName possibleCatalogMatches { id avsin title gtin category description image bookDetails } } }`, { search }, token(),
  );
  return data.adminProductCandidates;
}
async function findCatalogMatches(gtin: string) {
  const data = await graphQLRequest<{ adminCatalogMatches: CatalogProduct[] }, { gtin: string }>(
    `query AdminCatalogMatches($gtin: String!) { adminCatalogMatches(gtin: $gtin) { ${catalogFields} } }`, { gtin }, token(),
  );
  return data.adminCatalogMatches;
}
async function approveProductForCatalog(id: string, input: CatalogProductInput) {
  const data = await graphQLRequest<{ approveProductForCatalog: CatalogProduct }, { id: string; data: CatalogProductInput }>(
    `mutation ApproveProductForCatalog($id: ID!, $data: CatalogProductInput!) { approveProductForCatalog(id: $id, data: $data) { ${catalogFields} } }`, { id, data: input }, token(),
  );
  return data.approveProductForCatalog;
}
async function linkProductToCatalog(productID: string, catalogID: string) {
  const data = await graphQLRequest<{ linkProductToCatalog: CatalogProduct }, { productID: string; catalogID: string }>(
    `mutation LinkProductToCatalog($productID: ID!, $catalogID: ID!) { linkProductToCatalog(productID: $productID, catalogID: $catalogID) { ${catalogFields} } }`, { productID, catalogID }, token(),
  );
  return data.linkProductToCatalog;
}
async function adminCandidateAlreadyOffered(productID: string, catalogID: string) {
  const data = await graphQLRequest<{ adminCandidateAlreadyOffered: boolean }, { productID: string; catalogID: string }>(
    `query CheckCandidateOffer($productID: ID!, $catalogID: ID!) { adminCandidateAlreadyOffered(productID: $productID, catalogID: $catalogID) }`, { productID, catalogID }, token(),
  );
  return data.adminCandidateAlreadyOffered;
}
async function deleteAdminProductCandidate(id: string) {
  const data = await graphQLRequest<{ deleteAdminProductCandidate: boolean }, { id: string }>(
    `mutation DeleteAdminProductCandidate($id: ID!) { deleteAdminProductCandidate(id: $id) }`, { id }, token(),
  );
  return data.deleteAdminProductCandidate;
}
async function createCatalogProduct(input: CatalogProductInput) {
  const data = await graphQLRequest<{ createCatalogProduct: CatalogProduct }, { data: CatalogProductInput }>(
    `mutation CreateCatalogProduct($data: CatalogProductInput!) { createCatalogProduct(data: $data) { ${catalogFields} } }`, { data: input }, token(),
  );
  return data.createCatalogProduct;
}
async function updateCatalogProduct(id: string, input: CatalogProductInput) {
  const data = await graphQLRequest<{ updateCatalogProduct: CatalogProduct }, { id: string; data: CatalogProductInput }>(
    `mutation UpdateCatalogProduct($id: ID!, $data: CatalogProductInput!) { updateCatalogProduct(id: $id, data: $data) { ${catalogFields} } }`, { id, data: input }, token(),
  );
  return data.updateCatalogProduct;
}

export { adminCandidateAlreadyOffered, approveProductForCatalog, createCatalogProduct, deleteAdminProductCandidate, findCatalogMatches, getAdminProducts, linkProductToCatalog, searchAdminCandidates, updateCatalogProduct };
