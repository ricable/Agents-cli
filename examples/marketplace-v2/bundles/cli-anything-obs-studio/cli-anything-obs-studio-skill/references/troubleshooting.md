# Troubleshooting — cli-anything-obs-studio

## OBS Studio Not Found

If you see "Binary not found" errors:

```bash
brew install --cask obs  # or https://obsproject.com/download
```

## Python Bindings Missing

Install required bindings:

```bash
uv pip install obsws-python obs-websocket-py
```

## JSON Output Issues

All commands support `--json`. If output is not valid JSON, check:
1. The command completed successfully (exit code 0)
2. No extra print statements in custom backends
3. stderr is separate from stdout

## Backend Connection Issues

Ensure the API server is running and accessible.
