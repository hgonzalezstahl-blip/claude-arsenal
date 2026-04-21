#!/bin/bash
# Hook: SessionStart
# Ensures the live dashboard server is running and opens the browser

if ! curl -s http://localhost:3333/api/sessions >/dev/null 2>&1; then
  cd ~/.claude/dashboard && node server.js &disown
  sleep 1
  echo "Dashboard started at http://localhost:3333"
else
  echo "Dashboard already running at http://localhost:3333"
fi

explorer.exe "http://localhost:3333" 2>/dev/null || true
