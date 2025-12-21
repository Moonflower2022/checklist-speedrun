# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Flask-based keyboard-driven todo checklist application with hierarchical task structure, timer tracking, and Google Sheets integration for logging completion times.

## Running the Application

```bash
python todo_app.py
```

Server runs on `http://localhost:5001`

## Dependencies

```bash
pip install flask google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

## Architecture

**Single-file Flask app** (`todo_app.py`):
- Serves static HTML template (`templates/todo_app.html`)
- Provides REST API for checklist data and time logging
- Integrates with Google Sheets API for completion time tracking

**Frontend** (`templates/todo_app.html`):
- Single-page app with vanilla JavaScript
- Keyboard-driven navigation (configurable via `keyboard_shortcuts.json`)
- Timer functionality with undo/redo support
- Markdown rendering for checklist items using marked.js
- System-aware light/dark mode with manual toggle

**Checklist Structure**:
- JSON files stored in `checklists/` directory
- Hierarchical format: leaf items have `null`, parent items have nested objects
- Parent items auto-complete when all children are done (no checkboxes on parents)
- Item text supports Markdown formatting

## Google Sheets Integration

**Service Account Setup**:
- Credentials file: `/Users/hq/tools/data_logging/credentials.json`
- Configure `SPREADSHEET_ID` and `SHEET_NAME` in `todo_app.py`

**Column Mapping**:
- Edit `CHECKLIST_COLUMN_MAP` in `todo_app.py` to map checklist names to spreadsheet columns
- "morning" and "morning (rushed)" → "Day" column (B)
- "night" → "Night" column (C)

**Date Logic**:
- If current time is before 6 AM, logs to previous day's row
- Date format: M/D/YYYY (no leading zeros)
- Time format: "1h 23m" or "45m"

## Key Features

**Auto-start Timer**: Timer automatically starts when switching checklists

**Completion Celebration**: Confetti animation and modal when checklist is completed

**Smart Navigation**: Arrow keys skip parent items (unless they only have pipe-wrapped children)

**Reset & Restart**: Shift+X clears checklist, resets timer, and returns to first item

## Customization

**Keyboard Shortcuts**: Edit `keyboard_shortcuts.json` to change key bindings

**Styling**: CSS variables in `templates/todo_app.html` control theming (light/dark mode colors)

## Key Constraints

- Keep Python files under 100 lines (preferably <50)
- Minimal error handling and docstrings
- Simple, straightforward implementations
