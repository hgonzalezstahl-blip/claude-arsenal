#!/bin/bash
# Hook: PreToolUse (Edit|Write)
# Warns when writing Rekaliber implementation code without tests

FILE=$(echo "$CLAUDE_TOOL_INPUT" | node -e "
  const d=require('fs').readFileSync(0,'utf8');
  try { console.log(JSON.parse(d).file_path || ''); } catch { console.log(''); }
" 2>/dev/null)

# Only check Rekaliber service/controller/guard/interceptor/resolver files
if echo "$FILE" | grep -qiE 'rekaliber.*(service|controller|guard|interceptor|resolver)\.(ts|tsx)$' 2>/dev/null; then
  # Skip test files themselves
  if echo "$FILE" | grep -qiE '(\.spec\.|\.test\.|__tests__)' 2>/dev/null; then
    exit 0
  fi

  DIR=$(dirname "$FILE")
  MODULE=$(basename "$DIR")
  TESTDIR="$DIR/__tests__"

  if [ ! -d "$TESTDIR" ] || [ -z "$(ls -A "$TESTDIR" 2>/dev/null)" ]; then
    echo "TDD WARNING: Writing implementation code for $MODULE but no test files found in $TESTDIR. Write tests first (red), then implementation (green), then refactor. Create test file before or alongside implementation."
  fi
fi

exit 0
