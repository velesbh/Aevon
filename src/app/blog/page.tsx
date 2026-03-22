import { Metadata } from "next";
import BlogClient from "./blog-client";

export function generateMetadata(): Metadata {
  return {
    title: "Blog",
    description: "Read the latest news, updates, and articles about worldbuilding on the Aevon Blog.",
    openGraph: {
      title: "Aevon Blog - News & Worldbuilding Articles",
      description: "Read the latest news, updates, and articles about worldbuilding on the Aevon Blog.",
      url: "https://aevon.ink/blog",
      type: "website",
    },
    twitter: {
      title: "Aevon Blog - News & Worldbuilding Articles",
      description: "Read the latest news, updates, and articles about worldbuilding on the Aevon Blog.",
    }
  };
}

export default function BlogIndexPage() {
  return <BlogClient />;
}
