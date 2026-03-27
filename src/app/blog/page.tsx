import { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog-loader";
import { type BlogPost } from "@/lib/blog-data";
import BlogClient from "./blog-client";

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getAllBlogPosts();
  const latestPost = posts[0];
  
  return {
    title: "Aevon Blog - Writing Guides, Tutorials & Worldbuilding Tips",
    description: `Discover comprehensive writing guides, worldbuilding tutorials, and author tips. ${posts.length} articles covering character development, plot structure, dialogue writing, and more.`,
    keywords: [
      "writing blog",
      "author tips", 
      "worldbuilding guide",
      "character development",
      "plot structure",
      "dialogue writing",
      "novel writing",
      "fiction writing",
      "storytelling techniques",
      "writing software",
      "creative writing",
      "author resources"
    ],
    openGraph: {
      title: "Aevon Blog - Writing Guides & Worldbuilding Tutorials",
      description: `Discover comprehensive writing guides, worldbuilding tutorials, and author tips. ${posts.length} articles covering character development, plot structure, dialogue writing, and more.`,
      url: "https://aevon.ink/blog",
      type: "website",
      siteName: "Aevon",
      locale: "en_US",
      images: [
        {
          url: "/aevon.png",
          width: 1200,
          height: 630,
          alt: "Aevon Blog - Writing Guides & Worldbuilding Tutorials",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@AevonApp",
      creator: "@AevonApp",
      title: "Aevon Blog - Writing Guides & Worldbuilding Tutorials",
      description: `Discover comprehensive writing guides, worldbuilding tutorials, and author tips. ${posts.length} articles covering character development, plot structure, dialogue writing, and more.`,
      images: ["/aevon.png"],
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
      canonical: "https://aevon.ink/blog",
      languages: {
        'en': "https://aevon.ink/blog",
        'es': "https://aevon.ink/es/blog",
      },
    },
  };
}

export default function BlogIndexPage() {
  return <BlogClient />;
}
