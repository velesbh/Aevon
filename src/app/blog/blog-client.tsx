"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { loadBlogPosts, type BlogPost } from "@/lib/blog-data";
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, Tag, X } from "lucide-react";

const POSTS_PER_PAGE = 6;

export default function BlogClient() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Load blog posts on component mount
  useEffect(() => {
    loadBlogPosts().then(loadedPosts => {
      setPosts(loadedPosts);
      setLoading(false);
    });
  }, []);

  // Extract all unique tags from blog posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    if (!Array.isArray(posts)) return [];
    
    posts.forEach(post => {
      // Use actual tags from frontmatter, plus some common ones
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tags.add(tag));
      }
      // Also extract common tags from title/description
      const text = `${post.title.en} ${post.description.en}`.toLowerCase();
      const commonTags = ["writing", "characters", "worldbuilding", "plot", "dialogue", "editing", "romance", "description", "tips", "guide"];
      commonTags.forEach(tag => {
        if (text.includes(tag)) tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [posts]);

  // Filter and search posts
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    return posts.filter(post => {
      const matchesSearch = searchQuery === "" || 
        post.title[language as "en" | "es"].toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description[language as "en" | "es"].toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag === "" || 
        (post.tags && post.tags.includes(selectedTag)) ||
        post.title[language as "en" | "es"].toLowerCase().includes(selectedTag.toLowerCase()) ||
        post.description[language as "en" | "es"].toLowerCase().includes(selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    });
  }, [posts, searchQuery, selectedTag, language]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== "" || selectedTag !== "";

  if (loading) {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] py-16 px-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4 text-foreground">
            {language === "es" ? "Blog de Aevon" : "Aevon Blog"}
          </h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] py-16 px-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4 text-foreground">
            {language === "es" ? "Blog de Aevon" : "Aevon Blog"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === "es" 
              ? "Guías, tutoriales e insights para escritores y creadores de mundos." 
              : "Guides, tutorials, and insights for writers and worldbuilders."}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={language === "es" ? "Buscar artículos..." : "Search articles..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">{language === "es" ? "Todas las etiquetas" : "All tags"}</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {language === "es" ? "Limpiar" : "Clear"}
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-sm flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTag && (
                <span className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-sm flex items-center gap-1">
                  Tag: {selectedTag}
                  <button onClick={() => { setSelectedTag(""); setCurrentPage(1); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-muted-foreground">
          {filteredPosts.length === 0 ? (
            <p>{language === "es" ? "No se encontraron artículos." : "No articles found."}</p>
          ) : (
            <p>
              {language === "es" 
                ? `Mostrando ${Math.min(startIndex + 1, filteredPosts.length)}-${Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length)} de ${filteredPosts.length} artículos`
                : `Showing ${Math.min(startIndex + 1, filteredPosts.length)}-${Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length)} of ${filteredPosts.length} articles`
              }
            </p>
          )}
        </div>

        {/* Blog Posts Grid */}
        {paginatedPosts.length > 0 ? (
          <div className="grid gap-6 mb-8">
            {paginatedPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="p-6 rounded-2xl border border-border bg-card hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.publishDate).toLocaleDateString(
                        language === "es" ? "es-ES" : "en-US", 
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </div>
                    <div className="flex gap-2">
                      {allTags.filter(tag => 
                        post.title[language as "en" | "es"].toLowerCase().includes(tag) ||
                        post.description[language as "en" | "es"].toLowerCase().includes(tag)
                      ).slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-3 transition-colors">
                    {post.title[language as "en" | "es"]}
                  </h2>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.description[language as "en" | "es"]}
                  </p>
                  <div className="text-brand-600 dark:text-brand-400 font-medium text-sm flex items-center">
                    {language === "es" ? "Leer más" : "Read more"} &rarr;
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {language === "es" ? "No se encontraron artículos" : "No articles found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === "es" 
                ? "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
            >
              {language === "es" ? "Limpiar filtros" : "Clear filters"}
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-brand-600 text-white"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
