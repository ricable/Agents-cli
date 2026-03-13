# cli-anything-inkscape

Agent-native CLI wrapper for **Inkscape** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-inkscape --help

# JSON output mode
cli-anything-inkscape --json document list

# Version
cli-anything-inkscape --version
```

## Command Groups

- `cli-anything-inkscape document` — Document operations
- `cli-anything-inkscape object` — Object operations
- `cli-anything-inkscape path` — Path operations
- `cli-anything-inkscape text` — Text operations
- `cli-anything-inkscape export` — Export operations
- `cli-anything-inkscape transform` — Transform operations

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

Uses: lxml, svgwrite

## License

MIT
