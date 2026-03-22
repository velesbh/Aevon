import { Metadata } from "next";
import { docPages } from "@/data/docs";
import DocSlugClient from "./doc-slug-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = docPages.find(p => p.slug === slug);

  if (!page) {
    return {
      title: "Page Not Found"
    };
  }

  // Assuming English description by parsing first few words of content or just generic
  const excerpt = "Explore the Aevon documentation: " + page.title.en;

  return {
    title: page.title.en,
    description: excerpt,
    openGraph: {
      title: `${page.title.en} - Aevon Documentation`,
      description: excerpt,
      url: `https://aevon.ink/docs/${slug}`,
      type: "article",
    },
    twitter: {
      title: `${page.title.en} - Aevon Documentation`,
      description: excerpt,
    },
    alternates: {
      canonical: `https://aevon.ink/docs/${slug}`,
      languages: {
        'en': `https://aevon.ink/docs/${slug}`,
        'es': `https://aevon.ink/es/docs/${slug}`,
      },
    },
  };
}

export default async function DocSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DocSlugClient slug={slug} />;
}
