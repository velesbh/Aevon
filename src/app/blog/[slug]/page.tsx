import { Metadata } from "next";
import { blogPosts } from "@/data/blog";
import BlogPostClient from "./blog-post-client";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return {
      title: "Post Not Found"
    };
  }

  return {
    title: post.title.en,
    description: post.excerpt.en,
    openGraph: {
      title: post.title.en,
      description: post.excerpt.en,
      type: "article",
      publishedTime: post.date,
      url: `https://aevon.ink/blog/${slug}`,
      authors: ["Aevon"],
    },
    twitter: {
      title: post.title.en,
      description: post.excerpt.en,
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
