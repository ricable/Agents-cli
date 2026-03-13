---
name: cli-anything-obs-studio
description: "Use when managing 3D scenes, managing source, managing stream in OBS Studio. Do NOT use for manual GUI interaction or unsupported OBS Studio plugins. Wraps OBS Studio, obsws-python, obs-websocket-py via rest-api backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - obsws-python
  - obs-websocket-py
tags:
  - creative
  - rest-api
  - cli-wrapper
  - agent-native
  - obs-studio
allowed-tools:
  - cli-anything-obs-studio
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for OBS Studio. 30 commands across 6 groups: scene, source, stream, record, filter, transition. Backend: rest-api. All commands support --json for structured output."
argument-hint: "cli-anything-obs-studio --json <group> <command> [args]"
---

# cli-anything-obs-studio

Agent-native CLI wrapper for **OBS Studio** with structured JSON output.
Install: `brew install --cask obs  # or https://obsproject.com/download`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-obs-studio --version
cli-anything-obs-studio --help

# JSON mode
cli-anything-obs-studio --json scene list
```

## Commands

### scene

```bash
cli-anything-obs-studio --json scene list
cli-anything-obs-studio --json scene create
```

### source

```bash
cli-anything-obs-studio --json source list
cli-anything-obs-studio --json source create
```

### stream

```bash
cli-anything-obs-studio --json stream list
cli-anything-obs-studio --json stream create
```

### record

```bash
cli-anything-obs-studio --json record list
cli-anything-obs-studio --json record create
```

### filter

```bash
cli-anything-obs-studio --json filter list
cli-anything-obs-studio --json filter create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "scene-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (98 tests)

```bash
pytest tests/ -v                  # All 98 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires OBS Studio
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
