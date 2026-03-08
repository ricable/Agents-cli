---
name: tesseract
version: 0.0.0
description: "CLI tool: tesseract. Use this skill when working with tesseract-related tasks."
ingredients:
  - tesseract-ocr/tesseract
tags:
  - cli
---

# tesseract

CLI tool: tesseract

## Usage

```bash
# Show help
tesseract --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tesseract -- --help --json

# Introspect command schema
agents-cli schema tesseract --json

# Dry-run before executing
agents-cli run tesseract -- <args> --dry-run
```
