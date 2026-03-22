import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.1";

type ExportFormat = "pdf" | "epub" | "docx" | "md";

interface ExportRequestPayload {
  projectId: string;
  format: ExportFormat;
  options: {
    standardManuscriptFormat: boolean;
    includeTableOfContents: boolean;
    includeTitlePage: boolean;
  };
}

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
}

interface ChapterRow {
  id: string;
  title: string;
  content: unknown;
  word_count: number;
  order_index: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function ensureFormat(value: string): value is ExportFormat {
  return value === "pdf" || value === "epub" || value === "docx" || value === "md";
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function readChapterText(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object" && !Array.isArray(content)) {
    const maybeText = (content as { text?: unknown }).text;
    return typeof maybeText === "string" ? maybeText : "";
  }

  return "";
}

function buildMarkdown(project: ProjectRow, chapters: ChapterRow[], options: ExportRequestPayload["options"]) {
  const now = new Date().toISOString();
  const lines: string[] = [];

  if (options.includeTitlePage) {
    lines.push(`# ${project.title}`);
    lines.push("");
    lines.push(`Generated: ${now}`);
    lines.push(`Genre: ${project.genre ?? "Uncategorized"}`);
    lines.push("");
    if (project.description) {
      lines.push(project.description);
      lines.push("");
    }
  }

  if (options.includeTableOfContents) {
    lines.push("## Table of Contents");
    lines.push("");

    for (const chapter of chapters) {
      lines.push(`- ${chapter.title}`);
    }

    lines.push("");
  }

  for (const chapter of chapters) {
    lines.push(`## ${chapter.title}`);
    lines.push("");
    lines.push(readChapterText(chapter.content) || "_No content_");
    lines.push("");
  }

  return lines.join("\n");
}

function buildPlainText(project: ProjectRow, chapters: ChapterRow[], options: ExportRequestPayload["options"]) {
  const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count ?? 0), 0);
  const now = new Date().toISOString();
  const lines: string[] = [];

  if (options.includeTitlePage) {
    lines.push(project.title);
    lines.push("=".repeat(Math.max(12, project.title.length)));
    lines.push(`Generated: ${now}`);
    lines.push(`Genre: ${project.genre ?? "Uncategorized"}`);
    lines.push(`Chapters: ${chapters.length}`);
    lines.push(`Words: ${totalWords.toLocaleString("en-US")}`);
    if (project.description) {
      lines.push("");
      lines.push(project.description);
    }
    lines.push("");
  }

  if (options.includeTableOfContents) {
    lines.push("Table of Contents");
    lines.push("-----------------");

    for (const chapter of chapters) {
      lines.push(`- ${chapter.title}`);
    }

    lines.push("");
  }

  for (const chapter of chapters) {
    lines.push(chapter.title);
    lines.push("-".repeat(Math.max(8, chapter.title.length)));
    const text = readChapterText(chapter.content);

    if (options.standardManuscriptFormat) {
      for (const paragraph of text.split(/\n{2,}/)) {
        if (!paragraph.trim()) {
          continue;
        }

        lines.push(paragraph.trim());
        lines.push("");
      }
    } else {
      lines.push(text);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function wrapPdfText(text: string, maxCharactersPerLine: number) {
  const wrapped: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      wrapped.push("");
      continue;
    }

    const words = line.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (nextLine.length <= maxCharactersPerLine) {
        currentLine = nextLine;
        continue;
      }

      if (currentLine) {
        wrapped.push(currentLine);
      }

      currentLine = word;
    }

    wrapped.push(currentLine);
  }

  return wrapped;
}

function buildPdfBuffer(text: string) {
  const wrappedLines = wrapPdfText(text, 92);
  const pageLineCount = 46;
  const pages: string[][] = [];

  for (let index = 0; index < wrappedLines.length; index += pageLineCount) {
    pages.push(wrappedLines.slice(index, index + pageLineCount));
  }

  if (pages.length === 0) {
    pages.push([""]);
  }

  const fontObjectId = 3 + pages.length * 2;
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    `2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >> endobj\n`,
  ];

  for (let index = 0; index < pages.length; index += 1) {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const contentLines = ["BT", "/F1 12 Tf", "14 TL", "50 780 Td"];

    for (const line of pages[index]) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
      contentLines.push("T*");
    }

    contentLines.push("ET");
    const stream = `${contentLines.join("\n")}\n`;

    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >> endobj\n`,
    );
    objects.push(
      `${contentId} 0 obj << /Length ${new TextEncoder().encode(stream).length} >> stream\n${stream}endstream endobj\n`,
    );
  }

  objects.push(`${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += object;
  }

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

