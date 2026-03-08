#!/usr/bin/env python3
"""
MCP stdio server for agents-cli tool registry.

Reads AGENT_TOOLS_PATH env var (colon-separated directories),
scans each for CONTEXT.md files, and serves tools via
JSON-RPC 2.0 over stdin/stdout (MCP stdio protocol).

No external dependencies required — uses only Python stdlib.
"""

import json
import os
import sys
from pathlib import Path


def scan_tools(tool_dirs: list[str]) -> dict[str, dict]:
    """Scan tool directories for CONTEXT.md files and build tool registry."""
    tools: dict[str, dict] = {}

    for dir_path in tool_dirs:
        p = Path(dir_path)
        if not p.is_dir():
            continue

        # Check for CONTEXT.md directly in this directory
        context_file = p / "CONTEXT.md"
        if context_file.is_file():
            name = p.name
            description = _parse_context_description(context_file)
            tools[name] = {
                "name": name,
                "description": description,
                "dir": str(p),
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "args": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Command-line arguments to pass to the tool",
                        }
                    },
                },
            }
        else:
            # Scan subdirectories for CONTEXT.md
            if not p.is_dir():
                continue
            for child in sorted(p.iterdir()):
                if not child.is_dir():
                    continue
                ctx = child / "CONTEXT.md"
                if ctx.is_file():
                    name = child.name
                    description = _parse_context_description(ctx)
                    tools[name] = {
                        "name": name,
                        "description": description,
                        "dir": str(child),
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "args": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Command-line arguments to pass to the tool",
                                }
                            },
                        },
                    }

    return tools


def _parse_context_description(context_file: Path) -> str:
    """Extract description from CONTEXT.md (first non-heading, non-empty line)."""
    try:
        lines = context_file.read_text(encoding="utf-8").splitlines()
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                return stripped
        return ""
    except Exception:
        return ""


def handle_request(request: dict, tools: dict[str, dict]) -> dict:
    """Handle a JSON-RPC 2.0 request and return a response."""
    req_id = request.get("id")
    method = request.get("method", "")

    if method == "tools/list":
        tool_list = []
        for tool in tools.values():
            tool_list.append({
                "name": tool["name"],
                "description": tool["description"],
                "inputSchema": tool.get("inputSchema", {}),
            })
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": tool_list},
        }

    elif method == "tools/call":
        params = request.get("params", {})
        tool_name = params.get("name", "")
        if tool_name not in tools:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32602,
                    "message": f"Tool not found: {tool_name}",
                },
            }

        tool = tools[tool_name]
        arguments = params.get("arguments", {})
        args_list = arguments.get("args", [])

        # Execute the tool
        import subprocess

        tool_dir = tool["dir"]
        # Look for executable
        bin_path = None
        candidates = [
            os.path.join(tool_dir, "package", "bin", tool_name),
            os.path.join(tool_dir, "package", tool_name),
            os.path.join(tool_dir, "package", "index.js"),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                bin_path = candidate
                break

        if bin_path is None:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"No executable found for tool: {tool_name}",
                        }
                    ],
                    "isError": True,
                },
            }

        try:
            env = dict(os.environ)
            env["AGENT_TOOLS_PATH"] = tool_dir
            result = subprocess.run(
                [bin_path] + args_list,
                capture_output=True,
                text=True,
                timeout=30,
                cwd=tool_dir,
                env=env,
            )
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": result.stdout if result.returncode == 0 else result.stderr,
                        }
                    ],
                    "isError": result.returncode != 0,
                },
            }
        except subprocess.TimeoutExpired:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": "Tool execution timed out"}],
                    "isError": True,
                },
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": f"Execution error: {e}"}],
                    "isError": True,
                },
            }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Method not found: {method}",
            },
        }


def main() -> None:
    """Main loop: read JSON-RPC requests from stdin, write responses to stdout."""
    tool_path = os.environ.get("AGENT_TOOLS_PATH", "")
    tool_dirs = [d for d in tool_path.split(":") if d]
    tools = scan_tools(tool_dirs)

    # Log to stderr so it doesn't interfere with the protocol
    print(f"MCP registry started with {len(tools)} tools", file=sys.stderr)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {e}"},
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        response = handle_request(request, tools)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
