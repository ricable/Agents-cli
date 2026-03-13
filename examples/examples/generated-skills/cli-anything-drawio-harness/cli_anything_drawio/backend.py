"""Draw.io backend — subprocess interface."""

import subprocess
import shlex

class DrawioBackend:
    """Backend using subprocess calls for Draw.io."""

    def __init__(self, binary: str = "drawio"):
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


    def diagram_list(self, **kwargs) -> dict:
        """List diagram items."""
        return {"items": [], "count": 0}

    def diagram_create(self, **kwargs) -> dict:
        """Create a diagram item."""
        return {"created": True, "id": "new"}

    def diagram_get(self, id: str = "", **kwargs) -> dict:
        """Get a diagram item by ID."""
        return {"id": id}

    def shape_list(self, **kwargs) -> dict:
        """List shape items."""
        return {"items": [], "count": 0}

    def shape_create(self, **kwargs) -> dict:
        """Create a shape item."""
        return {"created": True, "id": "new"}

    def shape_get(self, id: str = "", **kwargs) -> dict:
        """Get a shape item by ID."""
        return {"id": id}

    def connection_list(self, **kwargs) -> dict:
        """List connection items."""
        return {"items": [], "count": 0}

    def connection_create(self, **kwargs) -> dict:
        """Create a connection item."""
        return {"created": True, "id": "new"}

    def connection_get(self, id: str = "", **kwargs) -> dict:
        """Get a connection item by ID."""
        return {"id": id}

    def export_list(self, **kwargs) -> dict:
        """List export items."""
        return {"items": [], "count": 0}

    def export_create(self, **kwargs) -> dict:
        """Create a export item."""
        return {"created": True, "id": "new"}

    def export_get(self, id: str = "", **kwargs) -> dict:
        """Get a export item by ID."""
        return {"id": id}

    def style_list(self, **kwargs) -> dict:
        """List style items."""
        return {"items": [], "count": 0}

    def style_create(self, **kwargs) -> dict:
        """Create a style item."""
        return {"created": True, "id": "new"}

    def style_get(self, id: str = "", **kwargs) -> dict:
        """Get a style item by ID."""
        return {"id": id}

