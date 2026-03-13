"""Inkscape — JSON output helpers.

Uses cli-anything-core superset format:
  {ok: bool, command: str, data: dict, meta: {version, duration, timestamp}}
"""
from cli_anything_core.output import json_response, error_response

__all__ = ["json_response", "error_response"]
