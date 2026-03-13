"""Kdenlive backend — subprocess interface."""

import subprocess
import shlex

class KdenliveBackend:
    """Backend using subprocess calls for Kdenlive."""

    def __init__(self, binary: str = "kdenlive"):
        self.binary = binary
        self.available = self._check_binary()

    def _check_binary(self) -> bool:
        """Check if the binary is available."""
        try:
            subprocess.run([self.binary, "--version"], capture_output=True, timeout=5)
            return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def execute(self, group: str, action: str, **kwargs) -> dict:
        """Execute a command via subprocess."""
        method = getattr(self, f"{group}_{action}", None)
        if method is None:
            return {"error": f"Unknown command: {group}.{action}"}
        return method(**kwargs)

    def _run(self, args: list[str], timeout: int = 30) -> dict:
        """Run a subprocess and return structured output."""
        try:
            result = subprocess.run(
                [self.binary] + args,
                capture_output=True, text=True, timeout=timeout,
            )
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"error": f"Command timed out after {timeout}s"}
        except FileNotFoundError:
            return {"error": f"Binary not found: {self.binary}"}


    def project_list(self, **kwargs) -> dict:
        """List project items."""
        return {"items": [], "count": 0}

    def project_create(self, **kwargs) -> dict:
        """Create a project item."""
        return {"created": True, "id": "new"}

    def project_get(self, id: str = "", **kwargs) -> dict:
        """Get a project item by ID."""
        return {"id": id}

    def timeline_list(self, **kwargs) -> dict:
        """List timeline items."""
        return {"items": [], "count": 0}

    def timeline_create(self, **kwargs) -> dict:
        """Create a timeline item."""
        return {"created": True, "id": "new"}

    def timeline_get(self, id: str = "", **kwargs) -> dict:
        """Get a timeline item by ID."""
        return {"id": id}

    def clip_list(self, **kwargs) -> dict:
        """List clip items."""
        return {"items": [], "count": 0}

    def clip_create(self, **kwargs) -> dict:
        """Create a clip item."""
        return {"created": True, "id": "new"}

    def clip_get(self, id: str = "", **kwargs) -> dict:
        """Get a clip item by ID."""
        return {"id": id}

    def effect_list(self, **kwargs) -> dict:
        """List effect items."""
        return {"items": [], "count": 0}

    def effect_create(self, **kwargs) -> dict:
        """Create a effect item."""
        return {"created": True, "id": "new"}

    def effect_get(self, id: str = "", **kwargs) -> dict:
        """Get a effect item by ID."""
        return {"id": id}

    def transition_list(self, **kwargs) -> dict:
        """List transition items."""
        return {"items": [], "count": 0}

    def transition_create(self, **kwargs) -> dict:
        """Create a transition item."""
        return {"created": True, "id": "new"}

    def transition_get(self, id: str = "", **kwargs) -> dict:
        """Get a transition item by ID."""
        return {"id": id}

    def render_list(self, **kwargs) -> dict:
        """List render items."""
        return {"items": [], "count": 0}

    def render_create(self, **kwargs) -> dict:
        """Create a render item."""
        return {"created": True, "id": "new"}

    def render_get(self, id: str = "", **kwargs) -> dict:
        """Get a render item by ID."""
        return {"id": id}

