---
name: cli-anything-libreoffice
description: "Use when editing documents, managing spreadsheet, managing presentation in LibreOffice. Do NOT use for manual GUI interaction or unsupported LibreOffice plugins. Wraps LibreOffice, python-docx, openpyxl via subprocess backend."
version: 0.1.0
domain: office-tools
ingredients:
  - cli-anything-core
  - python-docx
  - openpyxl
  - python-pptx
  - odfpy
tags:
  - office
  - subprocess
  - cli-wrapper
  - agent-native
  - libreoffice
allowed-tools:
  - cli-anything-libreoffice
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for LibreOffice. 30 commands across 6 groups: document, spreadsheet, presentation, convert, macro, template. Backend: subprocess. All commands support --json for structured output."
argument-hint: "cli-anything-libreoffice --json <group> <command> [args]"
---

# cli-anything-libreoffice

Agent-native CLI wrapper for **LibreOffice** with structured JSON output.
Install: `brew install --cask libreoffice  # or https://www.libreoffice.org/download/`

## Quick Start

```bash
# Install harness
uv pip install -e .

# Verify
cli-anything-libreoffice --version
cli-anything-libreoffice --help

# JSON mode
cli-anything-libreoffice --json document list
```

## Commands

### document

```bash
cli-anything-libreoffice --json document list
cli-anything-libreoffice --json document create
```

### spreadsheet

```bash
cli-anything-libreoffice --json spreadsheet list
cli-anything-libreoffice --json spreadsheet create
```

### presentation

```bash
cli-anything-libreoffice --json presentation list
cli-anything-libreoffice --json presentation create
```

### convert

```bash
cli-anything-libreoffice --json convert list
cli-anything-libreoffice --json convert create
```

### macro

```bash
cli-anything-libreoffice --json macro list
cli-anything-libreoffice --json macro create
```

## JSON Output Format

```json
{
  "ok": true,
  "command": "document-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
```

## Testing (98 tests)

```bash
pytest tests/ -v                  # All 98 tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires LibreOffice
```

## Quality Gate

Overall: 94/100 (PASS)

| Axis | Score | Threshold |
|------|-------|-----------|
| trigger | 100 | 80 |
| quality | 85 | 80 |
| content | 80 | 80 |
| testCoverage | 100 | 80 |
| apiCompleteness | 100 | 80 |
| reliability | 100 | 80 |
