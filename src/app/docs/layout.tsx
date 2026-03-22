"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { docPages } from "@/data/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, t } = useLanguage();

  return (
    <div className="flex flex-1 w-full max-w-7xl mx-auto pt-24 pb-8 md:pt-32 px-4 sm:px-6 lg:px-8">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 pr-8 hidden md:block">
        <nav className="sticky top-24 space-y-1">
          <div className="mb-4 font-semibold text-lg text-foreground">
            {language === "es" ? "Documentación" : "Documentation"}
          </div>
          {docPages.map((page) => {
            const href = `/docs/${page.slug}`;
            const isActive = pathname === href || (pathname === "/docs" && page.slug === "introduction");
            return (
              <Link
                key={page.slug}
                href={href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {page.title[language as "en" | "es"]}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
