---
name: cli-anything-zoom
description: "Use when scheduling meetings, managing user, managing recording in Zoom. Do NOT use for manual GUI interaction or unsupported Zoom plugins. Wraps Zoom, requests via rest-api backend."
version: 0.1.0
domain: communication
ingredients:
  - cli-anything-core
  - requests
tags:
  - communication
  - rest-api
  - cli-wrapper
  - agent-native
  - zoom
allowed-tools:
  - cli-anything-zoom
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Zoom. 25 commands across 5 groups: meeting, user, recording, report, webinar. Backend: rest-api. All commands support --json for structured output."
argument-hint: "cli-anything-zoom --json <group> <command> [args]"
---

# cli-anything-zoom

Agent-native CLI wrapper for **Zoom** with structured JSON output.
Install: `brew install --cask zoom  # or https://zoom.us/download`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-zoom --version
cli-anything-zoom --help

# JSON mode
cli-anything-zoom --json meeting list
```

## Commands

### meeting

```bash
cli-anything-zoom --json meeting list
cli-anything-zoom --json meeting create
```

### user

```bash
cli-anything-zoom --json user list
cli-anything-zoom --json user create
```

### recording

```bash
cli-anything-zoom --json recording list
cli-anything-zoom --json recording create
```

### report

```bash
cli-anything-zoom --json report list
cli-anything-zoom --json report create
```

### webinar

```bash
cli-anything-zoom --json webinar list
cli-anything-zoom --json webinar create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "meeting-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (82 tests)

```bash
pytest tests/ -v                  # All 82 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Zoom
```

## Quality Gate

Overall: 94/100 (PASS)

| Axis | Score | Threshold |
|------|-------|-----------|
| trigger | 100 | 80 |
| quality | 85 | 80 |
| content | 80 | 80 |
| testCoverage | 100 | 80 |
| apiCompleteness | 100 | 80 |
| reliability | 100 | 80 |
