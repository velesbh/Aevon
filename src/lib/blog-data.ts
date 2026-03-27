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

// Client-side blog loading through API
export async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('/api/blog');
    if (!response.ok) {
      throw new Error('Failed to load blog posts');
    }
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Get single blog post
export async function getBlogPostData(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/api/blog?slug=${slug}`);
    if (!response.ok) {
      throw new Error('Failed to load blog post');
    }
    const data = await response.json();
    return data.post || null;
  } catch (error) {
    console.error('Error loading blog post:', error);
    return null;
  }
}

// Get blog post content
export async function getBlogPostContent(slug: string, language: string = 'en'): Promise<string> {
  try {
    console.log(`Fetching content for ${slug} in language: ${language}`);
    const response = await fetch(`/api/blog?slug=${slug}&language=${language}&content=true`);
    if (!response.ok) {
      throw new Error('Failed to load blog content');
    }
    const data = await response.json();
    console.log(`Received content for ${slug} in ${language}:`, data.content ? 'found' : 'not found');
    return data.content || '';
  } catch (error) {
    console.error('Error loading blog content:', error);
    return '';
  }
}
