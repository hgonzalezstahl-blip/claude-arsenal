#!/bin/bash
# Hook: PreToolUse (Edit|Write)
# Blocks edits to sensitive files (.env, credentials, secrets, private keys)

FILE=$(echo "$CLAUDE_TOOL_INPUT" | node -e "
  const d=require('fs').readFileSync(0,'utf8');
  try { console.log(JSON.parse(d).file_path || ''); } catch { console.log(''); }
" 2>/dev/null)

if echo "$FILE" | grep -qiE '(\.env|\.env\.|credentials|secrets|id_rsa|private\.key)' 2>/dev/null; then
  echo "BLOCKED: Cannot edit sensitive files (.env, credentials, secrets, private keys)"
  exit 1
fi
