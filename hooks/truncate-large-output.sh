#!/bin/bash
# Hook: PostToolUse (Bash|Read)
# Warns when tool output exceeds token-budget threshold
# Large outputs waste context window and cause attention dilution
# This hook does NOT modify the output (can't), but alerts the agent

RESULT="$CLAUDE_TOOL_RESULT"

# Count characters as a proxy for tokens (~4 chars per token)
CHAR_COUNT=${#RESULT}
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

# Thresholds
WARN_THRESHOLD=8000   # ~8K tokens - warn
ALERT_THRESHOLD=20000 # ~20K tokens - strong alert

if [ "$TOKEN_ESTIMATE" -gt "$ALERT_THRESHOLD" ]; then
  echo "CONTEXT PRESSURE ALERT: Tool output is ~${TOKEN_ESTIMATE} tokens (${CHAR_COUNT} chars). This consumes significant context window. Consider: (1) reading specific line ranges instead of full files, (2) using grep to find specific content, (3) piping bash output through head/tail/grep to reduce size."
elif [ "$TOKEN_ESTIMATE" -gt "$WARN_THRESHOLD" ]; then
  echo "CONTEXT NOTE: Tool output is ~${TOKEN_ESTIMATE} tokens. For context efficiency, prefer targeted reads over full-file reads."
fi

exit 0
