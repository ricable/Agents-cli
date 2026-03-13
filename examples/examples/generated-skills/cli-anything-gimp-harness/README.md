# cli-anything-gimp

Agent-native CLI wrapper for **GIMP** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-gimp --help

# JSON output mode
cli-anything-gimp --json project list

# Version
cli-anything-gimp --version
```

## Command Groups

- `cli-anything-gimp project` — Project operations
- `cli-anything-gimp image` — Image operations
- `cli-anything-gimp layer` — Layer operations
- `cli-anything-gimp filter` — Filter operations
- `cli-anything-gimp color` — Color operations
- `cli-anything-gimp batch` — Batch operations
- `cli-anything-gimp export` — Export operations

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

## Backend: python-binding

Uses: Pillow, gi.repository.Gimp

## License

MIT
