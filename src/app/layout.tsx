import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const title = "Twibbon Video Generator";
const description =
  "Twibbon Video Generator untuk Generate Twibbon dengan Model Video";

  export const metadata: Metadata = {
    title: title,
    description: description,
    // icons: "/favico.ico",
    // keywords: [
    //   "Twibbon PKKMB Polkesma 2025",
    //   "twibbon polkesma",
    //   "twibbon polkesma 2025",
    //   "Twibbon",
    //   "PKKMB",
    //   "Polkesma",
    //   "Politeknik Negeri Malang",
    //   "Twibbon Generator",
    //   "Tahun Ajaran 2025",
    //   "2026",
    //   "Polkesma Muda 2025",
    // ],
    // alternates: {
    //   canonical: "https://twibbon-polkesma.zone.id",
    // },
    // metadataBase: new URL("https://twibbon-polkesma.zone.id"),
    // openGraph: {
    //   title: title,
    //   description: description,
    //   url: "https://twibbon-polkesma.zone.id",
    //   siteName: "twibbon-polkesma.zone.id",
    //   images: [
    //     {
    //       url: "https://twibbon-polkesma.zone.id/logos/polkesma-muda-2024.webp",
    //       width: 400,
    //       height: 400,
    //       alt: "Polkesma Twibbon's Logo",
    //     },
    //   ],
    //   type: "website",
    // },
    // twitter: {
    //   card: "summary_large_image",
    //   title: title,
    //   description: description,
    //   images: ["https://twibbon-polkesma.zone.id/logos/polkesma-muda-2024.webp"],
    // },
    robots: "index, follow",
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
