export type BookFormatId = "ebook" | "audiobook" | "paperback" | "hardcover";

export type BookOffer = {
  id: string;
  seller: string;
  sellerRating: string;
  fulfilledBy: string;
  price: string;
  installments: string;
  availability: string;
  international?: boolean;
};

export type BookFormat = {
  id: BookFormatId;
  label: string;
  detail: string;
  isbn: string;
  digital: boolean;
  editionDetails?: readonly (readonly [string, string])[];
  offers: readonly BookOffer[];
};

export type Book = {
  slug: string;
  title: string;
  author: string;
  series: string;
  seriesPosition: string;
  category: string;
  image: string;
  images?: readonly string[];
  rating: string;
  reviewCount: number;
  soldLabel: string;
  discount?: string;
  description: string;
  publisher: string;
  publicationDate: string;
  language: string;
  pages: string;
  translator: string;
  collaborators?: readonly { name: string; role: string }[];
  formats: readonly BookFormat[];
};

export const books = [
  {
    slug: "quarta-asa",
    title: "Quarta Asa",
    author: "Rebecca Yarros",
    series: "O Empyriano",
    seriesPosition: "Livro 1 de 3",
    category: "Fantasia",
    image: "/images/books/quarta-asa.jpg",
    rating: "4,8",
    reviewCount: 2_184,
    soldLabel: "+10 mil vendidos",
    discount: "26%",
    description:
      "Violet Sorrengail esperava uma vida entre livros, mas é obrigada a disputar um lugar entre cavaleiros de dragões. Em Basgiath, um colégio de guerra onde poucos sobrevivem, inteligência, alianças e coragem serão tão importantes quanto força. Para permanecer ali, Violet precisa enfrentar treinamentos brutais, competidores determinados e provas que exigem decisões rápidas. Sua fragilidade física, vista por muitos como uma sentença, também a obriga a observar cada detalhe...",
    publisher: "Planeta Minotauro",
    publicationDate: "1 de março de 2024",
    language: "Português",
    pages: "544 páginas",
    translator: "Laura Pohl",
    formats: [
      {
        id: "ebook",
        label: "E-book",
        detail: "EPUB",
        isbn: "978-85-422-2613-3",
        digital: true,
        editionDetails: [
          ["Idade de leitura", "16 anos e acima"],
          ["Acessibilidade", "Recursos disponíveis"],
          ["Tamanho do arquivo", "9.9 MB"],
          ["Nome da série", "The Empyrean"],
          ["Livro na coleção", "Livro 1 de 3"],
          ["Número de páginas", "806 páginas"],
          ["Idioma", "Português"],
          ["Editora", "Planeta Minotauro"],
          ["Data da publicação", "18 março 2024"],
          ["Configuração de fonte", "Habilitado"],
        ],
        offers: [
          {
            id: "ebook-avaruus",
            seller: "Avaruus Livros",
            sellerRating: "4,9",
            fulfilledBy: "Avaruus",
            price: "R$ 49,90",
            installments: "Pagamento no Pix",
            availability: "Disponível na biblioteca logo após a aprovação",
          },
        ],
      },
      {
        id: "audiobook",
        label: "Audiobook",
        detail: "Áudio digital",
        isbn: "978-85-422-2831-1",
        digital: true,
        editionDetails: [
          ["Nome da série", "The Empyrean"],
          ["Livro na coleção", "Livro 1 de 3"],
          ["Duração do título", "24 horas e 33 minutos"],
          ["Idioma", "Português"],
          ["Editora", "Planeta Minotauro"],
          ["Data da publicação", "21 agosto 2024"],
          ["Narrador", "Caio Passos"],
          ["Tamanho do arquivo", "9.9 MB"],
          ["Versão", "Versão integral"],
          ["Tipo de programa", "Audiolivro"],
        ],
        offers: [
          {
            id: "audio-avaruus",
            seller: "Avaruus Livros",
            sellerRating: "4,9",
            fulfilledBy: "Avaruus",
            price: "R$ 69,90",
            installments: "Pagamento no Pix",
            availability: "Disponível na biblioteca logo após a aprovação",
          },
        ],
      },
      {
        id: "paperback",
        label: "Capa comum",
        detail: "Livro físico",
        isbn: "978-85-422-2585-3",
        digital: false,
        editionDetails: [
          ["Nome da série", "O Empyriano"],
          ["Livro na coleção", "Livro 1 de 3"],
          ["Número de páginas", "544 páginas"],
          ["Idioma", "Português"],
          ["Editora", "Planeta Minotauro"],
          ["Data da publicação", "1 março 2024"],
          ["Idade de leitura", "16 anos e acima"],
          ["Dimensões", "16 × 23 cm"],
          ["ISBN-10", "8542225856"],
          ["ISBN-13", "978-85-422-2585-3"],
        ],
        offers: [
          {
            id: "paperback-books",
            seller: "Books & Co.",
            sellerRating: "4,7",
            fulfilledBy: "Books & Co.",
            price: "R$ 74,50",
            installments: "ou 2x de R$ 37,25 sem juros",
            availability: "Chega entre 13 e 16 de outubro",
            international: true,
          },
          {
            id: "paperback-planeta",
            seller: "Livraria Planeta",
            sellerRating: "4,9",
            fulfilledBy: "Avaruus",
            price: "R$ 79,90",
            installments: "ou 3x de R$ 26,63 sem juros",
            availability: "Chega entre 9 e 12 de outubro",
          },
        ],
      },
      {
        id: "hardcover",
        label: "Capa dura",
        detail: "Livro físico",
        isbn: "978-85-422-2587-7",
        digital: false,
        editionDetails: [
          ["Nome da série", "O Empyriano"],
          ["Livro na coleção", "Livro 1 de 3"],
          ["Número de páginas", "544 páginas"],
          ["Idioma", "Português"],
          ["Editora", "Planeta Minotauro"],
          ["Data da publicação", "1 março 2024"],
          ["Idade de leitura", "16 anos e acima"],
          ["Dimensões", "16 × 23 cm"],
          ["ISBN-10", "8542225872"],
          ["ISBN-13", "978-85-422-2587-7"],
        ],
        offers: [
          {
            id: "hardcover-planeta",
            seller: "Livraria Planeta",
            sellerRating: "4,9",
            fulfilledBy: "Avaruus",
            price: "R$ 119,90",
            installments: "ou 5x de R$ 23,98 sem juros",
            availability: "Chega entre 9 e 12 de outubro",
            international: true,
          },
        ],
      },
    ],
  },
  {
    slug: "edgar-allan-poe-medo-classico",
    title: "Edgar Allan Poe: Medo Clássico",
    author: "Edgar Allan Poe",
    series: "Medo Clássico",
    seriesPosition: "Volume 1",
    category: "Terror e suspense",
    image: "/images/books/edgar-allan-poe-medo-classico-01.webp",
    images: [
      "/images/books/edgar-allan-poe-medo-classico-01.webp",
      "/images/books/edgar-allan-poe-medo-classico-02.webp",
    ],
    rating: "4,9",
    reviewCount: 738,
    soldLabel: "+1 mil vendidos",
    description:
      "Uma seleção de contos e poemas que percorre as muitas faces do mestre do horror e do mistério. A edição reúne narrativas de morte, crimes, aventuras e os casos do detetive Auguste Dupin, além de diferentes traduções de O Corvo e ilustrações em xilogravura.",
    publisher: "Planeta Minotauro",
    publicationDate: "2017",
    language: "Português",
    pages: "384 páginas",
    translator: "Marcia Heloisa",
    formats: [
      {
        id: "hardcover",
        label: "Capa dura",
        detail: "Livro físico",
        isbn: "978-85-9454-024-9",
        digital: false,
        editionDetails: [
          ["Nome da série", "Medo Clássico"],
          ["Livro na coleção", "Volume 1"],
          ["Número de páginas", "384 páginas"],
          ["Idioma", "Português"],
          ["Editora", "Planeta Minotauro"],
          ["Data da publicação", "2017"],
          ["Tradução", "Marcia Heloisa"],
          ["Dimensões", "16,3 × 23,8 cm"],
          ["ISBN-10", "8594540248"],
          ["ISBN-13", "978-85-9454-024-9"],
        ],
        offers: [
          {
            id: "hardcover-darkside",
            seller: "DarkSide Books",
            sellerRating: "4,9",
            fulfilledBy: "Avaruus",
            price: "R$ 99,90",
            installments: "ou 4x de R$ 24,98 sem juros",
            availability: "Chega entre 9 e 12 de outubro",
            international: true,
          },
        ],
      },
    ],
  },
] as const satisfies readonly Book[];

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((book) => book.slug === slug);
}
