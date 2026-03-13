# Troubleshooting — cli-anything-drawio

## Draw.io Not Found

If you see "Binary not found" errors:

```bash
brew install --cask drawio  # or https://github.com/jgraph/drawio-desktop/releases
```

## Python Bindings Missing

Install required bindings:

```bash
uv pip install lxml
```

## JSON Output Issues

All commands support `--json`. If output is not valid JSON, check:
1. The command completed successfully (exit code 0)
2. No extra print statements in custom backends
3. stderr is separate from stdout

## Backend Connection Issues

Verify the binary is in PATH: `which drawio`
