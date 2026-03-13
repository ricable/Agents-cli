"""Shared pytest fixtures for cli-anything-gimp."""
import pytest
from click.testing import CliRunner


@pytest.fixture
def runner():
    """Click CLI test runner."""
    return CliRunner()


@pytest.fixture
def json_runner(runner):
    """Runner that always passes --json."""
    class JsonRunner:
        def invoke(self, cli, args=None, **kwargs):
            full_args = ["--json"] + (args or [])
            return runner.invoke(cli, full_args, **kwargs)
    return JsonRunner()
