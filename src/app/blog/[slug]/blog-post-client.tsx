"use client";

import { useLanguage } from "@/lib/i18n";
import { blogPosts } from "@/data/blog";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";

export default function BlogPostClient({ slug }: { slug: string }) {
  const { language } = useLanguage();
  
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    notFound();
  }

  const content = post.content[language as "en" | "es"];

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] py-16 px-4">
      <div className="max-w-3xl w-full">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === "es" ? "Volver al Blog" : "Back to Blog"}
        </Link>
        
        <div className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-4">
          {new Date(post.date).toLocaleDateString(
            language === "es" ? "es-ES" : "en-US", 
            { year: 'numeric', month: 'long', day: 'numeric' }
          )}
        </div>
        
        <article className="prose prose-brand dark:prose-invert lg:prose-xl max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
