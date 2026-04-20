#!/bin/bash
# Launch Claude Code Session Dashboard
# Usage: bash ~/.claude/dashboard/launch.sh [--port 3333]
cd "$(dirname "$0")"
echo "Starting Claude Code Dashboard..."
node server.js "$@" &
SERVER_PID=$!
sleep 1
# Open in browser
if command -v explorer.exe &>/dev/null; then
  explorer.exe "http://localhost:${2:-3333}"
elif command -v open &>/dev/null; then
  open "http://localhost:${2:-3333}"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:${2:-3333}"
fi
echo "Dashboard PID: $SERVER_PID"
echo "Press Ctrl+C to stop"
wait $SERVER_PID
