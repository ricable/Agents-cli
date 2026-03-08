---
name: IP-Adapter
version: 0.0.0
description: "CLI tool: IP-Adapter. Use this skill when working with IP-Adapter-related tasks."
ingredients:
  - tencent-ailab/IP-Adapter
tags:
  - cli
---

# IP-Adapter

CLI tool: IP-Adapter

## Usage

```bash
# Show help
IP-Adapter --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run IP-Adapter -- --help --json

# Introspect command schema
agents-cli schema IP-Adapter --json

# Dry-run before executing
agents-cli run IP-Adapter -- <args> --dry-run
```
