#!/usr/bin/env node
// Hook: Stop
// Generates a session efficiency report from transcript + agent audit log
// Outputs a summary to ~/.claude/session-reports/

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || process.env.USERPROFILE;
const AUDIT_FILE = path.join(HOME, '.claude', 'agent-audit.jsonl');
const REPORTS_DIR = path.join(HOME, '.claude', 'session-reports');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || 'unknown';
    const transcriptPath = data.transcript_path;

    // Ensure reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const report = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      agents: { total: 0, by_type: {} },
      tools: { total: 0, by_name: {} },
      context_pressure: { large_outputs: 0, total_output_chars: 0 },
    };

    // Parse agent audit log for this session
    if (fs.existsSync(AUDIT_FILE)) {
      const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split('\n');
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.session_id !== sessionId) continue;

          if (entry.tool === 'Agent') {
            report.agents.total++;
            const type = entry.agent_type || 'general-purpose';
            report.agents.by_type[type] = (report.agents.by_type[type] || 0) + 1;

            if (entry.result_tokens_est) {
              report.context_pressure.total_output_chars += entry.result_length || 0;
              if (entry.result_tokens_est > 8000) {
                report.context_pressure.large_outputs++;
              }
            }
          }

          report.tools.total++;
          const toolName = entry.tool || 'unknown';
          report.tools.by_name[toolName] = (report.tools.by_name[toolName] || 0) + 1;
        } catch (e) { /* skip malformed lines */ }
      }
    }

    // Parse transcript for token usage if available
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      try {
        const transcript = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCacheRead = 0;
        let totalCacheCreation = 0;

        for (const line of transcript) {
          try {
            const msg = JSON.parse(line);
            if (msg.usage) {
              totalInputTokens += msg.usage.input_tokens || 0;
              totalOutputTokens += msg.usage.output_tokens || 0;
              totalCacheRead += msg.usage.cache_read_input_tokens || 0;
              totalCacheCreation += msg.usage.cache_creation_input_tokens || 0;
            }
            // Also check nested usage in response messages
            if (msg.message && msg.message.usage) {
              totalInputTokens += msg.message.usage.input_tokens || 0;
              totalOutputTokens += msg.message.usage.output_tokens || 0;
            }
          } catch (e) { /* skip */ }
        }

        report.tokens = {
          input: totalInputTokens,
          output: totalOutputTokens,
          cache_read: totalCacheRead,
          cache_creation: totalCacheCreation,
          total: totalInputTokens + totalOutputTokens,
          cache_hit_rate: totalCacheRead > 0
            ? ((totalCacheRead / (totalInputTokens + totalCacheRead)) * 100).toFixed(1) + '%'
            : '0%',
        };

        // Estimate cost (Opus pricing: $15/M input, $75/M output; cached input $1.875/M)
        const uncachedInput = totalInputTokens - totalCacheRead;
        report.estimated_cost = {
          input_usd: ((uncachedInput / 1_000_000) * 15).toFixed(4),
          cached_input_usd: ((totalCacheRead / 1_000_000) * 1.875).toFixed(4),
          output_usd: ((totalOutputTokens / 1_000_000) * 75).toFixed(4),
          total_usd: (
            (uncachedInput / 1_000_000) * 15 +
            (totalCacheRead / 1_000_000) * 1.875 +
            (totalOutputTokens / 1_000_000) * 75
          ).toFixed(4),
        };
      } catch (e) { /* transcript parsing failed */ }
    }

    // Write report
    const reportFile = path.join(REPORTS_DIR, `${new Date().toISOString().slice(0, 10)}_${sessionId.slice(0, 8)}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Also append summary line to a daily log
    const dailyLog = path.join(REPORTS_DIR, `daily_${new Date().toISOString().slice(0, 10)}.jsonl`);
    fs.appendFileSync(dailyLog, JSON.stringify({
      session_id: sessionId,
      timestamp: report.timestamp,
      agents_spawned: report.agents.total,
      tools_used: report.tools.total,
      tokens: report.tokens?.total || 0,
      cost_usd: report.estimated_cost?.total_usd || '0',
      large_outputs: report.context_pressure.large_outputs,
    }) + '\n');

  } catch (e) {
    // Silent fail
  }
});
