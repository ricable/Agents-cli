# cli-anything-kdenlive

Agent-native CLI wrapper for **Kdenlive** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-kdenlive --help

# JSON output mode
cli-anything-kdenlive --json project list

# Version
cli-anything-kdenlive --version
```

## Command Groups

- `cli-anything-kdenlive project` — Project operations
- `cli-anything-kdenlive timeline` — Timeline operations
- `cli-anything-kdenlive clip` — Clip operations
- `cli-anything-kdenlive effect` — Effect operations
- `cli-anything-kdenlive transition` — Transition operations
- `cli-anything-kdenlive render` — Render operations

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

## Backend: subprocess

Uses: lxml

## License

MIT
