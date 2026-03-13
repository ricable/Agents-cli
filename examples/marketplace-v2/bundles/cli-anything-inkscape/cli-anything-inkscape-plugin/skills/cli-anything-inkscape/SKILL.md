---
name: cli-anything-inkscape
description: "Use when editing documents, managing object, managing path in Inkscape. Do NOT use for manual GUI interaction or unsupported Inkscape plugins. Wraps Inkscape, lxml, svgwrite via subprocess backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - lxml
  - svgwrite
tags:
  - creative
  - subprocess
  - cli-wrapper
  - agent-native
  - inkscape
allowed-tools:
  - cli-anything-inkscape
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Inkscape. 30 commands across 6 groups: document, object, path, text, export, transform. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-inkscape --json <group> <command> [args]"
---

# cli-anything-inkscape

Agent-native CLI wrapper for **Inkscape** with structured JSON output.
Install: `brew install --cask inkscape  # or https://inkscape.org/release/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-inkscape --version
cli-anything-inkscape --help

# JSON mode
cli-anything-inkscape --json document list
```

## Commands

### document

```bash
cli-anything-inkscape --json document list
cli-anything-inkscape --json document create
```

### object

```bash
cli-anything-inkscape --json object list
cli-anything-inkscape --json object create
```

### path

```bash
cli-anything-inkscape --json path list
cli-anything-inkscape --json path create
```

### text

```bash
cli-anything-inkscape --json text list
cli-anything-inkscape --json text create
```

### export

```bash
cli-anything-inkscape --json export list
cli-anything-inkscape --json export create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "document-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (98 tests)

```bash
pytest tests/ -v                  # All 98 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Inkscape
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
