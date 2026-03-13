---
name: cli-anything-blender
description: "Use when managing 3D scenes, managing object, managing mesh in Blender. Do NOT use for manual GUI interaction or unsupported Blender plugins. Wraps Blender, bpy via python-binding backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - bpy
tags:
  - creative
  - python-binding
  - cli-wrapper
  - agent-native
  - blender
allowed-tools:
  - cli-anything-blender
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Blender. 40 commands across 8 groups: scene, object, mesh, material, render, animation, modifier, export. Backend: python-binding. All commands support --json for structured output."
argument-hint: "cli-anything-blender --json <group> <command> [args]"
---

# cli-anything-blender

Agent-native CLI wrapper for **Blender** with structured JSON output.
Install: `brew install --cask blender  # or https://www.blender.org/download/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-blender --version
cli-anything-blender --help

# JSON mode
cli-anything-blender --json scene list
```

## Commands

### scene

```bash
cli-anything-blender --json scene list
cli-anything-blender --json scene create
```

### object

```bash
cli-anything-blender --json object list
cli-anything-blender --json object create
```

### mesh

```bash
cli-anything-blender --json mesh list
cli-anything-blender --json mesh create
```

### material

```bash
cli-anything-blender --json material list
cli-anything-blender --json material create
```

### render

```bash
cli-anything-blender --json render list
cli-anything-blender --json render create
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

## Testing (130 tests)

```bash
pytest tests/ -v                  # All 130 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Blender
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
