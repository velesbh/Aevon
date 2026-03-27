'use server';

import { getAllBlogPosts, getBlogPost, getBlogPostContent } from '@/lib/blog-loader';
import { type BlogPost } from '@/lib/blog-data';

export async function getAllBlogPostsAction(): Promise<BlogPost[]> {
  return await getAllBlogPosts();
}

export async function getBlogPostAction(slug: string): Promise<BlogPost | null> {
  return await getBlogPost(slug);
}

export async function getBlogPostContentAction(slug: string, language: string = 'en'): Promise<string> {
  return await getBlogPostContent(slug, language);
}
