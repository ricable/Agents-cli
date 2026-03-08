---
name: PyMuPDF
version: 0.0.0
description: "CLI tool: PyMuPDF. Use this skill when working with PyMuPDF-related tasks."
ingredients:
  - pymupdf/PyMuPDF
tags:
  - cli
---

# PyMuPDF

CLI tool: PyMuPDF

## Usage

```bash
# Show help
PyMuPDF --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run PyMuPDF -- --help --json

# Introspect command schema
agents-cli schema PyMuPDF --json

# Dry-run before executing
agents-cli run PyMuPDF -- <args> --dry-run
```
