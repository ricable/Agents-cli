# cli-anything-libreoffice

Agent-native CLI wrapper for **LibreOffice** with structured JSON output.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Show help
cli-anything-libreoffice --help

# JSON output mode
cli-anything-libreoffice --json document list

# Version
cli-anything-libreoffice --version
```

## Command Groups

- `cli-anything-libreoffice document` — Document operations
- `cli-anything-libreoffice spreadsheet` — Spreadsheet operations
- `cli-anything-libreoffice presentation` — Presentation operations
- `cli-anything-libreoffice convert` — Convert operations
- `cli-anything-libreoffice macro` — Macro operations
- `cli-anything-libreoffice template` — Template operations

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

Uses: python-docx, openpyxl, python-pptx, odfpy

## License

MIT
