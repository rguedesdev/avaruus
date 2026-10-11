export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  imageStyle: "catalog" | "lifestyle";
  seller: string;
  fulfilledBy: string;
  variation: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
};

export const initialCartItems: CartItem[] = [
  {
    id: "offer-polyvox-black",
    slug: "fone-bluetooth-polyvox",
    name: "Fone de Ouvido Bluetooth Polyvox",
    image: "/images/products/fone-polyvox.webp",
    imageStyle: "catalog",
    seller: "Polyvox Oficial",
    fulfilledBy: "Avaruus",
    variation: "Cor: Preto",
    unitPrice: 689.9,
    quantity: 1,
    maxQuantity: 8,
  },
  {
    id: "offer-lumim-coffee",
    slug: "luminaria-de-mesa-lumim",
    name: "Luminária de Mesa Lumim",
    image: "/images/products/luminaria-lumim.png",
    imageStyle: "lifestyle",
    seller: "Casa Lumim",
    fulfilledBy: "Casa Lumim",
    variation: "Cor: Café",
    unitPrice: 249,
    quantity: 1,
    maxQuantity: 4,
  },
];
