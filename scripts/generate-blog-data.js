const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOG_DIR = path.join(process.cwd(), 'src/app/blog');
const ES_BLOG_DIR = path.join(process.cwd(), 'src/app/es/blog');

function getBlogPostsFromDir(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  const posts = [];

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

function extractStringValue(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value.en || value.es || Object.values(value)[0] || '';
  }
  return String(value || '');
}

function getAllBlogPosts() {
  const englishPosts = getBlogPostsFromDir(BLOG_DIR);
  const spanishPosts = getBlogPostsFromDir(ES_BLOG_DIR);
  
  // Merge English and Spanish content
  const mergedPosts = englishPosts.map(enPost => {
    const esPost = spanishPosts.find(es => es.slug === enPost.slug);
    
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
  });

  // Filter out AI-related posts
  const filteredPosts = mergedPosts.filter(post => {
    const title = (post.title.en + ' ' + post.title.es).toLowerCase();
    const description = (post.description.en + ' ' + post.description.es).toLowerCase();
    return !title.includes('ai') && !description.includes('ai') && !title.includes('artificial') && !description.includes('artificial');
  });

  // Sort by date
  return filteredPosts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

// Generate the static blog data
const blogPosts = getAllBlogPosts();
const outputPath = path.join(process.cwd(), 'src/data/generated-blog-data.ts');

const content = `// Auto-generated blog data - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

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

export const blogPosts: BlogPost[] = ${JSON.stringify(blogPosts, null, 2)};

export function getBlogPost(slug: string): BlogPost | null {
  return blogPosts.find(post => post.slug === slug) || null;
}

export function getBlogPostContent(slug: string, language: string = 'en'): string {
  const post = getBlogPost(slug);
  if (!post) return '';
  
  return post.content?.[language as 'en' | 'es'] || '';
}
`;

fs.writeFileSync(outputPath, content);
console.log(`Generated blog data with ${blogPosts.length} posts`);
console.log(`Output: ${outputPath}`);
