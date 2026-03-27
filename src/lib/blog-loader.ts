import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  publishDate: string;
  category: string;
  tags: string[];
  draft: boolean;
  heroImage?: string;
  content?: Record<string, string>;
}

const BLOG_DIR = path.join(process.cwd(), 'src/app/blog');
const ES_BLOG_DIR = path.join(process.cwd(), 'src/app/es/blog');

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const englishPosts = getBlogPostsFromDir(BLOG_DIR);
  const spanishPosts = getBlogPostsFromDir(ES_BLOG_DIR);
  
  // Merge English and Spanish content
  const mergedPosts = englishPosts.map(enPost => {
    const esPost = spanishPosts.find(es => es.slug === enPost.slug);
    
    // Helper function to extract string value from potentially nested structure
    const extractStringValue = (value: any): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null) {
        return value.en || value.es || Object.values(value)[0] || '';
      }
      return String(value || '');
    };
    
    return {
      ...enPost,
      title: {
        en: extractStringValue(enPost.title),
        es: esPost ? extractStringValue(esPost.title) : extractStringValue(enPost.title)
      },
      description: {
        en: extractStringValue(enPost.description),
        es: esPost ? extractStringValue(esPost.description) : extractStringValue(enPost.description)
      },
      content: {
        en: extractStringValue(enPost.content),
        es: esPost ? extractStringValue(esPost.content) : extractStringValue(enPost.content)
      }
    };
  }) as BlogPost[];

  // Filter out AI-related posts
  const filteredPosts = mergedPosts.filter(post => {
    const title = (post.title.en + ' ' + post.title.es).toLowerCase();
    const description = (post.description.en + ' ' + post.description.es).toLowerCase();
    return !title.includes('ai') && !description.includes('ai') && !title.includes('artificial') && !description.includes('artificial');
  });

  // Sort by date
  return filteredPosts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

function getBlogPostsFromDir(dir: string): BlogPost[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  const posts: BlogPost[] = [];

  for (const file of files) {
    if (file.endsWith('.md') && file !== 'README.md') {
      const filePath = path.join(dir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);
      
      const slug = file.replace('.md', '');
      
      // Determine language from directory path
      const isSpanish = dir.includes('/es/blog');
      const lang = isSpanish ? 'es' : 'en';
      
      posts.push({
        slug,
        title: { [lang]: data.title || slug },
        description: { [lang]: data.description || '' },
        publishDate: data.publishDate || data.date || new Date().toISOString().split('T')[0],
        category: data.category || 'Tips',
        tags: data.tags || [],
        draft: data.draft || false,
        heroImage: data.heroImage,
        content: { [lang]: content }
      });
    }
  }

  return posts;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find(post => post.slug === slug) || null;
}

export async function getBlogPostContent(slug: string, language: string = 'en'): Promise<string> {
  console.log(`Loader: Getting content for ${slug} in ${language}`);
  const post = await getBlogPost(slug);
  if (!post) {
    console.log(`Loader: Post ${slug} not found`);
    return '';
  }
  
  // Try to get content from the merged data first
  if (post.content && post.content[language]) {
    console.log(`Loader: Found merged content for ${slug} in ${language}`);
    return post.content[language];
  }
  
  // Fallback to reading the file directly
  const dir = language === 'es' ? ES_BLOG_DIR : BLOG_DIR;
  const filePath = path.join(dir, `${slug}.md`);
  console.log(`Loader: Looking for file at ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    console.log(`Loader: File found, reading content`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { content } = matter(fileContent);
    console.log(`Loader: Content length from file: ${content.length}`);
    return content;
  } else {
    console.log(`Loader: File not found at ${filePath}`);
  }
  
  return '';
}
