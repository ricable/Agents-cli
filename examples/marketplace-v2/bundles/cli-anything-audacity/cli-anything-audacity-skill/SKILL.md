---
name: cli-anything-audacity
description: "Use when managing projects, managing audio tracks, applying effects in Audacity. Do NOT use for manual GUI interaction or unsupported Audacity plugins. Wraps Audacity, pydub, soundfile via subprocess backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - pydub
  - soundfile
  - scipy.io.wavfile
tags:
  - creative
  - subprocess
  - cli-wrapper
  - agent-native
  - audacity
allowed-tools:
  - cli-anything-audacity
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for Audacity. 30 commands across 6 groups: project, track, effect, export, analyze, generate. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-audacity --json <group> <command> [args]"
---

# cli-anything-audacity

Agent-native CLI wrapper for **Audacity** with structured JSON output.
Install: `brew install --cask audacity  # or https://www.audacityteam.org/download/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-audacity --version
cli-anything-audacity --help

# JSON mode
cli-anything-audacity --json project list
```

## Commands

### project

```bash
cli-anything-audacity --json project list
cli-anything-audacity --json project create
```

### track

```bash
cli-anything-audacity --json track list
cli-anything-audacity --json track create
```

### effect

```bash
cli-anything-audacity --json effect list
cli-anything-audacity --json effect create
```

### export

```bash
cli-anything-audacity --json export list
cli-anything-audacity --json export create
```

### analyze

```bash
cli-anything-audacity --json analyze list
cli-anything-audacity --json analyze create
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
pytest tests/ -m integration      # Requires Audacity
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
