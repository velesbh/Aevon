// This file contains only the types and client-side functions
// No server-side imports here

export type Locale = "en" | "es";

export interface BlogPost {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  publishDate: string;
  category: string;
  tags: string[];
  draft: boolean;
  heroImage?: string;
  content?: Record<Locale, string>;
}

// Client-side blog loading through static data
export async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const { getStaticBlogPosts } = await import('@/data/static-blog-data');
    return getStaticBlogPosts();
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Get single blog post
export async function getBlogPostData(slug: string): Promise<BlogPost | null> {
  try {
    const { getStaticBlogPost } = await import('@/data/static-blog-data');
    return getStaticBlogPost(slug);
  } catch (error) {
    console.error('Error loading blog post:', error);
    return null;
  }
}

// Get blog post content
export async function getBlogPostContent(slug: string, language: string = 'en'): Promise<string> {
  try {
    const { getStaticBlogPostContent } = await import('@/data/static-blog-data');
    const content = getStaticBlogPostContent(slug, language);
    return content || '';
  } catch (error) {
    console.error('Error loading blog content:', error);
    return '';
  }
}
