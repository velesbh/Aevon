const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('src');
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/import Grid from [\"']@mui\/material\/Grid2[\"'];/g, 'import Grid from \"@mui/material/Grid\";');

  content = content.replace(/<Grid([^>]*?)size=\{\{([^}]+)\}\}([^>]*?)>/g, (match, before, sizeContent, after) => {
    const props = sizeContent.split(',').map(s => s.trim()).filter(Boolean);
    const expandedProps = props.map(p => {
      const [key, val] = p.split(':').map(s => s.trim());
      return `${key}={${val}}`;
    }).join(' ');
    
    const isContainer = before.includes('container') || after.includes('container');
    const itemProp = isContainer ? '' : 'item ';
    
    return `<Grid${before}${itemProp}${expandedProps}${after}>`;
  });

  content = content.replace(/<Grid([^>]*?)size=\{([0-9]+)\}([^>]*?)>/g, (match, before, val, after) => {
    const isContainer = before.includes('container') || after.includes('container');
    const itemProp = isContainer ? '' : 'item ';
    return `<Grid${before}${itemProp}xs={${val}}${after}>`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    changedFiles++;
  }
}
console.log('Changed files:', changedFiles);
