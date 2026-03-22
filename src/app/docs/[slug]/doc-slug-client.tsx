"use client";

import { useLanguage } from "@/lib/i18n";
import { docPages } from "@/data/docs";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";

export default function DocSlugClient({ slug }: { slug: string }) {
  const { language } = useLanguage();
  
  const page = docPages.find(p => p.slug === slug);

  if (!page) {
    notFound();
  }

  const content = page.content[language as "en" | "es"];

  return (
    <div className="prose prose-brand dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
