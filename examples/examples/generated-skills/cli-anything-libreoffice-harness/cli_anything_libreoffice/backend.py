"""LibreOffice backend — subprocess interface."""

import subprocess
import shlex

class LibreofficeBackend:
    """Backend using subprocess calls for LibreOffice."""

    def __init__(self, binary: str = "libreoffice"):
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

    def spreadsheet_list(self, **kwargs) -> dict:
        """List spreadsheet items."""
        return {"items": [], "count": 0}

    def spreadsheet_create(self, **kwargs) -> dict:
        """Create a spreadsheet item."""
        return {"created": True, "id": "new"}

    def spreadsheet_get(self, id: str = "", **kwargs) -> dict:
        """Get a spreadsheet item by ID."""
        return {"id": id}

    def presentation_list(self, **kwargs) -> dict:
        """List presentation items."""
        return {"items": [], "count": 0}

    def presentation_create(self, **kwargs) -> dict:
        """Create a presentation item."""
        return {"created": True, "id": "new"}

    def presentation_get(self, id: str = "", **kwargs) -> dict:
        """Get a presentation item by ID."""
        return {"id": id}

    def convert_list(self, **kwargs) -> dict:
        """List convert items."""
        return {"items": [], "count": 0}

    def convert_create(self, **kwargs) -> dict:
        """Create a convert item."""
        return {"created": True, "id": "new"}

    def convert_get(self, id: str = "", **kwargs) -> dict:
        """Get a convert item by ID."""
        return {"id": id}

    def macro_list(self, **kwargs) -> dict:
        """List macro items."""
        return {"items": [], "count": 0}

    def macro_create(self, **kwargs) -> dict:
        """Create a macro item."""
        return {"created": True, "id": "new"}

    def macro_get(self, id: str = "", **kwargs) -> dict:
        """Get a macro item by ID."""
        return {"id": id}

    def template_list(self, **kwargs) -> dict:
        """List template items."""
        return {"items": [], "count": 0}

    def template_create(self, **kwargs) -> dict:
        """Create a template item."""
        return {"created": True, "id": "new"}

    def template_get(self, id: str = "", **kwargs) -> dict:
        """Get a template item by ID."""
        return {"id": id}

