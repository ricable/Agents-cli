"""cli-anything-core — JSON output helpers.

Superset format:
  {ok: bool, command: str, data: dict, meta: {version, duration, timestamp}}

All CLI-Anything harnesses use this format for structured JSON output.
"""
import json
import time
from datetime import datetime, timezone

_start_time: float = 0.0
_version: str = "0.1.0"


def set_version(version: str) -> None:
    """Set the version string for JSON output meta."""
    global _version
    _version = version


def start_timer() -> None:
    """Start the response timer."""
    global _start_time
    _start_time = time.monotonic()


def json_response(command: str, data: dict, ok: bool = True) -> str:
    """Build a superset JSON response string.

    Args:
        command: The command name (e.g., "image-resize")
        data: The response data dict
        ok: Whether the command succeeded

    Returns:
        JSON string with superset format
    """
    duration = time.monotonic() - _start_time if _start_time else 0.0
    result = {
        "ok": ok,
        "command": command,
        "data": data,
        "meta": {
            "version": _version,
            "duration": round(duration, 3),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
    return json.dumps(result, indent=2)


def error_response(command: str, message: str) -> str:
    """Build an error JSON response string.

    Args:
        command: The command name
        message: Error message

    Returns:
        JSON string with ok=False
    """
    return json_response(command, {"error": message}, ok=False)


def emit(response: str) -> None:
    """Print a JSON response to stdout."""
    print(response)
