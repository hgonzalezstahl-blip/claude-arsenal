#!/usr/bin/env node
/**
 * Claude Code Session Dashboard — Multi-Session Live Monitor
 *
 * Discovers and monitors ALL active Claude Code sessions in real-time.
 * Serves a dashboard with session switching, live token/cost tracking,
 * context window alerts, and agent call breakdowns.
 *
 * Usage: node server.js [--port 3333]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const PORT = parseInt(args[args.indexOf('--port') + 1]) || 3333;
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

// Opus 4.6 pricing per 1M tokens
const PRICING = {
  input: 15.00,
  output: 75.00,
  cache_read: 1.50,
  cache_write: 18.75,
};

const CONTEXT_LIMIT = 1_000_000;

// How recently a session must have been modified to be considered "active" (ms)
const ACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

class SessionParser {
  constructor(filepath) {
    this.filepath = filepath;
    this.id = path.basename(filepath, '.jsonl');
    this.projectDir = path.basename(path.dirname(filepath));
    this.projectName = this._deriveProjectName();
    this._fileSize = 0;
    this.stats = {
      id: this.id,
      sessionFile: filepath,
      projectDir: this.projectDir,
      projectName: this.projectName,
      sessionStart: null,
      lastActivity: null,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      estimatedCostUSD: 0,
      contextWindowUsed: 0,
      contextWindowPercent: 0,
      lastMsgInputTokens: 0,
      lastMsgCacheReadTokens: 0,
      lastMsgCacheWriteTokens: 0,
      messageCount: 0,
      toolCalls: {},
      agentCalls: {},
      timeline: [],
      alerts: [],
      lastUpdate: null,
    };
  }

  _deriveProjectName() {
    // Project dirs are encoded like "C--Users-hgonz-rekaliber"
    // Decode back to path segments and pick the meaningful tail
    const dir = this.projectDir;
    const decoded = dir.replace(/^([A-Z])--/, '$1:/').replace(/-/g, '/');
    const parts = decoded.split('/').filter(Boolean);
    if (parts.length === 0) return dir;

    const common = new Set(['c:', 'd:', 'e:']);
    // Only treat parts[2] as username if path is C:/Users/xxx/...
    const isUserPath = parts.length >= 2 && parts[1].toLowerCase() === 'users';
    const skip = new Set(common);
    if (isUserPath) {
      skip.add('users');
      if (parts.length >= 3) skip.add(parts[2].toLowerCase()); // username
    }

    // Walk backward from the last segment
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!skip.has(parts[i].toLowerCase())) {
        return parts[i];
      }
    }
    return '~';
  }

  parse() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      for (const line of lines) {
        this._processLine(line);
      }
      this._fileSize = fs.statSync(this.filepath).size;
      this._updateDerived();
    } catch {}
  }

  checkForUpdates() {
    try {
      const currentSize = fs.statSync(this.filepath).size;
      if (currentSize <= this._fileSize) return false;

      const fd = fs.openSync(this.filepath, 'r');
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
      return true;
    } catch {
      return false;
    }
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

        // Track last message's tokens for context window calculation
        this.stats.lastMsgInputTokens = (u.input_tokens || 0);
        this.stats.lastMsgCacheReadTokens = (u.cache_read_input_tokens || 0);
        this.stats.lastMsgCacheWriteTokens = (u.cache_creation_input_tokens || 0);

        if (!this.stats.sessionStart) {
          this.stats.sessionStart = j.timestamp;
        }
        this.stats.lastActivity = j.timestamp;

        if (j.message.content && Array.isArray(j.message.content)) {
          for (const block of j.message.content) {
            if (block.type === 'tool_use') {
              const toolName = block.name || 'unknown';
              this.stats.toolCalls[toolName] = (this.stats.toolCalls[toolName] || 0) + 1;

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
    this.stats.estimatedCostUSD = (
      (this.stats.totalInputTokens / 1_000_000) * PRICING.input +
      (this.stats.totalOutputTokens / 1_000_000) * PRICING.output +
      (this.stats.totalCacheReadTokens / 1_000_000) * PRICING.cache_read +
      (this.stats.totalCacheWriteTokens / 1_000_000) * PRICING.cache_write
    );

    // Context window = last API call's total input-side tokens (not cumulative)
    // This reflects how full the conversation is RIGHT NOW
    this.stats.contextWindowUsed = this.stats.lastMsgInputTokens +
      this.stats.lastMsgCacheReadTokens + this.stats.lastMsgCacheWriteTokens;
    this.stats.contextWindowPercent = Math.min(100,
      (this.stats.contextWindowUsed / CONTEXT_LIMIT) * 100);

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
}

class SessionManager {
  constructor() {
    this.sessions = new Map(); // id -> SessionParser
    this._pollInterval = null;
    this._scanInterval = null;
    this.onUpdate = null; // callback(sessionId, stats)
  }

  scan() {
    const now = Date.now();
    const found = new Set();

    try {
      for (const dir of fs.readdirSync(PROJECTS_DIR)) {
        const projDir = path.join(PROJECTS_DIR, dir);
        if (!fs.statSync(projDir).isDirectory()) continue;
        for (const file of fs.readdirSync(projDir)) {
          if (!file.endsWith('.jsonl')) continue;
          const fp = path.join(projDir, file);
          const stat = fs.statSync(fp);
          const id = path.basename(file, '.jsonl');
          found.add(id);

          // Skip sessions older than threshold
          if (now - stat.mtimeMs > ACTIVE_THRESHOLD) continue;

          if (!this.sessions.has(id)) {
            const parser = new SessionParser(fp);
            parser.parse();
            this.sessions.set(id, parser);
          }
        }
      }
    } catch {}

    // Remove sessions whose files no longer exist
    for (const [id] of this.sessions) {
      if (!found.has(id)) {
        this.sessions.delete(id);
      }
    }
  }

  startPolling() {
    // Initial scan
    this.scan();

    // Poll for updates on all sessions every second
    this._pollInterval = setInterval(() => {
      for (const [id, parser] of this.sessions) {
        const updated = parser.checkForUpdates();
        if (updated && this.onUpdate) {
          this.onUpdate(id, parser.stats);
        }
      }
    }, 1000);

    // Re-scan for new sessions every 10 seconds
    this._scanInterval = setInterval(() => {
      this.scan();
    }, 10000);
  }

  stop() {
    if (this._pollInterval) clearInterval(this._pollInterval);
    if (this._scanInterval) clearInterval(this._scanInterval);
  }

  getSessionList() {
    const list = [];
    for (const [id, parser] of this.sessions) {
      const s = parser.stats;
      list.push({
        id: s.id,
        projectName: s.projectName,
        projectDir: s.projectDir,
        sessionStart: s.sessionStart,
        lastActivity: s.lastActivity,
        messageCount: s.messageCount,
        estimatedCostUSD: s.estimatedCostUSD,
        contextWindowPercent: s.contextWindowPercent,
        alertCount: s.alerts.length,
        hasAlerts: s.alerts.some(a => a.level === 'critical'),
      });
    }
    // Sort by last activity, most recent first
    list.sort((a, b) => {
      const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return tb - ta;
    });
    return list;
  }

  getSession(id) {
    const parser = this.sessions.get(id);
    return parser ? parser.stats : null;
  }

  getLatestSessionId() {
    const list = this.getSessionList();
    return list.length > 0 ? list[0].id : null;
  }
}

// --- HTTP Server ---

const manager = new SessionManager();
manager.startPolling();

// SSE clients: Map<sessionId, Set<Response>>
const sseClients = new Map(); // sessionId -> Set<res>
const globalClients = new Set(); // clients listening to session list updates

manager.onUpdate = (sessionId, stats) => {
  // Notify clients watching this specific session
  const clients = sseClients.get(sessionId);
  if (clients) {
    const data = JSON.stringify(stats);
    for (const res of clients) {
      res.write(`event: stats\ndata: ${data}\n\n`);
    }
  }

  // Notify global clients about session list changes
  const listData = JSON.stringify(manager.getSessionList());
  for (const res of globalClients) {
    res.write(`event: sessions\ndata: ${listData}\n\n`);
  }
};

// Also broadcast session list periodically (for new session discovery)
setInterval(() => {
  const listData = JSON.stringify(manager.getSessionList());
  for (const res of globalClients) {
    res.write(`event: sessions\ndata: ${listData}\n\n`);
  }
}, 5000);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname === '/api/sessions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manager.getSessionList()));
    return;
  }

  if (url.pathname === '/api/stats') {
    const sessionId = url.searchParams.get('session') || manager.getLatestSessionId();
    const stats = sessionId ? manager.getSession(sessionId) : null;
    if (stats) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No sessions found' }));
    }
    return;
  }

  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial session list
    res.write(`event: sessions\ndata: ${JSON.stringify(manager.getSessionList())}\n\n`);

    // Send initial stats for requested session (or latest)
    const sessionId = url.searchParams.get('session') || manager.getLatestSessionId();
    if (sessionId) {
      const stats = manager.getSession(sessionId);
      if (stats) {
        res.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);
      }

      // Subscribe to this session's updates
      if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set());
      sseClients.get(sessionId).add(res);
    }

    // Subscribe to global session list updates
    globalClients.add(res);

    req.on('close', () => {
      globalClients.delete(res);
      for (const [, clients] of sseClients) {
        clients.delete(res);
      }
    });
    return;
  }

  if (url.pathname === '/api/switch') {
    // Client wants to switch which session they're watching via SSE
    // This is handled client-side by reconnecting the EventSource
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const sessionId = url.searchParams.get('session');
    const stats = sessionId ? manager.getSession(sessionId) : null;
    res.end(JSON.stringify(stats || { error: 'Session not found' }));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(htmlPath, 'utf-8'));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  const count = manager.sessions.size;
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Monitoring ${count} session${count !== 1 ? 's' : ''}`);
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  manager.stop();
  server.close();
  process.exit(0);
});
