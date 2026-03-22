import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/header";
import ThemeRegistry from "@/components/ThemeRegistry";
import { TauriInit } from "@/components/tauri-init";

export const metadata: Metadata = {
  title: "Aevon - Novel Planning & Writing",
  description: "A premium novel planning and writing platform",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