async function buildDocxBuffer(text: string) {
  const zip = new JSZip();
  const lines = text.split(/\r?\n/);
  const body = lines
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join("");
  const documentXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"',
    'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
    'xmlns:o="urn:schemas-microsoft-com:office:office"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"',
    'xmlns:v="urn:schemas-microsoft-com:vml"',
    'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:w10="urn:schemas-microsoft-com:office:word"',
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    "<w:body>",
    body,
    "<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/><w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/></w:sectPr>",
    "</w:body>",
    "</w:document>",
  ].join("");

  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.folder("_rels")?.file(
    ".rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.folder("word")?.file("document.xml", documentXml);

  return zip.generateAsync({ type: "uint8array" });
}

async function buildEpubBuffer(project: ProjectRow, markdown: string) {
  const zip = new JSZip();
  const safeTitle = escapeXml(project.title);
  const body = markdown
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${escapeXml(line)}</p>` : "<p>&nbsp;</p>"))
    .join("");

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.folder("META-INF")?.file(
    "container.xml",
    '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
  );

  const oebps = zip.folder("OEBPS");
  oebps?.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?><package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${crypto.randomUUID()}</dc:identifier><dc:title>${safeTitle}</dc:title><dc:language>en</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>`,
  );
  oebps?.file(
    "nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Navigation</title></head><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol><li><a href="chapter.xhtml">${safeTitle}</a></li></ol></nav></body></html>`,
  );
  oebps?.file(
    "chapter.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${safeTitle}</title></head><body><h1>${safeTitle}</h1>${body}</body></html>`,
  );

  return zip.generateAsync({ type: "uint8array" });
}

function getExportHeaders(fileName: string, contentType: string) {
  return {
    ...corsHeaders,
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, { error: "Supabase environment variables are missing in the function." });
  }

  if (!authorization) {
    return jsonResponse(401, { error: "Authorization header missing." });
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return jsonResponse(401, { error: "Invalid Supabase session." });
  }

  let payload: ExportRequestPayload;

  try {
    payload = (await request.json()) as ExportRequestPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  if (!payload?.projectId || typeof payload.projectId !== "string") {
    return jsonResponse(400, { error: "projectId is required." });
  }

  if (!ensureFormat(payload.format)) {
    return jsonResponse(400, { error: "Unsupported export format." });
  }

  const options = {
    standardManuscriptFormat: payload.options?.standardManuscriptFormat ?? true,
    includeTableOfContents: payload.options?.includeTableOfContents ?? false,
    includeTitlePage: payload.options?.includeTitlePage ?? true,
  };

  const { data: project, error: projectError } = await client
    .from("projects")
    .select("id,title,description,genre")
    .eq("id", payload.projectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    return jsonResponse(500, { error: projectError.message });
  }

  if (!project) {
    return jsonResponse(404, { error: "Project not found." });
  }

  const { data: chapters, error: chaptersError } = await client
    .from("chapters")
    .select("id,title,content,word_count,order_index")
    .eq("project_id", payload.projectId)
    .order("order_index", { ascending: true })
    .returns<ChapterRow[]>();

  if (chaptersError) {
    return jsonResponse(500, { error: chaptersError.message });
  }

  const chapterRows = chapters ?? [];
  const markdown = buildMarkdown(project, chapterRows, options);
  const text = buildPlainText(project, chapterRows, options);
  const projectName = (project.title || "manuscript").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();

  try {
    if (payload.format === "md") {
      return new Response(markdown, {
        headers: getExportHeaders(`${projectName}.md`, "text/markdown; charset=utf-8"),
      });
    }

    if (payload.format === "pdf") {
      const pdfBuffer = buildPdfBuffer(text);
      return new Response(pdfBuffer, {
        headers: getExportHeaders(`${projectName}.pdf`, "application/pdf"),
      });
    }

    if (payload.format === "docx") {
      const docxBuffer = await buildDocxBuffer(text);
      return new Response(docxBuffer, {
        headers: getExportHeaders(
          `${projectName}.docx`,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      });
    }

    const epubBuffer = await buildEpubBuffer(project, markdown);
    return new Response(epubBuffer, {
      headers: getExportHeaders(`${projectName}.epub`, "application/epub+zip"),
    });
  } catch (exportError) {
    const message = exportError instanceof Error ? exportError.message : "Export generation failed.";
    return jsonResponse(500, { error: message });
  }
});
