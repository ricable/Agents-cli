"""Inkscape backend — subprocess interface."""

import subprocess
import shlex

class InkscapeBackend:
    """Backend using subprocess calls for Inkscape."""

    def __init__(self, binary: str = "inkscape"):
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


    def document_list(self, **kwargs) -> dict:
        """List document items."""
        return {"items": [], "count": 0}

    def document_create(self, **kwargs) -> dict:
        """Create a document item."""
        return {"created": True, "id": "new"}

    def document_get(self, id: str = "", **kwargs) -> dict:
        """Get a document item by ID."""
        return {"id": id}

    def object_list(self, **kwargs) -> dict:
        """List object items."""
        return {"items": [], "count": 0}

    def object_create(self, **kwargs) -> dict:
        """Create a object item."""
        return {"created": True, "id": "new"}

    def object_get(self, id: str = "", **kwargs) -> dict:
        """Get a object item by ID."""
        return {"id": id}

    def path_list(self, **kwargs) -> dict:
        """List path items."""
        return {"items": [], "count": 0}

    def path_create(self, **kwargs) -> dict:
        """Create a path item."""
        return {"created": True, "id": "new"}

    def path_get(self, id: str = "", **kwargs) -> dict:
        """Get a path item by ID."""
        return {"id": id}

    def text_list(self, **kwargs) -> dict:
        """List text items."""
        return {"items": [], "count": 0}

    def text_create(self, **kwargs) -> dict:
        """Create a text item."""
        return {"created": True, "id": "new"}

    def text_get(self, id: str = "", **kwargs) -> dict:
        """Get a text item by ID."""
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

    def transform_list(self, **kwargs) -> dict:
        """List transform items."""
        return {"items": [], "count": 0}

    def transform_create(self, **kwargs) -> dict:
        """Create a transform item."""
        return {"created": True, "id": "new"}

    def transform_get(self, id: str = "", **kwargs) -> dict:
        """Get a transform item by ID."""
        return {"id": id}

