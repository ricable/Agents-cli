# cli-anything-drawio

Agent-native CLI wrapper for **Draw.io** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-drawio --help

# JSON output mode
cli-anything-drawio --json diagram list

# Version
cli-anything-drawio --version
```

## Command Groups

- `cli-anything-drawio diagram` — Diagram operations
- `cli-anything-drawio shape` — Shape operations
- `cli-anything-drawio connection` — Connection operations
- `cli-anything-drawio export` — Export operations
- `cli-anything-drawio style` — Style operations

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
