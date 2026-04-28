#!/usr/bin/env node
// Hook: Stop
// Generates a session efficiency report from transcript + agent audit log
// Outputs a summary to ~/.claude/session-reports/

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || process.env.USERPROFILE;
const AUDIT_FILE = path.join(HOME, '.claude', 'agent-audit.jsonl');
const REPORTS_DIR = path.join(HOME, '.claude', 'session-reports');
const ERROR_LOG = path.join(REPORTS_DIR, 'errors.log');

// Pricing per million tokens (USD). Update when Anthropic pricing changes.
// Cache read = 10% of input price. Cache write = 125% of input price (1.25x).
const PRICING = {
  opus:   { input: 15.00, output: 75.00, cache_read: 1.50,  cache_write: 18.75 },
  sonnet: { input: 3.00,  output: 15.00, cache_read: 0.30,  cache_write: 3.75  },
  haiku:  { input: 1.00,  output: 5.00,  cache_read: 0.10,  cache_write: 1.25  },
};
const DEFAULT_TIER = 'opus'; // fallback when model can't be detected

function modelToTier(modelString) {
  if (!modelString || typeof modelString !== 'string') return DEFAULT_TIER;
  const m = modelString.toLowerCase();
  if (m.includes('opus'))   return 'opus';
  if (m.includes('sonnet')) return 'sonnet';
  if (m.includes('haiku'))  return 'haiku';
  return DEFAULT_TIER;
}

function logError(stage, err, sessionId) {
  try {
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      session_id: sessionId || 'unknown',
      stage,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : null,
    }) + '\n';
    fs.appendFileSync(ERROR_LOG, line);
  } catch (_) {
    // last-resort: writing the error log itself failed; nothing more we can do without breaking the hook
  }
}

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
        const tierTokenCounts = { opus: 0, sonnet: 0, haiku: 0 }; // weight by tokens, not message count

        for (const line of transcript) {
          try {
            const msg = JSON.parse(line);
            const usage = msg.usage || (msg.message && msg.message.usage) || null;
            const model = msg.model || (msg.message && msg.message.model) || null;
            if (usage) {
              const inTok    = usage.input_tokens || 0;
              const outTok   = usage.output_tokens || 0;
              const cacheR   = usage.cache_read_input_tokens || 0;
              const cacheW   = usage.cache_creation_input_tokens || 0;
              totalInputTokens   += inTok;
              totalOutputTokens  += outTok;
              totalCacheRead     += cacheR;
              totalCacheCreation += cacheW;
              const tier = modelToTier(model);
              tierTokenCounts[tier] += inTok + outTok + cacheR + cacheW;
            }
          } catch (e) { /* skip malformed transcript lines */ }
        }

        // Pick the tier that handled the most tokens this session
        const dominantTier = Object.entries(tierTokenCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
        const tierUsed = tierTokenCounts[dominantTier] > 0 ? dominantTier : DEFAULT_TIER;
        const price = PRICING[tierUsed];

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

        // Estimate cost — model-tier-aware, includes cache write cost
        // Note: input_tokens from Anthropic API is already exclusive of cache read/write tokens
        // (cache read and cache_creation are billed separately, not double-counted)
        const inputCost       = (totalInputTokens   / 1_000_000) * price.input;
        const cacheReadCost   = (totalCacheRead     / 1_000_000) * price.cache_read;
        const cacheWriteCost  = (totalCacheCreation / 1_000_000) * price.cache_write;
        const outputCost      = (totalOutputTokens  / 1_000_000) * price.output;
        const totalCost       = inputCost + cacheReadCost + cacheWriteCost + outputCost;

        report.estimated_cost = {
          model_tier:        tierUsed,
          tier_token_share:  tierTokenCounts,
          input_usd:         inputCost.toFixed(4),
          cached_input_usd:  cacheReadCost.toFixed(4),
          cache_write_usd:   cacheWriteCost.toFixed(4),
          output_usd:        outputCost.toFixed(4),
          total_usd:         totalCost.toFixed(4),
          pricing_note:      'Verify against current Anthropic pricing — see PRICING table at top of session-report.js',
        };
      } catch (e) {
        logError('transcript_parse', e, sessionId);
      }
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
    // Don't break the Stop hook chain — but log the error so it's debuggable
    let sid = 'unknown';
    try { sid = JSON.parse(input).session_id || 'unknown'; } catch (_) {}
    logError('main', e, sid);
  }
});
