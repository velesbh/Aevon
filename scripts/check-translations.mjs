import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TRANSLATIONS_FILE = resolve("src/lib/i18n.tsx");

function findBlockBounds(source, lang) {
  const marker = `${lang}:`;
  const langIndex = source.indexOf(marker);

  if (langIndex === -1) {
    throw new Error(`Language block "${lang}" not found in ${TRANSLATIONS_FILE}`);
  }

  const braceStart = source.indexOf("{", langIndex);

  if (braceStart === -1) {
    throw new Error(`Opening brace for language "${lang}" not found.`);
  }

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return { start: braceStart + 1, end: i };
      }
    }
  }

  throw new Error(`Closing brace for language "${lang}" not found.`);
}

function extractKeys(source, lang) {
  const { start, end } = findBlockBounds(source, lang);
  const chunk = source.slice(start, end);
  const keys = new Set();
  const keyRegex = /"([^"]+)"\s*:/g;
  let match;

  while ((match = keyRegex.exec(chunk)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

function main() {
  const source = readFileSync(TRANSLATIONS_FILE, "utf8");

  const enKeys = extractKeys(source, "en");
  const esKeys = extractKeys(source, "es");

  const missingInSpanish = [...enKeys].filter((key) => !esKeys.has(key));
  const reportLines = [];

  if (missingInSpanish.length === 0) {
    reportLines.push("✅ Spanish translations cover all English keys.");
  } else {
    reportLines.push("❌ Missing Spanish translations for:");
    missingInSpanish.sort().forEach((key) => reportLines.push(` - ${key}`));
  }

  console.log(reportLines.join("\n"));

  if (missingInSpanish.length > 0) {
    process.exitCode = 1;
  }
}

main();
