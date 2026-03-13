---
name: cli-anything-drawio
description: "Use when creating diagrams, managing shape, managing connection in Draw.io. Do NOT use for manual GUI interaction or unsupported Draw.io plugins. Wraps Draw.io, lxml via subprocess backend."
version: 0.1.0
domain: office-tools
ingredients:
  - cli-anything-core
  - lxml
tags:
  - office
  - subprocess
  - cli-wrapper
  - agent-native
  - drawio
allowed-tools:
  - cli-anything-drawio
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Draw.io. 25 commands across 5 groups: diagram, shape, connection, export, style. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-drawio --json <group> <command> [args]"
---

# cli-anything-drawio

Agent-native CLI wrapper for **Draw.io** with structured JSON output.
Install: `brew install --cask drawio  # or https://github.com/jgraph/drawio-desktop/releases`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-drawio --version
cli-anything-drawio --help

# JSON mode
cli-anything-drawio --json diagram list
```

## Commands

### diagram

```bash
cli-anything-drawio --json diagram list
cli-anything-drawio --json diagram create
```

### shape

```bash
cli-anything-drawio --json shape list
cli-anything-drawio --json shape create
```

### connection

```bash
cli-anything-drawio --json connection list
cli-anything-drawio --json connection create
```

### export

```bash
cli-anything-drawio --json export list
cli-anything-drawio --json export create
```

### style

```bash
cli-anything-drawio --json style list
cli-anything-drawio --json style create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "diagram-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (82 tests)

```bash
pytest tests/ -v                  # All 82 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Draw.io
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
