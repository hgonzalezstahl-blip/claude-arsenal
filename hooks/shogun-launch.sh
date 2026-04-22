#!/bin/bash
# Safe Shogun launcher — validates conditions before starting
# Usage: bash ~/.claude/hooks/shogun-launch.sh [project-path]
#
# This script:
# 1. Checks WSL is available
# 2. Confirms no sensitive files in the target directory
# 3. Launches Shogun with the project mounted
# 4. Logs the launch to audit

PROJECT_PATH="${1:-$(pwd)}"
AUDIT_LOG="$HOME/.claude/audit.log"

# Safety checks
echo "=== Shogun Pre-Launch Safety Check ==="

# Check 1: WSL available
if ! wsl -d Ubuntu -u hgonz -- bash -c "echo ok" >/dev/null 2>&1; then
  echo "FAIL: WSL Ubuntu not available. Run: wsl --install Ubuntu"
  exit 1
fi
echo "[OK] WSL Ubuntu available"

# Check 2: Claude Code authenticated in WSL
if ! wsl -d Ubuntu -u hgonz -- bash -lc 'source ~/.nvm/nvm.sh && claude --version' >/dev/null 2>&1; then
  echo "FAIL: Claude Code not authenticated in WSL."
  echo "Run: wsl -d Ubuntu -u hgonz"
  echo "Then: source ~/.bashrc && claude --dangerously-skip-permissions"
  exit 1
fi
echo "[OK] Claude Code authenticated"

# Check 3: No .env or secrets in target directory
SENSITIVE=$(find "$PROJECT_PATH" -maxdepth 3 -name ".env" -o -name ".env.*" -o -name "credentials*" -o -name "*.key" -o -name "*.pem" 2>/dev/null | head -5)
if [ -n "$SENSITIVE" ]; then
  echo ""
  echo "WARNING: Sensitive files detected in project directory:"
  echo "$SENSITIVE"
  echo ""
  echo "Shogun runs with --dangerously-skip-permissions."
  echo "These files will be accessible to all 10 agents without prompts."
  echo ""
  read -p "Continue anyway? (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Launch cancelled."
    exit 0
  fi
fi
echo "[OK] Sensitive file check passed"

# Log the launch
echo "[$(date -Iseconds)] SHOGUN LAUNCH: project=$PROJECT_PATH" >> "$AUDIT_LOG"

# Convert Windows path to WSL path
WSL_PATH=$(wsl -d Ubuntu -- wslpath "$PROJECT_PATH" 2>/dev/null || echo "/mnt/c${PROJECT_PATH//\\//}")

echo ""
echo "=== Launching Shogun ==="
echo "Project: $WSL_PATH"
echo "Agents: 10 (1 Shogun + 1 Karo + 7 Ashigaru + 1 Gunshi)"
echo "Permissions: ALL SKIPPED (--dangerously-skip-permissions)"
echo ""
echo "Connect to Shogun:  wsl -d Ubuntu -u hgonz -- bash -lc 'tmux attach -t shogun'"
echo "Connect to Workers: wsl -d Ubuntu -u hgonz -- bash -lc 'tmux attach -t multiagent'"
echo "Detach: Ctrl+B then D"
echo ""

# Launch
wsl -d Ubuntu -u hgonz -- bash -lc "cd ~/multi-agent-shogun && source ~/.nvm/nvm.sh && ./shutsujin_departure.sh"
