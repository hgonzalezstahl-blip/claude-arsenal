#!/usr/bin/env node
/**
 * Agent Definition Linter
 *
 * Validates all agent .md files in ~/.claude/agents/ for:
 * - Required frontmatter fields (name, description, model)
 * - Valid model values
 * - Required sections based on agent type
 * - Description length limits
 * - Duplicate agent names
 *
 * Usage:
 *   node validate-agents.js              # lint all agents
 *   node validate-agents.js --fix        # suggest fixes
 *   node validate-agents.js agent.md     # lint specific file
 *
 * Exit codes: 0 = all pass, 1 = errors found
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'agents');
const VALID_MODELS = ['opus', 'sonnet', 'haiku'];
const REQUIRED_FRONTMATTER = ['name', 'description'];
const RECOMMENDED_FRONTMATTER = ['model', 'effort'];
const MAX_DESCRIPTION_LENGTH = 300;

// Sections that every agent should have (at least one heading)
const RECOMMENDED_SECTIONS = ['protocol', 'rules', 'output'];

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');
const specificFile = args.find(a => a.endsWith('.md'));

let errors = 0;
let warnings = 0;
let passed = 0;

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) {
      let val = kv[2].trim();
      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

function getHeadings(content) {
  const headings = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^#{1,3}\s+(.+)/);
    if (m) headings.push(m[1].toLowerCase().trim());
  }
  return headings;
}

function lint(filepath) {
  const filename = path.basename(filepath);
  const content = fs.readFileSync(filepath, 'utf-8');
  const issues = [];

  // 1. Frontmatter exists
  const fm = parseFrontmatter(content);
  if (!fm) {
    issues.push({ level: 'error', msg: 'Missing YAML frontmatter (---...---)' });
    report(filename, issues);
    return;
  }

  // 2. Required fields
  for (const field of REQUIRED_FRONTMATTER) {
    if (!fm[field]) {
      issues.push({ level: 'error', msg: `Missing required frontmatter field: ${field}` });
    }
  }

  // 3. Recommended fields
  for (const field of RECOMMENDED_FRONTMATTER) {
    if (!fm[field]) {
      issues.push({ level: 'warn', msg: `Missing recommended field: ${field}` });
    }
  }

  // 4. Model validation
  if (fm.model && !VALID_MODELS.includes(fm.model)) {
    issues.push({ level: 'error', msg: `Invalid model "${fm.model}" — must be one of: ${VALID_MODELS.join(', ')}` });
  }

  // 5. Description length
  if (fm.description && fm.description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({ level: 'warn', msg: `Description is ${fm.description.length} chars (recommended max: ${MAX_DESCRIPTION_LENGTH})` });
  }

  // 6. Name matches filename
  if (fm.name) {
    const expectedName = filename.replace(/\.(agent\.)?md$/, '');
    if (fm.name !== expectedName && fm.name.toLowerCase() !== expectedName.toLowerCase()) {
      issues.push({ level: 'warn', msg: `Frontmatter name "${fm.name}" doesn't match filename "${expectedName}"` });
    }
  }

  // 7. Has at least one heading (real content, not just frontmatter)
  const headings = getHeadings(content);
  if (headings.length === 0) {
    issues.push({ level: 'warn', msg: 'No markdown headings found — agent may lack structure' });
  }

  // 8. Check for recommended sections
  const headingsLower = headings.map(h => h.toLowerCase());
  for (const section of RECOMMENDED_SECTIONS) {
    const found = headingsLower.some(h => h.includes(section));
    if (!found) {
      issues.push({ level: 'info', msg: `No "${section}" section found (recommended for clarity)` });
    }
  }

  // 9. Content length check (too short = likely placeholder)
  const bodyContent = content.replace(/^---[\s\S]*?---/, '').trim();
  if (bodyContent.length < 100) {
    issues.push({ level: 'warn', msg: `Agent body is only ${bodyContent.length} chars — may be a stub` });
  }

  report(filename, issues);
}

function report(filename, issues) {
  const errs = issues.filter(i => i.level === 'error');
  const warns = issues.filter(i => i.level === 'warn');
  const infos = issues.filter(i => i.level === 'info');

  if (errs.length === 0 && warns.length === 0) {
    passed++;
    return;
  }

  console.log(`\n  ${filename}`);
  for (const i of errs) {
    console.log(`    \x1b[31mERROR\x1b[0m  ${i.msg}`);
    errors++;
  }
  for (const i of warns) {
    console.log(`    \x1b[33mWARN\x1b[0m   ${i.msg}`);
    warnings++;
  }
  for (const i of infos) {
    console.log(`    \x1b[36mINFO\x1b[0m   ${i.msg}`);
  }
}

// --- Main ---

console.log('\nAgent Definition Linter');
console.log('======================\n');

const names = new Map();
let files;

if (specificFile) {
  const fp = path.isAbsolute(specificFile) ? specificFile : path.join(process.cwd(), specificFile);
  if (!fs.existsSync(fp)) {
    console.error(`File not found: ${fp}`);
    process.exit(1);
  }
  files = [fp];
} else {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Agents directory not found: ${AGENTS_DIR}`);
    process.exit(1);
  }
  files = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(AGENTS_DIR, f))
    .sort();
}

console.log(`Scanning ${files.length} agent files...\n`);

for (const fp of files) {
  const content = fs.readFileSync(fp, 'utf-8');
  const fm = parseFrontmatter(content);
  if (fm && fm.name) {
    if (names.has(fm.name)) {
      console.log(`  \x1b[31mERROR\x1b[0m  Duplicate agent name "${fm.name}" in ${path.basename(fp)} and ${names.get(fm.name)}`);
      errors++;
    }
    names.set(fm.name, path.basename(fp));
  }
  lint(fp);
}

// --- Summary ---
console.log('\n' + '─'.repeat(50));
console.log(`  ${passed} passed  |  ${warnings} warnings  |  ${errors} errors`);
console.log(`  ${files.length} agents scanned`);
console.log('─'.repeat(50) + '\n');

process.exit(errors > 0 ? 1 : 0);
