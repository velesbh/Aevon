"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { blogPosts } from "@/data/blog";

export default function BlogClient() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] py-16 px-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold mb-8 text-foreground text-center">
          {language === "es" ? "Blog de Aevon" : "Aevon Blog"}
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12">
          {language === "es" 
            ? "Noticias, actualizaciones y artículos sobre creación de mundos." 
            : "News, updates, and articles on worldbuilding."}
        </p>

        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="p-6 rounded-2xl border border-border bg-card hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 transition-all">
                <div className="text-sm text-muted-foreground mb-2">
                  {new Date(post.date).toLocaleDateString(
                    language === "es" ? "es-ES" : "en-US", 
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </div>
                <h2 className="text-2xl font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-3 transition-colors">
                  {post.title[language as "en" | "es"]}
                </h2>
                <p className="text-muted-foreground">
                  {post.excerpt[language as "en" | "es"]}
                </p>
                <div className="mt-4 text-brand-600 dark:text-brand-400 font-medium text-sm flex items-center">
                  {language === "es" ? "Leer más" : "Read more"} &rarr;
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
