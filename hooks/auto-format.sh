#!/bin/bash
# Hook: PostToolUse (Edit|Write)
# Auto-formats supported file types with Prettier

FILE=$(echo "$CLAUDE_TOOL_INPUT" | node -e "
  const d=require('fs').readFileSync(0,'utf8');
  try { console.log(JSON.parse(d).file_path || ''); } catch { console.log(''); }
" 2>/dev/null)

if echo "$FILE" | grep -qiE '\.(ts|tsx|js|jsx|json|css|scss|html|md)$' 2>/dev/null; then
  npx prettier --write "$FILE" 2>/dev/null || true
fi
