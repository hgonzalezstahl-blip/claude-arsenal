#!/bin/bash
# Hook: PostToolUse (Bash)
# Logs every bash command to audit trail

echo "[$(date -Iseconds)] $CLAUDE_TOOL_INPUT" >> ~/.claude/audit.log 2>/dev/null || true
