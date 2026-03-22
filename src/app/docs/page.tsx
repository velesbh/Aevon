import { Metadata } from "next";
import DocsClient from "./docs-client";
import { docPages } from "@/data/docs";

export function generateMetadata(): Metadata {
  const introPage = docPages.find(p => p.slug === "introduction");
  return {
    title: "Documentation",
    description: "Learn how to use Aevon, the premium novel planning and worldbuilding platform. Explore our guides and tutorials.",
    openGraph: {
      title: "Aevon Documentation",
      description: "Learn how to use Aevon, the premium novel planning and worldbuilding platform. Explore our guides and tutorials.",
      url: "https://aevon.ink/docs",
      type: "website",
    },
    twitter: {
      title: "Aevon Documentation",
      description: "Learn how to use Aevon, the premium novel planning and worldbuilding platform. Explore our guides and tutorials.",
    }
  };
}

export default function DocsPage() {
  return <DocsClient />;
}
