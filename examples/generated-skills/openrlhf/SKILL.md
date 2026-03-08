---
name: OpenRLHF
version: 0.0.0
description: "CLI tool: OpenRLHF. Use this skill when working with OpenRLHF-related tasks."
ingredients:
  - OpenRLHF/OpenRLHF
tags:
  - cli
---

# OpenRLHF

CLI tool: OpenRLHF

## Usage

```bash
# Show help
OpenRLHF --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run OpenRLHF -- --help --json

# Introspect command schema
agents-cli schema OpenRLHF --json

# Dry-run before executing
agents-cli run OpenRLHF -- <args> --dry-run
```
