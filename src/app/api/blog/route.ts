import { NextResponse } from 'next/server';
import { getAllBlogPosts, getBlogPost, getBlogPostContent } from '@/lib/blog-loader';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const language = searchParams.get('language') || 'en';
  const content = searchParams.get('content');

  try {
    if (slug && content === 'true') {
      // Get specific blog post content
      console.log(`API: Requesting content for ${slug} in language: ${language}`);
      const postContent = await getBlogPostContent(slug, language);
      console.log(`API: Content length for ${slug} in ${language}:`, postContent.length);
      return NextResponse.json({ content: postContent });
    } else if (slug) {
      // Get specific blog post metadata
      const post = await getBlogPost(slug);
      return NextResponse.json({ post });
    } else {
      // Get all blog posts
      const posts = await getAllBlogPosts();
      return NextResponse.json({ posts });
    }
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json(
      { error: 'Failed to load blog data' },
      { status: 500 }
    );
  }
}
