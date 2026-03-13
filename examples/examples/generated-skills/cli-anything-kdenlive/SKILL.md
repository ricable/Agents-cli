---
name: cli-anything-kdenlive
description: "Use when managing projects, managing timeline, managing clip in Kdenlive. Do NOT use for manual GUI interaction or unsupported Kdenlive plugins. Wraps Kdenlive, lxml via subprocess backend."
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
  - kdenlive
allowed-tools:
  - cli-anything-kdenlive
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Kdenlive. 30 commands across 6 groups: project, timeline, clip, effect, transition, render. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-kdenlive --json <group> <command> [args]"
---

# cli-anything-kdenlive

Agent-native CLI wrapper for **Kdenlive** with structured JSON output.
Install: `brew install --cask kdenlive  # or https://kdenlive.org/download/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-kdenlive --version
cli-anything-kdenlive --help

# JSON mode
cli-anything-kdenlive --json project list
```

## Commands

### project

```bash
cli-anything-kdenlive --json project list
cli-anything-kdenlive --json project create
```

### timeline

```bash
cli-anything-kdenlive --json timeline list
cli-anything-kdenlive --json timeline create
```

### clip

```bash
cli-anything-kdenlive --json clip list
cli-anything-kdenlive --json clip create
```

### effect

```bash
cli-anything-kdenlive --json effect list
cli-anything-kdenlive --json effect create
```

### transition

```bash
cli-anything-kdenlive --json transition list
cli-anything-kdenlive --json transition create
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

## Testing (98 tests)

```bash
pytest tests/ -v                  # All 98 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires Kdenlive
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
