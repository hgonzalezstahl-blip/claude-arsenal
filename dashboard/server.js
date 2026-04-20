#!/usr/bin/env node
/**
 * Claude Code Session Dashboard — Live Monitoring Server
 *
 * Reads session JSONL transcripts in real-time and serves a dashboard
 * showing token usage, cost breakdown by agent, context window usage,
 * and alerts when approaching limits.
 *
 * Usage: node server.js [--port 3333] [--session <session-file>]
 * Default: auto-detects the most recent active session
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const args = process.argv.slice(2);
const PORT = parseInt(args[args.indexOf('--port') + 1]) || 3333;
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

// Token pricing (Opus 4.6, per 1M tokens) — update as needed
const PRICING = {
  input: 15.00,
  output: 75.00,
  cache_read: 1.50,
  cache_write: 18.75,
};

const CONTEXT_LIMIT = 1_000_000; // 1M context window

class SessionParser extends EventEmitter {
  constructor() {
    super();
    this.stats = {
      sessionFile: null,
      sessionStart: null,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      estimatedCostUSD: 0,
      contextWindowUsed: 0,
      contextWindowPercent: 0,
      messageCount: 0,
      toolCalls: {},
      agentCalls: {},
      timeline: [],
      alerts: [],
      lastUpdate: null,
    };
    this._watcher = null;
    this._fileSize = 0;
  }

  findLatestSession() {
    const sessionArg = args[args.indexOf('--session') + 1];
    if (sessionArg && fs.existsSync(sessionArg)) return sessionArg;

    // Find most recently modified JSONL across all project dirs
    let latest = null;
    let latestMtime = 0;
    try {
      for (const dir of fs.readdirSync(PROJECTS_DIR)) {
        const projDir = path.join(PROJECTS_DIR, dir);
        if (!fs.statSync(projDir).isDirectory()) continue;
        for (const file of fs.readdirSync(projDir)) {
          if (!file.endsWith('.jsonl')) continue;
          const fp = path.join(projDir, file);
          const stat = fs.statSync(fp);
          if (stat.mtimeMs > latestMtime) {
            latestMtime = stat.mtimeMs;
            latest = fp;
          }
        }
      }
    } catch {}
    return latest;
  }

  parseFile(filepath) {
    this.stats.sessionFile = filepath;
    const data = fs.readFileSync(filepath, 'utf-8');
    const lines = data.split('\n').filter(Boolean);
    for (const line of lines) {
      this._processLine(line);
    }
    this._fileSize = fs.statSync(filepath).size;
    this._updateDerived();
    this.emit('update', this.stats);
  }

  watch(filepath) {
    this.parseFile(filepath);

    // Poll-based watching (works cross-platform, including Windows)
    this._watcher = setInterval(() => {
      try {
        const currentSize = fs.statSync(filepath).size;
        if (currentSize > this._fileSize) {
          const fd = fs.openSync(filepath, 'r');
          const buf = Buffer.alloc(currentSize - this._fileSize);
          fs.readSync(fd, buf, 0, buf.length, this._fileSize);
          fs.closeSync(fd);
          this._fileSize = currentSize;

          const newData = buf.toString('utf-8');
          const lines = newData.split('\n').filter(Boolean);
          for (const line of lines) {
            this._processLine(line);
          }
          this._updateDerived();
          this.emit('update', this.stats);
        }
      } catch {}
    }, 1000);
  }

  _processLine(line) {
    try {
      const j = JSON.parse(line);

      if (j.type === 'assistant' && j.message?.usage) {
        const u = j.message.usage;
        this.stats.messageCount++;
        this.stats.totalInputTokens += (u.input_tokens || 0);
        this.stats.totalOutputTokens += (u.output_tokens || 0);
        this.stats.totalCacheReadTokens += (u.cache_read_input_tokens || 0);
        this.stats.totalCacheWriteTokens += (u.cache_creation_input_tokens || 0);

        if (!this.stats.sessionStart) {
          this.stats.sessionStart = j.timestamp;
        }

        // Track tool calls from content
        if (j.message.content && Array.isArray(j.message.content)) {
          for (const block of j.message.content) {
            if (block.type === 'tool_use') {
              const toolName = block.name || 'unknown';
              this.stats.toolCalls[toolName] = (this.stats.toolCalls[toolName] || 0) + 1;

              // Track agent sub-calls with their types and token cost
              if (toolName === 'Agent') {
                const inp = block.input || {};
                const agentType = inp.subagent_type || 'general-purpose';
                const desc = inp.description || 'unnamed';
                if (!this.stats.agentCalls[agentType]) {
                  this.stats.agentCalls[agentType] = { count: 0, descriptions: [] };
                }
                this.stats.agentCalls[agentType].count++;
                if (this.stats.agentCalls[agentType].descriptions.length < 10) {
                  this.stats.agentCalls[agentType].descriptions.push(desc);
                }
              }
            }
          }
        }

        // Timeline entry (sampled — every 10th message to keep it light)
        if (this.stats.messageCount % 10 === 0) {
          this.stats.timeline.push({
            ts: j.timestamp,
            inputTokens: this.stats.totalInputTokens,
            outputTokens: this.stats.totalOutputTokens,
            cost: this.stats.estimatedCostUSD,
          });
        }
      }
    } catch {}
  }

  _updateDerived() {
    // Cost estimate
    this.stats.estimatedCostUSD = (
      (this.stats.totalInputTokens / 1_000_000) * PRICING.input +
      (this.stats.totalOutputTokens / 1_000_000) * PRICING.output +
      (this.stats.totalCacheReadTokens / 1_000_000) * PRICING.cache_read +
      (this.stats.totalCacheWriteTokens / 1_000_000) * PRICING.cache_write
    );

    // Context window estimate (last message's input + cache = rough context usage)
    this.stats.contextWindowUsed = this.stats.totalInputTokens +
      this.stats.totalCacheReadTokens + this.stats.totalCacheWriteTokens;
    // Use last message's cumulative input as proxy for current context size
    const lastInput = this.stats.totalInputTokens + this.stats.totalCacheReadTokens;
    this.stats.contextWindowPercent = Math.min(100, (lastInput / CONTEXT_LIMIT) * 100);

    // Alerts
    this.stats.alerts = [];
    if (this.stats.contextWindowPercent > 80) {
      this.stats.alerts.push({ level: 'critical', msg: `Context window at ${this.stats.contextWindowPercent.toFixed(1)}% — compaction imminent` });
    } else if (this.stats.contextWindowPercent > 60) {
      this.stats.alerts.push({ level: 'warning', msg: `Context window at ${this.stats.contextWindowPercent.toFixed(1)}% — monitor closely` });
    }
    if (this.stats.estimatedCostUSD > 10) {
      this.stats.alerts.push({ level: 'warning', msg: `Session cost: $${this.stats.estimatedCostUSD.toFixed(2)} — high spend session` });
    }

    this.stats.lastUpdate = Date.now();
  }

  stop() {
    if (this._watcher) clearInterval(this._watcher);
  }
}

// SSE clients
const clients = new Set();

const parser = new SessionParser();
parser.on('update', (stats) => {
  const data = JSON.stringify(stats);
  for (const res of clients) {
    res.write(`data: ${data}\n\n`);
  }
});

// Find and start watching
const sessionFile = parser.findLatestSession();
if (!sessionFile) {
  console.error('No session file found. Start a Claude Code session first.');
  process.exit(1);
}
console.log(`Monitoring: ${sessionFile}`);
parser.watch(sessionFile);

// HTTP Server
const server = http.createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    clients.add(res);
    // Send initial state
    res.write(`data: ${JSON.stringify(parser.stats)}\n\n`);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.url === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(parser.stats));
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(htmlPath, 'utf-8'));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  parser.stop();
  server.close();
  process.exit(0);
});
