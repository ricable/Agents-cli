# Troubleshooting — cli-anything-gimp

## GIMP Not Found

If you see "Binary not found" errors:

```bash
brew install --cask gimp  # or https://www.gimp.org/downloads/
```

## Python Bindings Missing

Install required bindings:

```bash
uv pip install Pillow gi.repository.Gimp
```

## JSON Output Issues

All commands support `--json`. If output is not valid JSON, check:
1. The command completed successfully (exit code 0)
2. No extra print statements in custom backends
3. stderr is separate from stdout

## Backend Connection Issues

Verify Python bindings are importable: `python -c 'import Pillow'`
