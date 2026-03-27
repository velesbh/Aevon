import { Metadata } from "next";
import Home from "@/app/page";

export const metadata: Metadata = {
  title: "Aevon - Plataforma Premium de Planificación y Escritura de Novelas",
  description: "Aevon es una plataforma integral de planificación y construcción de mundos para novelas. Conecta tu manuscrito, mapas, personajes y trasfondo en un entorno sin distracciones.",
  keywords: ["software de escritura de novelas", "app de construcción de mundos", "plataforma de escritura", "herramientas para autores", "editor de manuscritos", "escritura de ficción", "planificación RPG de mesa", "base de datos de trasfondo"],
  openGraph: {
    title: "Aevon - Plataforma Premium de Planificación y Escritura de Novelas",
    description: "Aevon es una plataforma integral de planificación y construcción de mundos para novelas. Conecta tu manuscrito, mapas, personajes y trasfondo en un entorno sin distracciones.",
    url: "https://aevon.ink/es",
    siteName: "Aevon",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/aevon.png",
        width: 1200,
        height: 630,
        alt: "Aevon - Plataforma de Planificación y Escritura de Novelas",
      },
      {
        url: "/dashboard.png",
        width: 1920,
        height: 1080,
        alt: "Panel de Aevon - Vista general del espacio de trabajo de novelas",
      },
      {
        url: "/manuscript.png",
        width: 1920,
        height: 1080,
        alt: "Editor de Manuscritos de Aevon - Escritura de texto enriquecido con @menciones",
      },
      {
        url: "/characters dash.png",
        width: 1920,
        height: 1080,
        alt: "Perfiles de Personajes de Aevon - Gestión profunda de personajes",
      },
      {
        url: "/locations.png",
        width: 1920,
        height: 1080,
        alt: "Ubicaciones de Aevon - Gestión de ubicaciones para construcción de mundos",
      },
      {
        url: "/ideas-dash.png",
        width: 1920,
        height: 1080,
        alt: "Tablero de Ideas de Aevon - Captura y organización rápida de ideas",
      },
      {
        url: "/export.png",
        width: 1920,
        height: 1080,
        alt: "Motor de Exportación de Aevon - Opciones de exportación en múltiples formatos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@AevonApp",
    creator: "@AevonApp",
    title: "Aevon - Plataforma Premium de Planificación y Escritura de Novelas",
    description: "Aevon es una plataforma integral de planificación y construcción de mundos para novelas. Conecta tu manuscrito, mapas, personajes y trasfondo.",
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
  alternates: {
    canonical: "https://aevon.ink/es",
    languages: {
      'en': "https://aevon.ink",
      'es': "https://aevon.ink/es",
    },
  },
};

export default function SpanishPage() {
  return <Home />;
}
