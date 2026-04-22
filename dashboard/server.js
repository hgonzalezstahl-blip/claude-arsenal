#!/usr/bin/env node
/**
 * Claude Arsenal Dashboard — Session Monitor & Analytics Engine
 *
 * Replaces ctrl-daemon with a self-hosted, editable session monitor.
 * Discovers ALL Claude Code sessions, tracks real-time state, computes
 * historical analytics, and serves a live dashboard.
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

// Sessions modified within this window are "active" and polled for live updates
const ACTIVE_THRESHOLD = 24 * 60 * 60 * 1000;
// Sessions within this window are included in historical analytics
const HISTORY_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Session Parser ──────────────────────────────────────────────

class SessionParser {
  constructor(filepath) {
    this.filepath = filepath;
    this.id = path.basename(filepath, '.jsonl');
    this.projectDir = path.basename(path.dirname(filepath));
    this.projectName = this._deriveProjectName();
    this._fileSize = 0;
    this.stats = this._emptyStats();
  }

  _emptyStats() {
    return {
      id: this.id,
      sessionFile: this.filepath,
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
      userMessageCount: 0,
      turnCount: 0,
      toolCalls: {},
      agentCalls: {},
      models: {},
      entrypoint: null,
      version: null,
      gitBranch: null,
      turnDurations: [],
      timeline: [],
      alerts: [],
      lastUpdate: null,
      // Per-turn granular data for charts
      turnSnapshots: [],
    };
  }

  _deriveProjectName() {
    const dir = this.projectDir;
    const decoded = dir.replace(/^([A-Z])--/, '$1:/').replace(/-/g, '/');
    const parts = decoded.split('/').filter(Boolean);
    if (parts.length === 0) return dir;
    const skip = new Set(['c:', 'd:', 'e:', 'users']);
    const isUserPath = parts.length >= 2 && parts[1].toLowerCase() === 'users';
    if (isUserPath && parts.length >= 3) skip.add(parts[2].toLowerCase());
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!skip.has(parts[i].toLowerCase())) return parts[i];
    }
    return '~';
  }

  parse() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      for (const line of lines) this._processLine(line);
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
      const lines = buf.toString('utf-8').split('\n').filter(Boolean);
      for (const line of lines) this._processLine(line);
      this._updateDerived();
      return true;
    } catch { return false; }
  }

  _processLine(line) {
    try {
      const j = JSON.parse(line);

      // Track metadata from first user message
      if (j.type === 'user' && !j.toolUseResult) {
        this.stats.userMessageCount++;
        if (!this.stats.sessionStart) this.stats.sessionStart = j.timestamp;
        if (j.entrypoint) this.stats.entrypoint = j.entrypoint;
        if (j.version) this.stats.version = j.version;
        if (j.gitBranch) this.stats.gitBranch = j.gitBranch;
        this.stats.lastActivity = j.timestamp;
      }

      // Track turn durations from system messages
      if (j.type === 'system' && j.subtype === 'turn_duration' && j.durationMs) {
        this.stats.turnCount++;
        this.stats.turnDurations.push(j.durationMs);
        // Keep last 100 for memory
        if (this.stats.turnDurations.length > 100) {
          this.stats.turnDurations = this.stats.turnDurations.slice(-100);
        }
      }

      // Main assistant message processing
      if (j.type === 'assistant' && j.message?.usage) {
        const u = j.message.usage;
        this.stats.messageCount++;
        this.stats.totalInputTokens += (u.input_tokens || 0);
        this.stats.totalOutputTokens += (u.output_tokens || 0);
        this.stats.totalCacheReadTokens += (u.cache_read_input_tokens || 0);
        this.stats.totalCacheWriteTokens += (u.cache_creation_input_tokens || 0);

        this.stats.lastMsgInputTokens = (u.input_tokens || 0);
        this.stats.lastMsgCacheReadTokens = (u.cache_read_input_tokens || 0);
        this.stats.lastMsgCacheWriteTokens = (u.cache_creation_input_tokens || 0);

        if (!this.stats.sessionStart) this.stats.sessionStart = j.timestamp;
        this.stats.lastActivity = j.timestamp;

        // Track model usage
        const model = j.message.model || 'unknown';
        this.stats.models[model] = (this.stats.models[model] || 0) + 1;

        // Track tool calls and agent invocations
        if (j.message.content && Array.isArray(j.message.content)) {
          for (const block of j.message.content) {
            if (block.type === 'tool_use') {
              const toolName = block.name || 'unknown';
              this.stats.toolCalls[toolName] = (this.stats.toolCalls[toolName] || 0) + 1;

              if (toolName === 'Agent') {
                const inp = block.input || {};
                const agentType = inp.subagent_type || 'general-purpose';
                const desc = inp.description || 'unnamed';
                const bg = !!inp.run_in_background;
                if (!this.stats.agentCalls[agentType]) {
                  this.stats.agentCalls[agentType] = { count: 0, descriptions: [], background: 0 };
                }
                this.stats.agentCalls[agentType].count++;
                if (bg) this.stats.agentCalls[agentType].background++;
                if (this.stats.agentCalls[agentType].descriptions.length < 15) {
                  this.stats.agentCalls[agentType].descriptions.push(desc);
                }
              }
            }
          }
        }

        // Snapshot every 5 messages for timeline charts
        if (this.stats.messageCount % 5 === 0) {
          this.stats.turnSnapshots.push({
            ts: j.timestamp,
            totalIn: this.stats.totalInputTokens,
            totalOut: this.stats.totalOutputTokens,
            totalCacheR: this.stats.totalCacheReadTokens,
            totalCacheW: this.stats.totalCacheWriteTokens,
            cost: 0, // computed in _updateDerived
            msgCount: this.stats.messageCount,
          });
          // Keep last 200 snapshots
          if (this.stats.turnSnapshots.length > 200) {
            this.stats.turnSnapshots = this.stats.turnSnapshots.slice(-200);
          }
        }
      }
    } catch {}
  }

  _updateDerived() {
    const s = this.stats;
    s.estimatedCostUSD = (
      (s.totalInputTokens / 1e6) * PRICING.input +
      (s.totalOutputTokens / 1e6) * PRICING.output +
      (s.totalCacheReadTokens / 1e6) * PRICING.cache_read +
      (s.totalCacheWriteTokens / 1e6) * PRICING.cache_write
    );

    s.contextWindowUsed = s.lastMsgInputTokens + s.lastMsgCacheReadTokens + s.lastMsgCacheWriteTokens;
    s.contextWindowPercent = Math.min(100, (s.contextWindowUsed / CONTEXT_LIMIT) * 100);

    // Update cost in snapshots
    for (const snap of s.turnSnapshots) {
      snap.cost = (
        (snap.totalIn / 1e6) * PRICING.input +
        (snap.totalOut / 1e6) * PRICING.output +
        (snap.totalCacheR / 1e6) * PRICING.cache_read +
        (snap.totalCacheW / 1e6) * PRICING.cache_write
      );
    }

    s.alerts = [];
    if (s.contextWindowPercent > 80) {
      s.alerts.push({ level: 'critical', msg: `Context window at ${s.contextWindowPercent.toFixed(1)}% — compaction imminent` });
    } else if (s.contextWindowPercent > 60) {
      s.alerts.push({ level: 'warning', msg: `Context window at ${s.contextWindowPercent.toFixed(1)}% — monitor closely` });
    }
    if (s.estimatedCostUSD > 10) {
      s.alerts.push({ level: 'warning', msg: `Session cost: $${s.estimatedCostUSD.toFixed(2)} — high spend` });
    }

    s.lastUpdate = Date.now();
  }
}

// ─── Session Manager ─────────────────────────────────────────────

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.historicalCache = null;
    this.historicalCacheTime = 0;
    this._pollInterval = null;
    this._scanInterval = null;
    this.onUpdate = null;
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
          if (now - stat.mtimeMs > ACTIVE_THRESHOLD) continue;
          if (!this.sessions.has(id)) {
            const parser = new SessionParser(fp);
            parser.parse();
            this.sessions.set(id, parser);
          }
        }
      }
    } catch {}
    for (const [id] of this.sessions) {
      if (!found.has(id)) this.sessions.delete(id);
    }
  }

  startPolling() {
    this.scan();
    this._pollInterval = setInterval(() => {
      for (const [id, parser] of this.sessions) {
        if (parser.checkForUpdates() && this.onUpdate) {
          this.onUpdate(id, parser.stats);
        }
      }
    }, 1000);
    this._scanInterval = setInterval(() => this.scan(), 10000);
  }

  stop() {
    if (this._pollInterval) clearInterval(this._pollInterval);
    if (this._scanInterval) clearInterval(this._scanInterval);
  }

  getSessionList() {
    const list = [];
    for (const [, parser] of this.sessions) {
      const s = parser.stats;
      list.push({
        id: s.id, projectName: s.projectName, projectDir: s.projectDir,
        sessionStart: s.sessionStart, lastActivity: s.lastActivity,
        messageCount: s.messageCount, userMessageCount: s.userMessageCount,
        estimatedCostUSD: s.estimatedCostUSD,
        contextWindowPercent: s.contextWindowPercent,
        alertCount: s.alerts.length,
        hasAlerts: s.alerts.some(a => a.level === 'critical'),
        entrypoint: s.entrypoint, version: s.version,
      });
    }
    list.sort((a, b) => {
      const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return tb - ta;
    });
    return list;
  }

  getSession(id) {
    const p = this.sessions.get(id);
    return p ? p.stats : null;
  }

  getLatestSessionId() {
    const list = this.getSessionList();
    return list.length > 0 ? list[0].id : null;
  }

  // ─── Historical Analytics ────────────────────────────────────

  getAnalytics() {
    const now = Date.now();
    // Cache for 30 seconds (expensive to recompute)
    if (this.historicalCache && now - this.historicalCacheTime < 30000) {
      return this.historicalCache;
    }

    const allSessions = [];
    const dailyCosts = {};    // date string -> cost
    const dailySessions = {}; // date string -> count
    const toolTotals = {};
    const agentTotals = {};
    const modelTotals = {};
    const projectCosts = {};
    let totalCost = 0;
    let totalTokens = 0;
    let totalSessions = 0;

    try {
      for (const dir of fs.readdirSync(PROJECTS_DIR)) {
        const projDir = path.join(PROJECTS_DIR, dir);
        if (!fs.statSync(projDir).isDirectory()) continue;
        for (const file of fs.readdirSync(projDir)) {
          if (!file.endsWith('.jsonl')) continue;
          const fp = path.join(projDir, file);
          const stat = fs.statSync(fp);
          if (now - stat.mtimeMs > HISTORY_THRESHOLD) continue;

          // Use cached parser if available, otherwise do lightweight parse
          const id = path.basename(file, '.jsonl');
          let stats;
          if (this.sessions.has(id)) {
            stats = this.sessions.get(id).stats;
          } else {
            const parser = new SessionParser(fp);
            parser.parse();
            stats = parser.stats;
          }

          if (!stats.sessionStart) continue;

          totalSessions++;
          totalCost += stats.estimatedCostUSD;
          totalTokens += stats.totalInputTokens + stats.totalOutputTokens +
            stats.totalCacheReadTokens + stats.totalCacheWriteTokens;

          // Daily rollups
          const day = stats.sessionStart.substring(0, 10); // YYYY-MM-DD
          dailyCosts[day] = (dailyCosts[day] || 0) + stats.estimatedCostUSD;
          dailySessions[day] = (dailySessions[day] || 0) + 1;

          // Tool totals
          for (const [tool, count] of Object.entries(stats.toolCalls)) {
            toolTotals[tool] = (toolTotals[tool] || 0) + count;
          }

          // Agent totals
          for (const [agent, data] of Object.entries(stats.agentCalls)) {
            if (!agentTotals[agent]) agentTotals[agent] = { count: 0, background: 0 };
            agentTotals[agent].count += data.count;
            agentTotals[agent].background += (data.background || 0);
          }

          // Model totals
          for (const [model, count] of Object.entries(stats.models)) {
            modelTotals[model] = (modelTotals[model] || 0) + count;
          }

          // Project costs
          const pn = stats.projectName;
          projectCosts[pn] = (projectCosts[pn] || 0) + stats.estimatedCostUSD;

          // Compute per-session efficiency metrics
          const totalToolCalls = Object.values(stats.toolCalls).reduce((a, b) => a + b, 0);
          const agentToolCalls = stats.toolCalls['Agent'] || 0;
          const userMsgs = stats.userMessageCount || 1;
          const totalTok = stats.totalInputTokens + stats.totalOutputTokens +
            stats.totalCacheReadTokens + stats.totalCacheWriteTokens;
          const inputSide = stats.totalInputTokens + stats.totalCacheReadTokens + stats.totalCacheWriteTokens;

          // Duration in hours
          let durationHours = 0;
          if (stats.sessionStart && stats.lastActivity) {
            durationHours = (new Date(stats.lastActivity) - new Date(stats.sessionStart)) / 3.6e6;
          }

          const sessionMetrics = {
            amplification: stats.messageCount / userMsgs,
            costPerPrompt: stats.estimatedCostUSD / userMsgs,
            cacheHitRate: inputSide > 0 ? stats.totalCacheReadTokens / inputSide : 0,
            delegationRate: totalToolCalls > 0 ? agentToolCalls / totalToolCalls : 0,
            toolsPerTurn: stats.messageCount > 0 ? totalToolCalls / stats.messageCount : 0,
            velocity: durationHours > 0.01 ? userMsgs / durationHours : 0,
            tokensPerPrompt: totalTok / userMsgs,
            avgTurnDuration: stats.turnDurations.length > 0
              ? stats.turnDurations.reduce((a, b) => a + b, 0) / stats.turnDurations.length
              : 0,
          };

          allSessions.push({
            id: stats.id,
            projectName: stats.projectName,
            sessionStart: stats.sessionStart,
            lastActivity: stats.lastActivity,
            cost: stats.estimatedCostUSD,
            messages: stats.messageCount,
            userMessages: stats.userMessageCount,
            turns: stats.turnCount,
            contextPercent: stats.contextWindowPercent,
            totalToolCalls,
            agentToolCalls,
            metrics: sessionMetrics,
          });
        }
      }
    } catch {}

    // Sort daily data chronologically
    const sortedDays = Object.keys(dailyCosts).sort();
    const dailyChart = sortedDays.map(d => ({
      date: d,
      cost: dailyCosts[d],
      sessions: dailySessions[d] || 0,
    }));

    // Top tools sorted by usage
    const topTools = Object.entries(toolTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    // Top agents sorted by usage
    const topAgents = Object.entries(agentTotals)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ name, count: data.count, background: data.background }));

    // Project cost breakdown
    const projectBreakdown = Object.entries(projectCosts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, cost]) => ({ name, cost }));

    // Compute averages
    const avgCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
    const avgTokensPerSession = totalSessions > 0 ? totalTokens / totalSessions : 0;

    // Today's stats
    const today = new Date().toISOString().substring(0, 10);
    const todayCost = dailyCosts[today] || 0;
    const todaySessions = dailySessions[today] || 0;

    // ── Weekly Comparison ──────────────────────────────────────
    // Split sessions into this week vs last week
    const nowDate = new Date();
    const dayOfWeek = nowDate.getDay(); // 0=Sun
    const startOfThisWeek = new Date(nowDate);
    startOfThisWeek.setDate(nowDate.getDate() - dayOfWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeek = allSessions.filter(s => s.sessionStart && new Date(s.sessionStart) >= startOfThisWeek);
    const lastWeek = allSessions.filter(s => {
      if (!s.sessionStart) return false;
      const d = new Date(s.sessionStart);
      return d >= startOfLastWeek && d < startOfThisWeek;
    });

    function weeklyAgg(sessions) {
      if (sessions.length === 0) return null;
      const totCost = sessions.reduce((a, s) => a + s.cost, 0);
      const totMsgs = sessions.reduce((a, s) => a + s.messages, 0);
      const totUserMsgs = sessions.reduce((a, s) => a + (s.userMessages || 1), 0);
      const totTools = sessions.reduce((a, s) => a + (s.totalToolCalls || 0), 0);
      const totAgents = sessions.reduce((a, s) => a + (s.agentToolCalls || 0), 0);
      const metricsArr = sessions.filter(s => s.metrics);
      const avg = (arr, key) => arr.length > 0 ? arr.reduce((a, s) => a + (s.metrics[key] || 0), 0) / arr.length : 0;
      return {
        sessions: sessions.length,
        cost: totCost,
        messages: totMsgs,
        userMessages: totUserMsgs,
        avgAmplification: avg(metricsArr, 'amplification'),
        avgCostPerPrompt: totUserMsgs > 0 ? totCost / totUserMsgs : 0,
        avgCacheHitRate: avg(metricsArr, 'cacheHitRate'),
        avgDelegationRate: avg(metricsArr, 'delegationRate'),
        avgToolsPerTurn: avg(metricsArr, 'toolsPerTurn'),
        avgVelocity: avg(metricsArr, 'velocity'),
        avgTokensPerPrompt: avg(metricsArr, 'tokensPerPrompt'),
        avgTurnDuration: avg(metricsArr, 'avgTurnDuration'),
      };
    }

    const thisWeekAgg = weeklyAgg(thisWeek);
    const lastWeekAgg = weeklyAgg(lastWeek);

    // Compute deltas (positive = improved, depends on metric)
    // For cost/tokens: lower is better (delta inverted)
    // For amplification/cache/delegation/velocity: higher is better
    function delta(current, previous, lowerIsBetter) {
      if (!current || !previous || previous === 0) return null;
      const pctChange = ((current - previous) / Math.abs(previous)) * 100;
      return {
        value: pctChange,
        direction: lowerIsBetter ? (pctChange < 0 ? 'better' : 'worse') : (pctChange > 0 ? 'better' : 'worse'),
      };
    }

    let weeklyDeltas = null;
    if (thisWeekAgg && lastWeekAgg) {
      weeklyDeltas = {
        cost: delta(thisWeekAgg.cost, lastWeekAgg.cost, true),
        costPerPrompt: delta(thisWeekAgg.avgCostPerPrompt, lastWeekAgg.avgCostPerPrompt, true),
        amplification: delta(thisWeekAgg.avgAmplification, lastWeekAgg.avgAmplification, false),
        cacheHitRate: delta(thisWeekAgg.avgCacheHitRate, lastWeekAgg.avgCacheHitRate, false),
        delegationRate: delta(thisWeekAgg.avgDelegationRate, lastWeekAgg.avgDelegationRate, false),
        velocity: delta(thisWeekAgg.avgVelocity, lastWeekAgg.avgVelocity, false),
        tokensPerPrompt: delta(thisWeekAgg.avgTokensPerPrompt, lastWeekAgg.avgTokensPerPrompt, true),
        turnDuration: delta(thisWeekAgg.avgTurnDuration, lastWeekAgg.avgTurnDuration, true),
        sessions: delta(thisWeekAgg.sessions, lastWeekAgg.sessions, false),
      };
    }

    // ── Composite Efficiency Score (0-100) ───────────────────
    // Weighted composite of the key performance indicators
    function computeScore(agg) {
      if (!agg) return null;
      // Each metric is normalized to a 0-100 scale
      const scores = {
        // Amplification: 1x=0, 5x=50, 10x+=100
        amplification: Math.min(100, (agg.avgAmplification / 10) * 100),
        // Cache hit rate: 0%=0, 100%=100
        cacheHitRate: agg.avgCacheHitRate * 100,
        // Delegation: 0%=0, 30%+=100  (30%+ agent delegation is heavy)
        delegation: Math.min(100, (agg.avgDelegationRate / 0.30) * 100),
        // Cost per prompt: <$0.10=100, >$2=0
        costEfficiency: Math.max(0, Math.min(100, (1 - (agg.avgCostPerPrompt / 2)) * 100)),
        // Tools per turn: 0=0, 3+=100
        toolDensity: Math.min(100, (agg.avgToolsPerTurn / 3) * 100),
        // Velocity: 0=0, 20+ prompts/hr=100
        velocity: Math.min(100, (agg.avgVelocity / 20) * 100),
      };

      // Weighted average
      const weights = {
        amplification: 0.20,
        cacheHitRate: 0.15,
        delegation: 0.15,
        costEfficiency: 0.20,
        toolDensity: 0.15,
        velocity: 0.15,
      };
      let total = 0, wSum = 0;
      for (const [key, weight] of Object.entries(weights)) {
        total += scores[key] * weight;
        wSum += weight;
      }
      return {
        composite: Math.round(total / wSum),
        breakdown: scores,
      };
    }

    const thisWeekScore = computeScore(thisWeekAgg);
    const lastWeekScore = computeScore(lastWeekAgg);

    // ── Per-session metrics trend (for charts) ───────────────
    const sessionMetricsTrend = allSessions
      .filter(s => s.metrics && s.sessionStart)
      .sort((a, b) => new Date(a.sessionStart) - new Date(b.sessionStart))
      .map(s => ({
        date: s.sessionStart.substring(0, 10),
        amplification: s.metrics.amplification,
        costPerPrompt: s.metrics.costPerPrompt,
        cacheHitRate: s.metrics.cacheHitRate,
        delegationRate: s.metrics.delegationRate,
        velocity: s.metrics.velocity,
      }));

    this.historicalCache = {
      totalSessions,
      totalCost,
      totalTokens,
      avgCostPerSession,
      avgTokensPerSession,
      todayCost,
      todaySessions,
      dailyChart,
      topTools,
      topAgents,
      modelTotals,
      projectBreakdown,
      recentSessions: allSessions
        .sort((a, b) => new Date(b.sessionStart) - new Date(a.sessionStart))
        .slice(0, 50),
      // Performance data
      performance: {
        thisWeek: thisWeekAgg,
        lastWeek: lastWeekAgg,
        deltas: weeklyDeltas,
        thisWeekScore,
        lastWeekScore,
        sessionMetricsTrend,
      },
    };
    this.historicalCacheTime = now;
    return this.historicalCache;
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────

const manager = new SessionManager();
manager.startPolling();

const sseClients = new Map();
const globalClients = new Set();

manager.onUpdate = (sessionId, stats) => {
  const clients = sseClients.get(sessionId);
  if (clients) {
    const data = JSON.stringify(stats);
    for (const res of clients) {
      try { res.write(`event: stats\ndata: ${data}\n\n`); } catch {}
    }
  }
  const listData = JSON.stringify(manager.getSessionList());
  for (const res of globalClients) {
    try { res.write(`event: sessions\ndata: ${listData}\n\n`); } catch {}
  }
};

setInterval(() => {
  const listData = JSON.stringify(manager.getSessionList());
  for (const res of globalClients) {
    try { res.write(`event: sessions\ndata: ${listData}\n\n`); } catch {}
  }
}, 5000);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Health endpoint (replaces ctrl-daemon /health)
  if (url.pathname === '/health') {
    const sessions = manager.getSessionList();
    const active = sessions.filter(s =>
      s.lastActivity && (Date.now() - new Date(s.lastActivity).getTime() < 60000)
    ).length;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      sessions: sessions.length,
      active,
      uptime: process.uptime(),
      version: '2.0.0',
    }));
    return;
  }

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

  if (url.pathname === '/api/analytics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manager.getAnalytics()));
    return;
  }

  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`event: sessions\ndata: ${JSON.stringify(manager.getSessionList())}\n\n`);

    const sessionId = url.searchParams.get('session') || manager.getLatestSessionId();
    if (sessionId) {
      const stats = manager.getSession(sessionId);
      if (stats) res.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);
      if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set());
      sseClients.get(sessionId).add(res);
    }

    globalClients.add(res);
    req.on('close', () => {
      globalClients.delete(res);
      for (const [, clients] of sseClients) clients.delete(res);
    });
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
  console.log(`Arsenal Dashboard: http://localhost:${PORT}`);
  console.log(`Monitoring ${count} session${count !== 1 ? 's' : ''} | Analytics: /api/analytics | Health: /health`);
});

process.on('SIGINT', () => { manager.stop(); server.close(); process.exit(0); });
process.on('uncaughtException', (err) => { console.error('Uncaught:', err.message); });
