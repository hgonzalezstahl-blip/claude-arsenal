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

# Install Echo (personal ghostwriter) — top-level agent + reference subfolder + slash command
echo ""
echo "Installing Echo (ghostwriter)..."
if [ -f "$SCRIPT_DIR/agents/echo.md" ]; then
  cp "$SCRIPT_DIR/agents/echo.md" "$AGENTS_DIR/echo.md"
  echo "  + echo.md"
fi
if [ -d "$SCRIPT_DIR/agents/echo" ]; then
  mkdir -p "$AGENTS_DIR/echo"
  cp "$SCRIPT_DIR/agents/echo/anti-ai-tells.md" "$AGENTS_DIR/echo/anti-ai-tells.md"
  echo "  + echo/anti-ai-tells.md"
  # Always refresh the template
  cp "$SCRIPT_DIR/agents/echo/style-profile.template.md" "$AGENTS_DIR/echo/style-profile.template.md"
  echo "  + echo/style-profile.template.md"
  # Only seed the personal profile if it doesn't exist (never overwrite samples)
  if [ ! -f "$AGENTS_DIR/echo/style-profile.md" ]; then
    cp "$SCRIPT_DIR/agents/echo/style-profile.template.md" "$AGENTS_DIR/echo/style-profile.md"
    echo "  + echo/style-profile.md (seeded from template — fill in samples)"
  else
    echo "  = echo/style-profile.md (preserved — your samples are safe)"
  fi
fi

# Install Pitch (resume + cover letter agent) — agent + reference subfolder
echo ""
echo "Installing Pitch (resume tailoring)..."
if [ -f "$SCRIPT_DIR/agents/pitch.md" ]; then
  cp "$SCRIPT_DIR/agents/pitch.md" "$AGENTS_DIR/pitch.md"
  echo "  + pitch.md"
fi
if [ -d "$SCRIPT_DIR/agents/pitch" ]; then
  mkdir -p "$AGENTS_DIR/pitch"
  cp "$SCRIPT_DIR/agents/pitch/resume-playbook.md" "$AGENTS_DIR/pitch/resume-playbook.md"
  echo "  + pitch/resume-playbook.md"
  cp "$SCRIPT_DIR/agents/pitch/no-fabrication-protocol.md" "$AGENTS_DIR/pitch/no-fabrication-protocol.md"
  echo "  + pitch/no-fabrication-protocol.md"
  cp "$SCRIPT_DIR/agents/pitch/resume-format.md" "$AGENTS_DIR/pitch/resume-format.md"
  echo "  + pitch/resume-format.md"
  # Always refresh templates
  cp "$SCRIPT_DIR/agents/pitch/master-cv.template.md" "$AGENTS_DIR/pitch/master-cv.template.md"
  cp "$SCRIPT_DIR/agents/pitch/job-target.template.md" "$AGENTS_DIR/pitch/job-target.template.md"
  echo "  + pitch/master-cv.template.md"
  echo "  + pitch/job-target.template.md"
  # Seed the personal files only if they don't exist (never overwrite real CV / active application)
  if [ ! -f "$AGENTS_DIR/pitch/master-cv.md" ]; then
    cp "$SCRIPT_DIR/agents/pitch/master-cv.template.md" "$AGENTS_DIR/pitch/master-cv.md"
    echo "  + pitch/master-cv.md (seeded from template — fill in your career history)"
  else
    echo "  = pitch/master-cv.md (preserved — your career history is safe)"
  fi
  if [ ! -f "$AGENTS_DIR/pitch/job-target.md" ]; then
    cp "$SCRIPT_DIR/agents/pitch/job-target.template.md" "$AGENTS_DIR/pitch/job-target.md"
    echo "  + pitch/job-target.md (seeded from template — overwrite per application)"
  else
    echo "  = pitch/job-target.md (preserved)"
  fi
fi

# Install slash commands
COMMANDS_DIR="${CLAUDE_DIR}/commands"
if [ -d "$SCRIPT_DIR/commands" ]; then
  echo ""
  echo "Installing slash commands..."
  mkdir -p "$COMMANDS_DIR"
  for cmd in "$SCRIPT_DIR/commands"/*.md; do
    if [ -f "$cmd" ]; then
      filename=$(basename "$cmd")
      cp "$cmd" "$COMMANDS_DIR/$filename"
      echo "  + $filename"
    fi
  done
fi

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
