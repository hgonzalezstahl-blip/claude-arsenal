#!/bin/bash
# Claude Arsenal — Install Script
# Copies agents and skills to ~/.claude/ for immediate use

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
AGENTS_DIR="${CLAUDE_DIR}/agents"

echo "Claude Arsenal Installer"
echo "========================"
echo ""

# Create agents directory if it doesn't exist
mkdir -p "$AGENTS_DIR"

# Copy all agents (flat — Claude Code reads ~/.claude/agents/*.md)
echo "Installing agents..."
for category in rex luna spark vault general; do
  for agent in "$SCRIPT_DIR/agents/$category"/*.md; do
    if [ -f "$agent" ]; then
      filename=$(basename "$agent")
      cp "$agent" "$AGENTS_DIR/$filename"
      echo "  + $filename"
    fi
  done
done

# Copy dashboard
DASHBOARD_DIR="${CLAUDE_DIR}/dashboard"
echo ""
echo "Installing dashboard..."
mkdir -p "$DASHBOARD_DIR"
for file in "$SCRIPT_DIR/dashboard"/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    cp "$file" "$DASHBOARD_DIR/$filename"
    echo "  + $filename"
  fi
done

echo ""
echo "Agents installed to: $AGENTS_DIR"
echo "Dashboard installed to: $DASHBOARD_DIR"
echo ""

# Optionally copy CLAUDE.md template
if [ "$1" = "--with-claude-md" ]; then
  if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    echo "WARNING: ~/.claude/CLAUDE.md already exists."
    echo "  Backing up to ~/.claude/CLAUDE.md.backup"
    cp "$CLAUDE_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md.backup"
  fi
  cp "$SCRIPT_DIR/templates/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
  echo "CLAUDE.md template installed."
fi

echo ""
echo "Done! Restart Claude Code to pick up the new agents."
echo ""
echo "Dashboard: node ~/.claude/dashboard/server.js"
echo "  (auto-starts via SessionStart hook if configured)"
echo ""
echo "To also install the CLAUDE.md orchestration template:"
echo "  ./install.sh --with-claude-md"
echo ""
echo "To deploy the Copilot framework to a repo:"
echo "  cp -r copilot-framework/.github /path/to/your/repo/"
