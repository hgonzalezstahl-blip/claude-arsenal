#!/usr/bin/env node
// Hook: PostToolUse (all tools via multiple matchers)
// Lightweight audit trail for every tool invocation
// Logs tool name, input summary, result size, and timing

const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'tool-audit.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Skip Agent tools — handled by agent-audit.js
    if (data.tool_name === 'Agent') {
      process.exit(0);
      return;
    }

    const ti = data.tool_input || {};
    const result = typeof data.tool_response === 'string'
      ? data.tool_response
      : JSON.stringify(data.tool_response || '');

    const entry = {
      ts: new Date().toISOString(),
      sid: data.session_id || '',
      tool: data.tool_name || '',
      input_summary: summarizeInput(data.tool_name, ti),
      result_chars: result.length,
      result_tokens_est: Math.ceil(result.length / 4),
    };

    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Silent fail
  }
});

function summarizeInput(tool, input) {
  switch (tool) {
    case 'Read':
      return input.file_path || '';
    case 'Write':
    case 'Edit':
      return input.file_path || '';
    case 'Bash':
      return (input.command || '').substring(0, 200);
    case 'Grep':
      return `${input.pattern || ''} in ${input.path || '.'}`;
    case 'Glob':
      return `${input.pattern || ''} in ${input.path || '.'}`;
    case 'Skill':
      return input.skill || '';
    default:
      return JSON.stringify(input).substring(0, 150);
  }
}
