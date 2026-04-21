#!/bin/bash
# Hook: Notification
# Shows a Windows popup when Claude needs attention

powershell.exe -NoProfile -Command \
  "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code', 'OK', 'Information')" \
  2>/dev/null || true
