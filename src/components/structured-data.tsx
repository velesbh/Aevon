"use client";

import { useLanguage } from '@/lib/i18n';

export function StructuredData() {
  const { language } = useLanguage();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Aevon",
    "alternateName": "Aevon - Novel Planning & Writing Platform",
    "description": language === 'es' 
      ? "Aevon es una plataforma integral de planificación y construcción de mundos para novelas. Conecta tu manuscrito, mapas, personajes y trasfondo en un entorno sin distracciones."
      : "Aevon is a comprehensive novel planning and worldbuilding platform. Connect your manuscript, maps, characters, and lore in a distraction-free environment.",
    "url": "https://aevon.ink",
    "applicationCategory": "WritingSoftware",
    "operatingSystem": "Web, Windows, macOS, Linux, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "author": {
      "@type": "Organization",
      "name": "Enzonic LLC",
      "url": "https://aevon.ink"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Enzonic LLC",
      "url": "https://aevon.ink"
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": language === 'es' ? "es" : "en",
    "isFamilyFriendly": true,
    "screenshot": [
      "https://aevon.ink/dashboard.png",
      "https://aevon.ink/manuscript.png",
      "https://aevon.ink/characters dash.png",
      "https://aevon.ink/locations.png",
      "https://aevon.ink/ideas-dash.png",
      "https://aevon.ink/export.png"
    ],
    "featureList": language === 'es' ? [
      "Editor de manuscritos con @menciones",
      "Gestión de perfiles de personajes",
      "Construcción de mundos y ubicaciones",
      "Tablero de ideas rápido",
      "Motor de exportación múltiple",
      "Sincronización en la nube",
      "Soporte multi-idioma"
    ] : [
      "Manuscript editor with @mentions",
      "Character profile management",
      "World building and locations",
      "Quick ideas board",
      "Multi-format export engine",
      "Cloud synchronization",
      "Multi-language support"
    ],
    "softwareRequirements": "Modern web browser with JavaScript enabled",
    "downloadUrl": "https://apps.enzonic.com/app/fXyEGedm1ROKxz30lCCe",
    "installUrl": "https://aevon.ink/login"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
