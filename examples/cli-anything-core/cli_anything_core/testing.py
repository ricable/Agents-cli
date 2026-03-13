"""cli-anything-core — Testing utilities.

Provides pytest fixtures, JSON schema validators, and smoke test helpers
for CLI-Anything harnesses.
"""
import json
import subprocess
import sys
from typing import Any


# ── JSON Schema Validation ──────────────────────────────────────────────

SUPERSET_SCHEMA = {
    "type": "object",
    "required": ["ok", "command", "data", "meta"],
    "properties": {
        "ok": {"type": "boolean"},
        "command": {"type": "string"},
        "data": {"type": "object"},
        "meta": {
            "type": "object",
            "required": ["version", "duration", "timestamp"],
            "properties": {
                "version": {"type": "string"},
                "duration": {"type": "number"},
                "timestamp": {"type": "string"},
            },
        },
    },
}


def validate_json_output(output: str) -> dict[str, Any]:
    """Parse and validate JSON output against superset schema.

    Args:
        output: Raw stdout string

    Returns:
        Parsed JSON dict

    Raises:
        ValueError: If output is not valid superset JSON
    """
    try:
        data = json.loads(output.strip())
    except json.JSONDecodeError as e:
        raise ValueError(f"Not valid JSON: {e}") from e

    errors = []
    for field in SUPERSET_SCHEMA["required"]:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if "ok" in data and not isinstance(data["ok"], bool):
        errors.append(f"'ok' must be boolean, got {type(data['ok']).__name__}")

    if "command" in data and not isinstance(data["command"], str):
        errors.append(f"'command' must be string, got {type(data['command']).__name__}")

    if "meta" in data:
        meta = data["meta"]
        for mfield in ["version", "duration", "timestamp"]:
            if mfield not in meta:
                errors.append(f"Missing meta field: {mfield}")

    if errors:
        raise ValueError(f"Schema validation failed: {'; '.join(errors)}")

    return data


# ── Smoke Test Helpers ──────────────────────────────────────────────────

def smoke_test(binary: str, args: list[str] | None = None, timeout: int = 10) -> dict[str, Any]:
    """Run a smoke test on a CLI binary.

    Args:
        binary: Binary name or path
        args: Arguments to pass
        timeout: Timeout in seconds

    Returns:
        Dict with stdout, stderr, returncode, valid_json
    """
    cmd = [sys.executable, "-m", binary] if "." in binary else [binary]
    cmd.extend(args or ["--help"])

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
        )
        valid_json = False
        try:
            validate_json_output(result.stdout)
            valid_json = True
        except ValueError:
            pass

        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "valid_json": valid_json,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "timeout", "returncode": -1, "valid_json": False}
    except FileNotFoundError:
        return {"stdout": "", "stderr": "not found", "returncode": -1, "valid_json": False}


def assert_json_response(output: str, command: str | None = None, ok: bool = True) -> dict:
    """Assert that output is valid superset JSON with expected values.

    Args:
        output: Raw stdout string
        command: Expected command name (optional)
        ok: Expected ok value

    Returns:
        Parsed response dict
    """
    data = validate_json_output(output)
    assert data["ok"] is ok, f"Expected ok={ok}, got {data['ok']}"
    if command is not None:
        assert data["command"] == command, f"Expected command='{command}', got '{data['command']}'"
    return data
