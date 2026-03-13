---
name: cli-anything-gimp
description: "Use when managing projects, editing images and layers, editing images and layers in GIMP. Do NOT use for manual GUI interaction or unsupported GIMP plugins. Wraps GIMP, Pillow, gi.repository.Gimp via python-binding backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - Pillow
  - gi.repository.Gimp
tags:
  - creative
  - python-binding
  - cli-wrapper
  - agent-native
  - gimp
allowed-tools:
  - cli-anything-gimp
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for GIMP. 35 commands across 7 groups: project, image, layer, filter, color, batch, export. Backend: python-binding. All commands support --json for structured output."
argument-hint: "cli-anything-gimp --json <group> <command> [args]"
---

# cli-anything-gimp

Agent-native CLI wrapper for **GIMP** with structured JSON output.
Install: `brew install --cask gimp  # or https://www.gimp.org/downloads/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-gimp --version
cli-anything-gimp --help

# JSON mode
cli-anything-gimp --json project list
```

## Commands

### project

```bash
cli-anything-gimp --json project list
cli-anything-gimp --json project create
```

### image

```bash
cli-anything-gimp --json image list
cli-anything-gimp --json image create
```

### layer

```bash
cli-anything-gimp --json layer list
cli-anything-gimp --json layer create
```

### filter

```bash
cli-anything-gimp --json filter list
cli-anything-gimp --json filter create
```

### color

```bash
cli-anything-gimp --json color list
cli-anything-gimp --json color create
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

## Testing (114 tests)

```bash
pytest tests/ -v                  # All 114 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires GIMP
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
