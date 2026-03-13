# cli-anything-shotcut

Agent-native CLI wrapper for **Shotcut** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-shotcut --help

# JSON output mode
cli-anything-shotcut --json project list

# Version
cli-anything-shotcut --version
```

## Command Groups

- `cli-anything-shotcut project` — Project operations
- `cli-anything-shotcut timeline` — Timeline operations
- `cli-anything-shotcut clip` — Clip operations
- `cli-anything-shotcut filter` — Filter operations
- `cli-anything-shotcut export` — Export operations

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
