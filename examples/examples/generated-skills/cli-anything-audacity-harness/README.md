# cli-anything-audacity

Agent-native CLI wrapper for **Audacity** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-audacity --help

# JSON output mode
cli-anything-audacity --json project list

# Version
cli-anything-audacity --version
```

## Command Groups

- `cli-anything-audacity project` — Project operations
- `cli-anything-audacity track` — Track operations
- `cli-anything-audacity effect` — Effect operations
- `cli-anything-audacity export` — Export operations
- `cli-anything-audacity analyze` — Analyze operations
- `cli-anything-audacity generate` — Generate operations

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

Uses: pydub, soundfile, scipy.io.wavfile

## License

MIT
