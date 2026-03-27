export const dynamic = "force-static";

export function GET() {
  const baseUrl = 'https://aevon.ink';

  const images = [
    { url: '/aevon.png', title: 'Aevon Logo', caption: 'Aevon novel planning and worldbuilding platform logo' },
    { url: '/dashboard.png', title: 'Aevon Dashboard', caption: 'Complete novel workspace overview with all tools integrated' },
    { url: '/manuscript.png', title: 'Manuscript Editor', caption: 'Rich text editor with @mentions for linking characters, locations, and lore' },
    { url: '/characters%20dash.png', title: 'Character Profiles', caption: 'Deep character management with portraits, backstory, and relationships' },
    { url: '/locations.png', title: 'Locations Manager', caption: 'World building location management with maps and details' },
    { url: '/ideas-dash.png', title: 'Ideas Board', caption: 'Quick idea capture and organization for creative inspiration' },
    { url: '/export.png', title: 'Export Engine', caption: 'Multi-format export supporting PDF, Word, ePub, and Markdown' },
  ];

  const imageXml = (imgs: typeof images) =>
    imgs.map(img => `
    <image:image>
      <image:loc>${baseUrl}${img.url}</image:loc>
      <image:title>${img.title}</image:title>
      <image:caption>${img.caption}</image:caption>
    </image:image>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>${imageXml(images)}
  </url>
  <url>
    <loc>${baseUrl}/es</loc>${imageXml(images)}
  </url>
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
