---
name: instructor-js
version: 1.7.0
description: "CLI tool: instructor-js. Use this skill when working with instructor-js-related tasks."
ingredients:
  - instructor-ai/instructor-js
tags:
  - cli
---

# instructor-js

CLI tool: instructor-js

## Usage

```bash
# Show help
instructor-js --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run instructor-js -- --help --json

# Introspect command schema
agents-cli schema instructor-js --json

# Dry-run before executing
agents-cli run instructor-js -- <args> --dry-run
```
