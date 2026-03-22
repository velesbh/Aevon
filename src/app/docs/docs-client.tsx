"use client";

import { useLanguage } from "@/lib/i18n";
import { docPages } from "@/data/docs";
import ReactMarkdown from "react-markdown";

export default function DocsClient() {
  const { language } = useLanguage();
  const introPage = docPages.find(p => p.slug === "introduction");

  if (!introPage) return null;

  const content = introPage.content[language as "en" | "es"];

  return (
    <div className="prose prose-brand dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
