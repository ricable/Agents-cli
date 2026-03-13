# cli-anything-obs-studio

Agent-native CLI wrapper for **OBS Studio** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-obs-studio --help

# JSON output mode
cli-anything-obs-studio --json scene list

# Version
cli-anything-obs-studio --version
```

## Command Groups

- `cli-anything-obs-studio scene` — Scene operations
- `cli-anything-obs-studio source` — Source operations
- `cli-anything-obs-studio stream` — Stream operations
- `cli-anything-obs-studio record` — Record operations
- `cli-anything-obs-studio filter` — Filter operations
- `cli-anything-obs-studio transition` — Transition operations

## JSON Output Format

All commands support `--json` for structured output:

```json
{
  "ok": true,
  "command": "...",
  "data": { ... },
  "meta": {
    "version": "0.1.0",
    "duration": 0.123,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Backend: rest-api

Uses: obsws-python, obs-websocket-py

## License

MIT
