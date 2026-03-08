---
name: cortex.cpp
version: 0.0.0
description: "CLI tool: cortex.cpp. Use this skill when working with cortex.cpp-related tasks."
ingredients:
  - janhq/cortex.cpp
tags:
  - cli
---

# cortex.cpp

CLI tool: cortex.cpp

## Usage

```bash
# Show help
cortex.cpp --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run cortex.cpp -- --help --json

# Introspect command schema
agents-cli schema cortex.cpp --json

# Dry-run before executing
agents-cli run cortex.cpp -- <args> --dry-run
```
