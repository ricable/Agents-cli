---
name: podman
version: 0.0.0
description: "CLI tool: podman. Use this skill when working with podman-related tasks."
ingredients:
  - containers/podman
tags:
  - cli
---

# podman

CLI tool: podman

## Usage

```bash
# Show help
podman --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run podman -- --help --json

# Introspect command schema
agents-cli schema podman --json

# Dry-run before executing
agents-cli run podman -- <args> --dry-run
```
