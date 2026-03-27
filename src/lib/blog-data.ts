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

// Client-side blog loading through server actions
export async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const { getAllBlogPostsAction } = await import('@/actions/blog-actions');
    return await getAllBlogPostsAction();
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Get single blog post
export async function getBlogPostData(slug: string): Promise<BlogPost | null> {
  try {
    const { getBlogPostAction } = await import('@/actions/blog-actions');
    return await getBlogPostAction(slug);
  } catch (error) {
    console.error('Error loading blog post:', error);
    return null;
  }
}

// Get blog post content
export async function getBlogPostContent(slug: string, language: string = 'en'): Promise<string> {
  try {
    console.log(`Fetching content for ${slug} in language: ${language}`);
    const { getBlogPostContentAction } = await import('@/actions/blog-actions');
    const content = await getBlogPostContentAction(slug, language);
    console.log(`Received content for ${slug} in ${language}:`, content ? 'found' : 'not found');
    return content || '';
  } catch (error) {
    console.error('Error loading blog content:', error);
    return '';
  }
}
