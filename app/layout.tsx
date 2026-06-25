import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "GlowNest Mumbai",
  description:
    "Verified Mumbai salon discovery, transparent pricing, and AI-assisted booking.",
  areaServed: {
    "@type": "City",
    name: "Mumbai",
  },
  image: "/images/salon-hero-professional.webp",
  priceRange: "Rs. 599 - Rs. 12000",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://glownest.example",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://glownest.example"),
  title: {
    default: "GlowNest Mumbai | Beauty Booked Beautifully",
    template: "%s | GlowNest Mumbai",
  },
  description:
    "Beauty booked beautifully. Discover verified Mumbai salons, compare pricing, and book with AI-assisted matching.",
  keywords: [
    "Mumbai salon booking",
    "beauty salon marketplace",
    "bridal makeup Mumbai",
    "at home salon Mumbai",
    "hair studio Mumbai",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GlowNest Mumbai | Beauty Booked Beautifully",
    description:
      "Discover verified Mumbai salons, compare transparent pricing, shortlist favorites, and book with AI-assisted matching.",
    url: "/",
    siteName: "GlowNest Mumbai",
    images: [
      {
        url: "/images/salon-hero-professional.webp",
        width: 1200,
        height: 630,
        alt: "Premium modern beauty salon interior",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowNest Mumbai | Beauty Booked Beautifully",
    description:
      "Verified Mumbai salon discovery, transparent pricing, and AI-assisted booking.",
    images: ["/images/salon-hero-professional.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff9f7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
