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

// Client-side blog loading through generated data
export async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const { blogPosts } = await import('@/data/generated-blog-data');
    return blogPosts;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Get single blog post
export async function getBlogPostData(slug: string): Promise<BlogPost | null> {
  try {
    const { getBlogPost } = await import('@/data/generated-blog-data');
    return getBlogPost(slug);
  } catch (error) {
    console.error('Error loading blog post:', error);
    return null;
  }
}

// Get blog post content
export async function getBlogPostContent(slug: string, language: string = 'en'): Promise<string> {
  try {
    const { getBlogPostContent } = await import('@/data/generated-blog-data');
    const content = getBlogPostContent(slug, language);
    return content || '';
  } catch (error) {
    console.error('Error loading blog content:', error);
    return '';
  }
}
