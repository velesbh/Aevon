import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/header";
import ThemeRegistry from "@/components/ThemeRegistry";
import { TauriInit } from "@/components/tauri-init";
import { initializeStaticBlogData } from "@/data/static-blog-data";

initializeStaticBlogData();

export const metadata: Metadata = {
  metadataBase: new URL('https://aevon.ink'),
  title: {
    template: "%s | Aevon",
    default: "Aevon - Premium Novel Planning & Writing Platform",
  },
  description: "Aevon is a comprehensive novel planning and worldbuilding platform. Connect your manuscript, maps, characters, and lore in a distraction-free environment.",
  keywords: ["novel writing software", "worldbuilding app", "writing platform", "author tools", "manuscript editor", "fiction writing", "tabletop RPG planning", "lore database"],
  authors: [{ name: "Aevon Team", url: "https://aevon.ink" }],
  creator: "Aevon",
  publisher: "Aevon",
  openGraph: {
    title: "Aevon - Premium Novel Planning & Writing Platform",
    description: "Aevon is a comprehensive novel planning and worldbuilding platform. Connect your manuscript, maps, characters, and lore in a distraction-free environment.",
    url: "https://aevon.ink",
    siteName: "Aevon",
    locale: "en_US",
    alternateLocale: "es_ES",
    type: "website",
    images: [
      {
        url: "/aevon.png",
        width: 1200,
        height: 630,
        alt: "Aevon - Novel Planning & Writing Platform",
      },
      {
        url: "/dashboard.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Dashboard - Complete novel workspace overview",
      },
      {
        url: "/manuscript.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Manuscript Editor - Rich text writing with @mentions",
      },
      {
        url: "/characters dash.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Character Profiles - Deep character management",
      },
      {
        url: "/locations.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Locations - World building location management",
      },
      {
        url: "/ideas-dash.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Ideas Board - Quick idea capture and organization",
      },
      {
        url: "/export.png",
        width: 1920,
        height: 1080,
        alt: "Aevon Export Engine - Multi-format export options",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@AevonApp",
    creator: "@AevonApp",
    title: "Aevon - Premium Novel Planning & Writing Platform",
    description: "Aevon is a comprehensive novel planning and worldbuilding platform. Connect your manuscript, maps, characters, and lore.",
    images: [
      "/aevon.png",
      "/dashboard.png",
      "/manuscript.png",
      "/characters dash.png",
      "/locations.png",
      "/ideas-dash.png",
      "/export.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://aevon.ink",
    languages: {
      'en': "https://aevon.ink",
      'es': "https://aevon.ink/es",
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/icon-192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/icon-512.png",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Aevon",
  "operatingSystem": "Web, Windows, macOS, Linux, iOS, Android",
  "applicationCategory": "WritingSoftware",
  "description": "A comprehensive novel planning and worldbuilding platform for authors and writers.",
  "url": "https://aevon.ink",
  "publisher": {
    "@type": "Organization",
    "name": "Aevon"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-[100dvh] bg-[var(--background-app)] flex flex-col overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeRegistry>
            <TauriInit />
            <LanguageProvider>
              <Header />
              <main className="flex-1 w-full flex flex-col">
                {children}
              </main>
            </LanguageProvider>
          </ThemeRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
