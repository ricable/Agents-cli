---
name: cli-anything-shotcut
description: "Use when managing projects, managing timeline, managing clip in Shotcut. Do NOT use for manual GUI interaction or unsupported Shotcut plugins. Wraps Shotcut, lxml via subprocess backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - lxml
tags:
  - creative
  - subprocess
  - cli-wrapper
  - agent-native
  - shotcut
allowed-tools:
  - cli-anything-shotcut
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Shotcut. 25 commands across 5 groups: project, timeline, clip, filter, export. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-shotcut --json <group> <command> [args]"
---

# cli-anything-shotcut

Agent-native CLI wrapper for **Shotcut** with structured JSON output.
Install: `brew install --cask shotcut  # or https://shotcut.org/download/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-shotcut --version
cli-anything-shotcut --help

# JSON mode
cli-anything-shotcut --json project list
```

## Commands

### project

```bash
cli-anything-shotcut --json project list
cli-anything-shotcut --json project create
```

### timeline

```bash
cli-anything-shotcut --json timeline list
cli-anything-shotcut --json timeline create
```

### clip

```bash
cli-anything-shotcut --json clip list
cli-anything-shotcut --json clip create
```

### filter

```bash
cli-anything-shotcut --json filter list
cli-anything-shotcut --json filter create
```

### export

```bash
cli-anything-shotcut --json export list
cli-anything-shotcut --json export create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "project-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (82 tests)

```bash
pytest tests/ -v                  # All 82 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Shotcut
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
