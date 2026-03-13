"""cli-anything-core — Shared REPL (repl_skin).

Provides styled prompts, history, undo/redo for interactive CLI sessions.
"""
import readline
import os
from collections import deque


class ReplSkin:
    """Interactive REPL with history and undo/redo support.

    Args:
        banner: Welcome banner text
        prompt: Prompt string (e.g., "gimp> ")
        history_file: Path to history file (relative to home)
        undo_support: Enable undo/redo stack
    """

    def __init__(
        self,
        banner: str = "CLI-Anything REPL",
        prompt: str = "> ",
        history_file: str = ".cli_anything_history",
        undo_support: bool = False,
    ):
        self.banner = banner
        self.prompt = prompt
        self.history_file = os.path.expanduser(f"~/{history_file}")
        self.undo_support = undo_support
        self._undo_stack: deque[str] = deque(maxlen=50)
        self._redo_stack: deque[str] = deque(maxlen=50)
        self._running = False

    def _load_history(self) -> None:
        """Load readline history from file."""
        try:
            if os.path.exists(self.history_file):
                readline.read_history_file(self.history_file)
        except OSError:
            pass

    def _save_history(self) -> None:
        """Save readline history to file."""
        try:
            readline.write_history_file(self.history_file)
        except OSError:
            pass

    def undo(self) -> str | None:
        """Pop the last command from undo stack."""
        if self._undo_stack:
            cmd = self._undo_stack.pop()
            self._redo_stack.append(cmd)
            return cmd
        return None

    def redo(self) -> str | None:
        """Pop from redo stack."""
        if self._redo_stack:
            cmd = self._redo_stack.pop()
            self._undo_stack.append(cmd)
            return cmd
        return None

    def run(self, handler: "callable") -> None:
        """Start the REPL loop.

        Args:
            handler: Function(command_str) -> None that processes each line
        """
        self._load_history()
        self._running = True
        print(self.banner)

        while self._running:
            try:
                line = input(self.prompt).strip()
                if not line:
                    continue
                if line in ("exit", "quit", "q"):
                    break
                if line == "undo" and self.undo_support:
                    undone = self.undo()
                    if undone:
                        print(f"Undone: {undone}")
                    else:
                        print("Nothing to undo")
                    continue
                if line == "redo" and self.undo_support:
                    redone = self.redo()
                    if redone:
                        print(f"Redo: {redone}")
                    else:
                        print("Nothing to redo")
                    continue

                if self.undo_support:
                    self._undo_stack.append(line)
                    self._redo_stack.clear()

                handler(line)

            except EOFError:
                break
            except KeyboardInterrupt:
                print()
                continue

        self._save_history()
        print("Bye.")

    def stop(self) -> None:
        """Stop the REPL loop."""
        self._running = False
