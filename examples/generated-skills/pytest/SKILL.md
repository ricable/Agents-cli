---
name: pytest
version: 0.0.0
description: "CLI tool: pytest. Use this skill when working with pytest-related tasks."
ingredients:
  - pytest-dev/pytest
tags:
  - cli
---

# pytest

CLI tool: pytest

## Usage

```bash
# Show help
pytest --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pytest -- --help --json

# Introspect command schema
agents-cli schema pytest --json

# Dry-run before executing
agents-cli run pytest -- <args> --dry-run
```
