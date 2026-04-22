#!/bin/bash
# Hook: SessionStart
# Auto-starts ccproxy if not already running

CCPROXY="$HOME/.local/bin/ccproxy.exe"

# Check if ccproxy is installed
if [ ! -f "$CCPROXY" ]; then
  exit 0
fi

# Check if already running on port 4000
if curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
  exit 0
fi

# Start in background, detached
"$CCPROXY" start --detach >/dev/null 2>&1 || true

exit 0
