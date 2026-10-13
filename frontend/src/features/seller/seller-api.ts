import { readAuthToken } from "@/features/auth/auth-storage";
import { graphQLRequest } from "@/shared/lib/graphql/client";

export type SellerAddressPurpose = "SHIPPING" | "RETURN" | "PICKUP";
export type SellerAddress = {
  id?: string;
  label: string;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  purposes: SellerAddressPurpose[];
};
export type SellerDayHours = { closed: boolean; open: string; close: string };
export type SellerBusinessHours = Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", SellerDayHours>;

export type SellerSettings = {
  slug: string;
  storeName: string;
  phone: string;
  taxDocument: string;
  photoUrl: string;
  photoImageID: string | null;
  description: string;
  sellerAddresses: SellerAddress[];
  businessHours: SellerBusinessHours;
  orderNotifications: boolean;
  promotionalNotifications: boolean;
  stockNotifications: boolean;
  vacationMode: boolean;
};
export type SellerProduct = { id: string; title: string; gtin: string; category: string; description: string; price: number; images: string[]; imageIDs: string[]; videoUrl: string; videoID: string | null; variations: Array<{ title: string; options: string[]; imageIDs: string[]; imageUrls: string[] }>; bookDetails: string | null; catalogAVSIN: string | null; international: boolean; shippingMethod: string };
export type UploadedMedia = { id: string; url: string };
type SellerSettingsInput = Omit<SellerSettings, "photoUrl" | "slug">;

function token() {
  const value = readAuthToken();
  if (!value) throw new Error("Sua sessão expirou. Entre novamente.");
  return value;
}

const addressFields = `id label recipientName postalCode street number complement neighborhood city state purposes`;
const dayFields = `closed open close`;
const selection = `slug storeName phone taxDocument photoUrl photoImageID description sellerAddresses { ${addressFields} } businessHours { monday { ${dayFields} } tuesday { ${dayFields} } wednesday { ${dayFields} } thursday { ${dayFields} } friday { ${dayFields} } saturday { ${dayFields} } sunday { ${dayFields} } } orderNotifications promotionalNotifications stockNotifications vacationMode`;

async function getSellerSettings() {
  const data = await graphQLRequest<{ mySellerSettings: SellerSettings }, Record<string, never>>(
    `query MySellerSettings { mySellerSettings { ${selection} } }`, {}, token(),
  );
  return data.mySellerSettings;
}

async function saveSellerSettings(settings: SellerSettings) {
  const input: SellerSettingsInput = {
    storeName: settings.storeName,
    phone: settings.phone,
    taxDocument: settings.taxDocument.replace(/\D/g, ""),
    photoImageID: settings.photoImageID,
    description: settings.description,
    sellerAddresses: settings.sellerAddresses,
    businessHours: settings.businessHours,
    orderNotifications: settings.orderNotifications,
    promotionalNotifications: settings.promotionalNotifications,
    stockNotifications: settings.stockNotifications,
    vacationMode: settings.vacationMode,
  };
  const data = await graphQLRequest<
    { saveSellerSettings: SellerSettings },
    { data: SellerSettingsInput }
  >(
    `mutation SaveSellerSettings($data: SellerSettingsInput!) { saveSellerSettings(data: $data) { ${selection} } }`,
    { data: input }, token(),
  );
  return data.saveSellerSettings;
}

async function uploadSellerImage(file: File) {
  const value = token();
  const body = new FormData();
  body.append("file", file);
  const apiEndpoint = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").replace(/\/$/, "");
  const response = await fetch(`${apiEndpoint}/uploads/images?purpose=SELLER_AVATAR`, {
    method: "POST", headers: { Authorization: `Bearer ${value}` }, body,
  });
  const payload = await response.json().catch(() => null) as { media?: { id: string; url: string }; error?: string } | null;
  if (!response.ok || !payload?.media) throw new Error(payload?.error ?? "Não foi possível enviar a imagem.");
  return payload.media;
}

