"""cli-anything-core — Base backend class.

Provides the abstract backend interface that all CLI-Anything harnesses
implement. Supports AppleScript, subprocess, Python bindings, and REST API
backend types.
"""
from abc import ABC, abstractmethod
from typing import Any


class BaseBackend(ABC):
    """Abstract base for CLI-Anything backends.

    Subclasses implement execute() to route commands to the target application.
    """

    def __init__(self):
        self.available: bool = False

    @abstractmethod
    def execute(self, group: str, action: str, **kwargs: Any) -> dict:
        """Execute a command.

        Args:
            group: Command group (e.g., "image", "filter")
            action: Action name (e.g., "resize", "blur")
            **kwargs: Command arguments

        Returns:
            Dict with command results
        """
        ...

    def check_available(self) -> bool:
        """Check if the backend is available."""
        return self.available


class SubprocessBackend(BaseBackend):
    """Backend that wraps a CLI binary via subprocess."""

    def __init__(self, binary: str):
        super().__init__()
        self.binary = binary
        self._check()

    def _check(self) -> None:
        import subprocess
        try:
            subprocess.run([self.binary, "--version"], capture_output=True, timeout=5)
            self.available = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            self.available = False

    def execute(self, group: str, action: str, **kwargs: Any) -> dict:
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)

    def run(self, args: list[str], timeout: int = 30) -> dict:
        """Run subprocess and return structured output."""
        import subprocess
        try:
            result = subprocess.run(
                [self.binary] + args,
                capture_output=True, text=True, timeout=timeout,
            )
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"error": f"Timeout after {timeout}s"}
        except FileNotFoundError:
            return {"error": f"Binary not found: {self.binary}"}


class PythonBindingBackend(BaseBackend):
    """Backend that uses Python library bindings."""

    def __init__(self):
        super().__init__()
        self.available = True

    def execute(self, group: str, action: str, **kwargs: Any) -> dict:
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)
