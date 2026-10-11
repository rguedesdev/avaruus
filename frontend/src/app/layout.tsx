import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avaruus | Encontre o que combina com você",
  description:
    "Um marketplace para descobrir produtos especiais de vendedores confiáveis.",
};

// Componentes
import { Navbar } from "@/shared/components/Navbar/page";
import { Footer } from "@/shared/components/Footer/page";
import { AuthProvider } from "@/features/auth/auth-context";
import { FavoritesProvider } from "@/features/favorites/favorites-context";

function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <FavoritesProvider>
            <Navbar />
            {children}
            <Footer />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

export default RootLayout;
