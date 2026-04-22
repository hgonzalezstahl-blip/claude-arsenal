#!/usr/bin/env node
// CLI tool: Run with `node ~/.claude/hooks/audit-summary.js [days]`
// Summarizes agent audit data for the last N days (default: 7)
// Shows: agent usage by type, tool usage, token estimates, cost estimates, efficiency metrics

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || process.env.USERPROFILE;
const AGENT_AUDIT = path.join(HOME, '.claude', 'agent-audit.jsonl');
const TOOL_AUDIT = path.join(HOME, '.claude', 'tool-audit.jsonl');
const REPORTS_DIR = path.join(HOME, '.claude', 'session-reports');

const days = parseInt(process.argv[2]) || 7;
const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

console.log(`\n=== CLAUDE ARSENAL AUDIT SUMMARY (last ${days} days) ===\n`);

// Agent audit
if (fs.existsSync(AGENT_AUDIT)) {
  const lines = fs.readFileSync(AGENT_AUDIT, 'utf8').trim().split('\n').filter(Boolean);
  const agents = { total: 0, by_type: {}, by_event: {} };
  let totalResultTokens = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (new Date(entry.timestamp || entry.ts) < cutoff) continue;

      agents.total++;
      const type = entry.agent_type || 'unknown';
      agents.by_type[type] = (agents.by_type[type] || 0) + 1;
      const event = entry.event || 'unknown';
      agents.by_event[event] = (agents.by_event[event] || 0) + 1;

      if (entry.result_tokens_est) {
        totalResultTokens += entry.result_tokens_est;
      }
    } catch (e) { /* skip */ }
  }

  console.log('AGENT INVOCATIONS');
  console.log(`  Total: ${agents.total}`);
  console.log('  By type:');
  Object.entries(agents.by_type)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`    ${type}: ${count}`));
  console.log(`  Total agent output: ~${totalResultTokens.toLocaleString()} tokens`);
  console.log();
} else {
  console.log('AGENT INVOCATIONS: No data yet (agent-audit.jsonl not found)\n');
}

// Tool audit
if (fs.existsSync(TOOL_AUDIT)) {
  const lines = fs.readFileSync(TOOL_AUDIT, 'utf8').trim().split('\n').filter(Boolean);
  const tools = { total: 0, by_name: {}, total_result_tokens: 0, large_results: 0 };

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (new Date(entry.ts) < cutoff) continue;

      tools.total++;
      tools.by_name[entry.tool] = (tools.by_name[entry.tool] || 0) + 1;
      tools.total_result_tokens += entry.result_tokens_est || 0;
      if ((entry.result_tokens_est || 0) > 8000) tools.large_results++;
    } catch (e) { /* skip */ }
  }

  console.log('TOOL USAGE');
  console.log(`  Total calls: ${tools.total}`);
  console.log('  By tool:');
  Object.entries(tools.by_name)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => console.log(`    ${name}: ${count}`));
  console.log(`  Total result tokens: ~${tools.total_result_tokens.toLocaleString()}`);
  console.log(`  Large results (>8K tokens): ${tools.large_results}`);
  console.log();
} else {
  console.log('TOOL USAGE: No data yet (tool-audit.jsonl not found)\n');
}

// Session reports
if (fs.existsSync(REPORTS_DIR)) {
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith('daily_'));
  let totalSessions = 0;
  let totalCost = 0;
  let totalTokens = 0;

  for (const file of files) {
    const filePath = path.join(REPORTS_DIR, file);
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (new Date(entry.timestamp) < cutoff) continue;
        totalSessions++;
        totalCost += parseFloat(entry.cost_usd || 0);
        totalTokens += entry.tokens || 0;
      } catch (e) { /* skip */ }
    }
  }

  console.log('SESSION SUMMARY');
  console.log(`  Sessions: ${totalSessions}`);
  console.log(`  Total tokens: ~${totalTokens.toLocaleString()}`);
  console.log(`  Estimated cost: $${totalCost.toFixed(2)}`);
  if (totalSessions > 0) {
    console.log(`  Avg tokens/session: ~${Math.round(totalTokens / totalSessions).toLocaleString()}`);
    console.log(`  Avg cost/session: $${(totalCost / totalSessions).toFixed(2)}`);
  }
  console.log();
} else {
  console.log('SESSION SUMMARY: No reports yet\n');
}

console.log('=== END REPORT ===\n');
