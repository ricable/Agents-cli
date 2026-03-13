# cli-anything-blender

Agent-native CLI wrapper for **Blender** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-blender --help

# JSON output mode
cli-anything-blender --json scene list

# Version
cli-anything-blender --version
```

## Command Groups

- `cli-anything-blender scene` — Scene operations
- `cli-anything-blender object` — Object operations
- `cli-anything-blender mesh` — Mesh operations
- `cli-anything-blender material` — Material operations
- `cli-anything-blender render` — Render operations
- `cli-anything-blender animation` — Animation operations
- `cli-anything-blender modifier` — Modifier operations
- `cli-anything-blender export` — Export operations

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

Uses: bpy

## License

MIT
