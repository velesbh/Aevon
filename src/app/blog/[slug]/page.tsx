import { Metadata } from "next";
import { blogPosts, getBlogPost } from "@/data/generated-blog-data";
import { type BlogPost } from "@/lib/blog-data";
import BlogPostClient from "./blog-post-client";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found - Aevon Blog",
      description: "The requested blog post could not be found on the Aevon blog."
    };
  }

  const title = post.title.en;
  const description = post.description.en;
  const keywords = [
    ...(post.tags || []),
    "writing guide",
    "author tips",
    "worldbuilding",
    "character development",
    "novel writing",
    "fiction writing",
    "storytelling",
    "creative writing",
    "aevon"
  ];

  return {
    title: `${title} | Aevon Blog`,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title: `${title} | Aevon Blog`,
      description,
      type: "article",
      publishedTime: post.publishDate,
      modifiedTime: post.publishDate,
      url: `https://aevon.ink/blog/${slug}`,
      siteName: "Aevon",
      locale: "en_US",
      authors: ["Aevon Team"],
      section: "Blog",
      tags: post.tags || [],
      images: post.heroImage ? [
        {
          url: post.heroImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [
        {
          url: "/aevon.png",
          width: 1200,
          height: 630,
          alt: "Aevon - Novel Planning & Writing Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@AevonApp",
      creator: "@AevonApp",
      title: `${title} | Aevon Blog`,
      description,
      images: post.heroImage ? [post.heroImage] : ["/aevon.png"],
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
      canonical: `https://aevon.ink/blog/${slug}`,
      languages: {
        'en': `https://aevon.ink/blog/${slug}`,
        'es': `https://aevon.ink/es/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