async function uploadProductImage(file: File) {
  const value = token(); const body = new FormData(); body.append("file", file);
  const apiEndpoint = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").replace(/\/$/, "");
  const response = await fetch(`${apiEndpoint}/uploads/images?purpose=PRODUCT_IMAGE`, { method: "POST", headers: { Authorization: `Bearer ${value}` }, body });
  const payload = await response.json().catch(() => null) as { media?: { id: string; url: string }; error?: string } | null;
  if (!response.ok || !payload?.media) throw new Error(payload?.error ?? "Não foi possível enviar a imagem.");
  return payload.media;
}
async function uploadProductVideo(file: File): Promise<UploadedMedia> {
  const value = token(); const body = new FormData(); body.append("file", file);
  const apiEndpoint = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").replace(/\/$/, "");
  const response = await fetch(`${apiEndpoint}/uploads/videos`, { method: "POST", headers: { Authorization: `Bearer ${value}` }, body });
  const payload = await response.json().catch(() => null) as { media?: UploadedMedia; error?: string } | null;
  if (!response.ok || !payload?.media) throw new Error(payload?.error ?? "Não foi possível enviar o vídeo.");
  return payload.media;
}
async function getSellerProducts() {
  const data = await graphQLRequest<{ myProducts: SellerProduct[] }, Record<string, never>>(`query MyProducts { myProducts { id title gtin category description price images imageIDs videoUrl videoID variations { title options imageIDs imageUrls } bookDetails catalogAVSIN international shippingMethod } }`, {}, token());
  return data.myProducts;
}
async function findProductCatalogMatches(search: string) {
  const data = await graphQLRequest<{ productCatalogSearch: Array<{ id: string; avsin: string; title: string; gtin: string; category: string; description: string; image: string; bookDetails: string | null }> }, { search: string }>(
    `query ProductCatalogSearch($search: String!) { productCatalogSearch(search: $search) { id avsin title gtin category description image bookDetails } }`, { search }, token(),
  );
  return data.productCatalogSearch;
}
async function createSellerProduct(product: { title: string; gtin: string; catalogProductID: string | null; category: string; description: string; price: number; imageIDs: string[]; videoID: string | null; variations: Array<{ title: string; options: string[]; imageIDs: string[] }>; bookDetails: string | null; international: boolean; shippingMethod: string }) {
  const data = await graphQLRequest<{ createProduct: SellerProduct }, { data: typeof product }>(`mutation CreateProduct($data: SellerProductInput!) { createProduct(data: $data) { id title gtin category description price images imageIDs videoUrl videoID variations { title options imageIDs imageUrls } bookDetails catalogAVSIN international shippingMethod } }`, { data: product }, token());
  return data.createProduct;
}

async function updateSellerProduct(id: string, product: { title: string; gtin: string; category: string; description: string; price: number; imageIDs: string[]; videoID: string | null; variations: SellerProduct["variations"]; bookDetails: string | null; international: boolean; shippingMethod: string }) {
  const dataToSend = { ...product, variations: product.variations.map(({ title, options, imageIDs }) => ({ title, options, imageIDs })) };
  const data = await graphQLRequest<{ updateProduct: SellerProduct }, { id: string; data: typeof dataToSend }>(
    `mutation UpdateProduct($id: ID!, $data: SellerProductUpdateInput!) { updateProduct(id: $id, data: $data) { id title gtin category description price images imageIDs videoUrl videoID variations { title options imageIDs imageUrls } bookDetails catalogAVSIN international shippingMethod } }`,
    { id, data: dataToSend }, token(),
  );
  return data.updateProduct;
}

export { createSellerProduct, findProductCatalogMatches, getSellerProducts, getSellerSettings, saveSellerSettings, updateSellerProduct, uploadProductImage, uploadProductVideo, uploadSellerImage };
