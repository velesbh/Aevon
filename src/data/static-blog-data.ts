import { getAllBlogPosts, getBlogPost, getBlogPostContent } from '@/lib/blog-loader';
import { type BlogPost } from '@/lib/blog-data';

// Generate static blog data at build time
export async function generateStaticBlogData() {
  const posts = await getAllBlogPosts();
  const postsWithContent = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      fullContent: {
        en: await getBlogPostContent(post.slug, 'en'),
        es: await getBlogPostContent(post.slug, 'es')
      }
    }))
  );
  
  return postsWithContent;
}

// Static blog data (will be populated at build time)
export let staticBlogPosts: BlogPost[] = [];

// Initialize static data
export async function initializeStaticBlogData() {
  if (staticBlogPosts.length === 0) {
    staticBlogPosts = await getAllBlogPosts();
  }
  return staticBlogPosts;
}

// Get static blog posts
export function getStaticBlogPosts(): BlogPost[] {
  return staticBlogPosts;
}

// Get static blog post
export function getStaticBlogPost(slug: string): BlogPost | null {
  return staticBlogPosts.find(post => post.slug === slug) || null;
}

// Get static blog post content
export function getStaticBlogPostContent(slug: string, language: string = 'en'): string {
  const post = getStaticBlogPost(slug);
  if (!post) return '';
  
  return post.content?.[language as 'en' | 'es'] || '';
}
