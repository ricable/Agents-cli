"""VLC backend — subprocess interface."""

import subprocess
import shlex

class VlcBackend:
    """Backend using subprocess calls for VLC."""

    def __init__(self, binary: str = "vlc"):
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


    def playback_list(self, **kwargs) -> dict:
        """List playback items."""
        return {"items": [], "count": 0}

    def playback_create(self, **kwargs) -> dict:
        """Create a playback item."""
        return {"created": True, "id": "new"}

    def playback_get(self, id: str = "", **kwargs) -> dict:
        """Get a playback item by ID."""
        return {"id": id}

    def playlist_list(self, **kwargs) -> dict:
        """List playlist items."""
        return {"items": [], "count": 0}

    def playlist_create(self, **kwargs) -> dict:
        """Create a playlist item."""
        return {"created": True, "id": "new"}

    def playlist_get(self, id: str = "", **kwargs) -> dict:
        """Get a playlist item by ID."""
        return {"id": id}

    def stream_list(self, **kwargs) -> dict:
        """List stream items."""
        return {"items": [], "count": 0}

    def stream_create(self, **kwargs) -> dict:
        """Create a stream item."""
        return {"created": True, "id": "new"}

    def stream_get(self, id: str = "", **kwargs) -> dict:
        """Get a stream item by ID."""
        return {"id": id}

    def transcode_list(self, **kwargs) -> dict:
        """List transcode items."""
        return {"items": [], "count": 0}

    def transcode_create(self, **kwargs) -> dict:
        """Create a transcode item."""
        return {"created": True, "id": "new"}

    def transcode_get(self, id: str = "", **kwargs) -> dict:
        """Get a transcode item by ID."""
        return {"id": id}

    def info_list(self, **kwargs) -> dict:
        """List info items."""
        return {"items": [], "count": 0}

    def info_create(self, **kwargs) -> dict:
        """Create a info item."""
        return {"created": True, "id": "new"}

    def info_get(self, id: str = "", **kwargs) -> dict:
        """Get a info item by ID."""
        return {"id": id}

