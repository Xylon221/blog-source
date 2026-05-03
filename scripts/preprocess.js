const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

function hasFrontMatter(content) {
  return content.trimStart().startsWith('---');
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}

function extractDescription(content) {
  const withoutTitle = content.replace(/^#\s+.+(\n|$)/m, '').trim();
  const paraMatch = withoutTitle.match(/^(?![\#\-\>\`\<\|\*\_\d]|\w+:\s)[^\n]{10,}/m);
  if (!paraMatch) return '';
  let text = paraMatch[0]
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    .replace(/[*_~`]{1,2}([^*_~`]+)[*_~`]{1,2}/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^#+\s*/gm, '')
    .trim();
  if (text.length > 160) {
    text = text.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  }
  return text;
}

function yamlQuote(text) {
  if (/[:\#"'&*!|>%@`\{\}\[\],]/.test(text)) {
    return '"' + text.replace(/"/g, '\\"') + '"';
  }
  return text;
}

// Clean leaked YAML from body (hexo-admin sometimes writes old front-matter into body)
function cleanBody(body) {
  // Strip leading YAML-like lines that end with a lone ---
  body = body.replace(/^(?:\w+:[\s\S]*?)\n---\n/, '');
  // Strip any remaining leading YAML key-value lines
  body = body.replace(/^(\w+:.*\n)+/, '');
  return body;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { fm: match[1], body: match[2] };
}

function buildFrontMatter(title, date, description) {
  const descLine = description ? `\ndescription: ${yamlQuote(description)}` : '';
  return `---
title: ${yamlQuote(title)}
date: ${date}
tags: []${descLine}
---
`;
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (!hasFrontMatter(content)) {
    // No front-matter at all — generate from scratch
    const title = extractTitle(content) || path.basename(filePath, '.md');
    const description = extractDescription(content);
    const stat = fs.statSync(filePath);
    const date = new Date(stat.mtime).toISOString().split('T')[0];
    content = buildFrontMatter(title, date, description) + content;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[new] ${file} — generated front-matter`);
    continue;
  }

  const parsed = parseFrontMatter(content);
  if (!parsed) {
    console.log(`[warn] ${file} — cannot parse front-matter, skipping`);
    continue;
  }

  let { fm, body } = parsed;

  // Clean up leaked YAML in body (hexo-admin bug)
  const cleanedBody = cleanBody(body);
  if (cleanedBody !== body) {
    body = cleanedBody;
    changed = true;
    console.log(`[clean] ${file} — removed leaked YAML from body`);
  }

  // Check if description is missing
  if (!/^description:/m.test(fm)) {
    const desc = extractDescription(body);
    if (desc) {
      fm = fm.replace(/^(title:.*\n)/, `$1description: ${yamlQuote(desc)}\n`);
      changed = true;
      console.log(`[desc] ${file} — added excerpt`);
    }
  }

  if (changed) {
    content = `---\n${fm}\n---\n${body}`;
    fs.writeFileSync(filePath, content, 'utf-8');
  } else {
    console.log(`[skip] ${file}`);
  }
}

console.log('Preprocess complete.');
