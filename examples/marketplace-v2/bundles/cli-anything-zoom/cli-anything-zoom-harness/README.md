# cli-anything-zoom

Agent-native CLI wrapper for **Zoom** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-zoom --help

# JSON output mode
cli-anything-zoom --json meeting list

# Version
cli-anything-zoom --version
```

## Command Groups

- `cli-anything-zoom meeting` — Meeting operations
- `cli-anything-zoom user` — User operations
- `cli-anything-zoom recording` — Recording operations
- `cli-anything-zoom report` — Report operations
- `cli-anything-zoom webinar` — Webinar operations

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

Uses: requests

## License

MIT
