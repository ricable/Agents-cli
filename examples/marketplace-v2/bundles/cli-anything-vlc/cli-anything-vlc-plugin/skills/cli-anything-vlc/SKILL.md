---
name: cli-anything-vlc
description: "Use when managing playback, managing playlist, managing stream in VLC. Do NOT use for manual GUI interaction or unsupported VLC plugins. Wraps VLC, python-vlc via subprocess backend."
version: 0.1.0
domain: creative-tools
ingredients:
  - cli-anything-core
  - python-vlc
tags:
  - creative
  - subprocess
  - cli-wrapper
  - agent-native
  - vlc
allowed-tools:
  - cli-anything-vlc
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for VLC. 25 commands across 5 groups: playback, playlist, stream, transcode, info. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-vlc --json <group> <command> [args]"
---

# cli-anything-vlc

Agent-native CLI wrapper for **VLC** with structured JSON output.
Install: `brew install --cask vlc  # or https://www.videolan.org/vlc/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-vlc --version
cli-anything-vlc --help

# JSON mode
cli-anything-vlc --json playback list
```

## Commands

### playback

```bash
cli-anything-vlc --json playback list
cli-anything-vlc --json playback create
```

### playlist

```bash
cli-anything-vlc --json playlist list
cli-anything-vlc --json playlist create
```

### stream

```bash
cli-anything-vlc --json stream list
cli-anything-vlc --json stream create
```

### transcode

```bash
cli-anything-vlc --json transcode list
cli-anything-vlc --json transcode create
```

### info

```bash
cli-anything-vlc --json info list
cli-anything-vlc --json info create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "playback-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (82 tests)

```bash
pytest tests/ -v                  # All 82 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires VLC
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
