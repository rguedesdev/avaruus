export type ProductVariation = {
  id: string;
  label: string;
  options: readonly {
    id: string;
    label: string;
    available: boolean;
    image?: string;
  }[];
};

export type ProductSellerOption = {
  id: string;
  seller: string;
  sellerRating: string;
  fulfilledBy: string;
  availability: string;
  price: string;
  pixPrice: string;
  installments: string;
  selected?: boolean;
  international?: boolean;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: string;
  pixPrice: string;
  installments: string;
  image: string;
  images?: readonly string[];
  imageStyle: "catalog" | "lifestyle";
  badge: string;
  conditionLabel: string;
  soldLabel: string;
  rating: string;
  reviewCount: number;
  sku: string;
  seller: string;
  sellerRating: string;
  fulfilledBy: string;
  international?: boolean;
  discount?: string;
  description: string;
  highlights: readonly string[];
  specifications: readonly (readonly [string, string])[];
  variations?: readonly ProductVariation[];
  sellerOptions?: readonly ProductSellerOption[];
};

export const products = [
  {
    slug: "fone-bluetooth-polyvox",
    name: "Fone de Ouvido Bluetooth Polyvox",
    category: "Tecnologia",
    price: "R$ 689,90",
    discount: "26%",
    pixPrice: "R$ 655,41",
    installments: "ou 10x de R$ 68,99 sem juros",
    image: "/images/products/fone-polyvox.webp",
    imageStyle: "catalog",
    badge: "Mais vendido",
    conditionLabel: "Novo",
    soldLabel: "+100 vendidos",
    rating: "4,8",
    reviewCount: 128,
    sku: "PVX-BT900",
    seller: "Polyvox Oficial",
    sellerRating: "4,9",
    fulfilledBy: "Avaruus",
    sellerOptions: [
      { id: "polyvox", seller: "Polyvox Oficial", sellerRating: "4,9", fulfilledBy: "Avaruus", availability: "Chega entre 9 e 12 de outubro", price: "R$ 689,90", pixPrice: "R$ 655,41", installments: "ou 10x de R$ 68,99 sem juros", selected: true },
      { id: "audio-center", seller: "Audio Center", sellerRating: "4,7", fulfilledBy: "Audio Center", availability: "Chega entre 12 e 15 de outubro", price: "R$ 719,90", pixPrice: "R$ 683,91", installments: "ou 10x de R$ 71,99 sem juros", international: true },
      { id: "som-e-cia", seller: "Som & Cia", sellerRating: "4,8", fulfilledBy: "Avaruus", availability: "Chega entre 10 e 13 de outubro", price: "R$ 749,00", pixPrice: "R$ 711,55", installments: "ou 10x de R$ 74,90 sem juros" },
    ],
    description: "Som potente e conforto para acompanhar sua rotina. O fone Polyvox combina conexão Bluetooth estável, acabamento resistente e almofadas macias para horas de música, trabalho ou entretenimento.",
    highlights: [],
    specifications: [["Conectividade", "Bluetooth"], ["Cor", "Preto"], ["Microfone", "Integrado"], ["Garantia", "12 meses"]],
    variations: [
      {
        id: "color",
        label: "Cor",
        options: [
          { id: "preto", label: "Preto", available: true, image: "/images/products/fone-polyvox-preto.webp" },
          { id: "branco", label: "Branco", available: true, image: "/images/products/fone-polyvox-branco.webp" },
        ],
      },
    ],
  },
  {
    slug: "luminaria-de-mesa-lumim",
    name: "Luminária de Mesa Lumim",
    category: "Casa & decoração",
    price: "R$ 249,00",
    pixPrice: "R$ 236,55",
    installments: "ou 5x de R$ 49,80 sem juros",
    image: "/images/products/luminaria-lumim.png",
    imageStyle: "lifestyle",
    badge: "Novo",
    conditionLabel: "Novo",
    soldLabel: "+50 vendidos",
    rating: "4,9",
    reviewCount: 64,
    sku: "LUM-MESA01",
    seller: "Casa Lumim",
    sellerRating: "4,8",
    fulfilledBy: "Casa Lumim",
    description: "Uma iluminação acolhedora para leitura, trabalho ou decoração. Seu desenho minimalista e acabamento em tom café combinam com ambientes contemporâneos sem abrir mão da funcionalidade.",
    highlights: ["Luz direcionável", "Design minimalista", "Base estável", "Ideal para mesas e aparadores"],
    specifications: [["Material", "Metal"], ["Cor", "Café"], ["Uso", "Interno"], ["Garantia", "6 meses"]],
  },
  {
    slug: "tenis-nike-promin",
    name: "Tênis Nike Promin",
    category: "Moda",
    price: "R$ 399,90",
    pixPrice: "R$ 379,91",
    installments: "ou 8x de R$ 49,98 sem juros",
    image: "/images/products/tenis-nike-promin.jpg",
    imageStyle: "lifestyle",
    badge: "Frete grátis",
    conditionLabel: "Novo",
    soldLabel: "+200 vendidos",
    rating: "4,7",
    reviewCount: 93,
    sku: "NK-PRM-BLK",
    seller: "Sport Center",
    sellerRating: "4,7",
    fulfilledBy: "Avaruus",
    international: true,
    description: "Leveza e amortecimento para caminhadas e treinos do dia a dia. O cabedal respirável ajuda a manter o conforto, enquanto o solado oferece estabilidade em diferentes superfícies.",
    highlights: ["Cabedal respirável", "Amortecimento macio", "Solado aderente", "Estrutura leve"],
    specifications: [["Cor", "Preto e branco"], ["Material", "Têxtil e sintético"], ["Indicação", "Corrida e caminhada"], ["Garantia", "Contra defeito de fabricação"]],
  },
  {
    slug: "relogio-technos-steel-preto",
    name: "Relógio Technos Masculino Steel Preto",
    category: "Acessórios",
    price: "R$ 519,00",
    pixPrice: "R$ 493,05",
    installments: "ou 10x de R$ 51,90 sem juros",
    image: "/images/products/relogio-technos-steel.jpg",
    imageStyle: "catalog",
    badge: "Oferta",
    conditionLabel: "Novo",
    soldLabel: "+100 vendidos",
    rating: "4,9",
    reviewCount: 47,
    sku: "TEC-STL50-BK",
    seller: "Technos Oficial",
    sellerRating: "4,9",
    fulfilledBy: "Avaruus",
    description: "Relógio masculino com acabamento preto e visual marcante. A caixa e a pulseira em aço oferecem resistência, enquanto o mostrador de leitura clara acompanha produções casuais e sociais.",
    highlights: ["Caixa e pulseira em aço", "Calendário no mostrador", "Resistência à água de 50 m", "Máquina japonesa"],
    specifications: [["Material", "Aço"], ["Cor", "Preto"], ["Resistência à água", "50 metros"], ["Garantia", "12 meses"]],
  },
] as const satisfies readonly Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
