import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import type { Metadata } from "next";
import { baseUrl } from "@/lib/site";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: {
    default: "Elara Atelier | Catálogo",
    template: "%s | Elara Atelier",
  },
  description: "Catálogo público de Elara Atelier. Moda y prendas por talla y color.",
  openGraph: {
    type: "website",
    siteName: "Elara Atelier",
    title: "Elara Atelier | Catálogo",
    description: "Catálogo público de Elara Atelier. Moda y prendas por talla y color.",
    url: "/catalogo",
    images: [
      // crea luego un archivo en /public/og-default.jpg (o png)
      { url: "/og-default.jpg", width: 1200, height: 630, alt: "Elara Atelier" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elara Atelier | Catálogo",
    description: "Catálogo público de Elara Atelier.",
    images: ["/og-default.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
