---
name: csvkit
version: 0.0.0
description: "A suite of utilities for converting to and working with CSV, the king of tabular file formats.. Use this skill when working with csvkit-related tasks."
ingredients:
  - wireservice/csvkit
tags:
  - cli
# homepage: https://csvkit.readthedocs.io
# license: MIT
---

# csvkit

A suite of utilities for converting to and working with CSV, the king of tabular file formats.

**Source**: https://csvkit.readthedocs.io

## Usage

```bash
# Show help
csvkit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run csvkit -- --help --json

# Introspect command schema
agents-cli schema csvkit --json

# Dry-run before executing
agents-cli run csvkit -- <args> --dry-run
```
