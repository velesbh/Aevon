"use client";

import { useLanguage } from "@/lib/i18n";
import { getBlogPostData, getBlogPostContent, type BlogPost } from "@/lib/blog-data";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export default function BlogPostClient({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        const blogPost = await getBlogPostData(slug);
        if (!blogPost) {
          notFound();
          return;
        }
        
        setPost(blogPost);
        const postContent = await getBlogPostContent(slug, language);
        setContent(postContent);
        setLoading(false);
      } catch (error) {
        console.error('Error loading blog post:', error);
        setLoading(false);
      }
    }

    loadPost();
  }, [slug, language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] py-16 px-4">
        <div className="max-w-3xl w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/4"></div>
            <div className="h-12 bg-muted rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        
        {post && (
          <>
            <div className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-4">
              {new Date(post.publishDate).toLocaleDateString(
                language === "es" ? "es-ES" : "en-US", 
                { year: 'numeric', month: 'long', day: 'numeric' }
              )}
            </div>
            
            <article className="prose prose-brand dark:prose-invert lg:prose-xl max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
