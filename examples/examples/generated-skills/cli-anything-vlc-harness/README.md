# cli-anything-vlc

Agent-native CLI wrapper for **VLC** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-vlc --help

# JSON output mode
cli-anything-vlc --json playback list

# Version
cli-anything-vlc --version
```

## Command Groups

- `cli-anything-vlc playback` — Playback operations
- `cli-anything-vlc playlist` — Playlist operations
- `cli-anything-vlc stream` — Stream operations
- `cli-anything-vlc transcode` — Transcode operations
- `cli-anything-vlc info` — Info operations

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

Uses: python-vlc

## License

MIT
