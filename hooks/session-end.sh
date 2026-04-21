#!/bin/bash
# Hook: Stop
# Logs session end summary to audit trail

LOGFILE=~/.claude/audit.log
END=$(date -Iseconds)
echo "Session ended at $END" >> "$LOGFILE"

TOOL_COUNT=$(grep -c '^\[' "$LOGFILE" 2>/dev/null || echo 0)
SESSION_LINES=$(wc -l < "$LOGFILE" 2>/dev/null || echo 0)
echo "Session summary: $TOOL_COUNT tool calls logged, $SESSION_LINES total audit lines" >> "$LOGFILE"
echo "---" >> "$LOGFILE"
