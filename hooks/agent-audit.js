#!/usr/bin/env node
// Hook: PreToolUse + PostToolUse (Agent)
// Comprehensive agent invocation auditing
// Logs every agent spawn with type, prompt summary, timing, and result status

const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'agent-audit.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const entry = {
      timestamp: new Date().toISOString(),
      session_id: data.session_id || 'unknown',
      event: data.hook_event_name || 'unknown',
      tool: data.tool_name || 'unknown',
    };

    if (data.tool_name === 'Agent') {
      const ti = data.tool_input || {};
      entry.agent_type = ti.subagent_type || 'general-purpose';
      entry.description = ti.description || '';
      entry.prompt_preview = (ti.prompt || '').substring(0, 300);
      entry.model = ti.model || 'inherit';
      entry.background = ti.run_in_background || false;
      entry.isolation = ti.isolation || 'none';

      if (data.hook_event_name === 'PostToolUse') {
        const result = typeof data.tool_response === 'string'
          ? data.tool_response
          : JSON.stringify(data.tool_response || '');
        entry.result_length = result.length;
        entry.result_preview = result.substring(0, 500);
        entry.result_tokens_est = Math.ceil(result.length / 4);
      }
    }

    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Silent fail — never block agent execution
  }
});
