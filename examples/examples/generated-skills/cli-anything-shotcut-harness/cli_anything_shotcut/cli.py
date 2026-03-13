"""Shotcut CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_shotcut.backend import ShotcutBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-shotcut")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Shotcut CLI — agent-native wrapper for Shotcut."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = ShotcutBackend()


@cli.group()
@click.pass_context
def project(ctx):
    """Project operations."""
    pass

@project.command(name="list")
@click.option("--id", default=None, help="project identifier")
@click.pass_context
def project_list(ctx, id):
    """list project"""
    result = ctx.obj["backend"].execute("project", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("project-list", result))
    else:
        click.echo(result)

@project.command(name="create")
@click.option("--id", default=None, help="project identifier")
@click.pass_context
def project_create(ctx, id):
    """create project"""
    result = ctx.obj["backend"].execute("project", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("project-create", result))
    else:
        click.echo(result)

@project.command(name="get")
@click.argument("id")
@click.pass_context
def project_get(ctx, id):
    """get project"""
    result = ctx.obj["backend"].execute("project", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("project-get", result))
    else:
        click.echo(result)

@project.command(name="update")
@click.argument("id")
@click.pass_context
def project_update(ctx, id):
    """update project"""
    result = ctx.obj["backend"].execute("project", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("project-update", result))
    else:
        click.echo(result)

@project.command(name="delete")
@click.argument("id")
@click.pass_context
def project_delete(ctx, id):
    """delete project"""
    result = ctx.obj["backend"].execute("project", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("project-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def timeline(ctx):
    """Timeline operations."""
    pass

@timeline.command(name="list")
@click.option("--id", default=None, help="timeline identifier")
@click.pass_context
def timeline_list(ctx, id):
    """list timeline"""
    result = ctx.obj["backend"].execute("timeline", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("timeline-list", result))
    else:
        click.echo(result)

@timeline.command(name="create")
@click.option("--id", default=None, help="timeline identifier")
@click.pass_context
def timeline_create(ctx, id):
    """create timeline"""
    result = ctx.obj["backend"].execute("timeline", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("timeline-create", result))
    else:
        click.echo(result)

@timeline.command(name="get")
@click.argument("id")
@click.pass_context
def timeline_get(ctx, id):
    """get timeline"""
    result = ctx.obj["backend"].execute("timeline", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("timeline-get", result))
    else:
        click.echo(result)

@timeline.command(name="update")
@click.argument("id")
@click.pass_context
def timeline_update(ctx, id):
    """update timeline"""
    result = ctx.obj["backend"].execute("timeline", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("timeline-update", result))
    else:
        click.echo(result)

@timeline.command(name="delete")
@click.argument("id")
@click.pass_context
def timeline_delete(ctx, id):
    """delete timeline"""
    result = ctx.obj["backend"].execute("timeline", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("timeline-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def clip(ctx):
    """Clip operations."""
    pass

@clip.command(name="list")
@click.option("--id", default=None, help="clip identifier")
@click.pass_context
def clip_list(ctx, id):
    """list clip"""
    result = ctx.obj["backend"].execute("clip", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("clip-list", result))
    else:
        click.echo(result)

@clip.command(name="create")
@click.option("--id", default=None, help="clip identifier")
@click.pass_context
def clip_create(ctx, id):
    """create clip"""
    result = ctx.obj["backend"].execute("clip", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("clip-create", result))
    else:
        click.echo(result)

@clip.command(name="get")
@click.argument("id")
@click.pass_context
def clip_get(ctx, id):
    """get clip"""
    result = ctx.obj["backend"].execute("clip", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("clip-get", result))
    else:
        click.echo(result)

@clip.command(name="update")
@click.argument("id")
@click.pass_context
def clip_update(ctx, id):
    """update clip"""
    result = ctx.obj["backend"].execute("clip", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("clip-update", result))
    else:
        click.echo(result)

@clip.command(name="delete")
@click.argument("id")
@click.pass_context
def clip_delete(ctx, id):
    """delete clip"""
    result = ctx.obj["backend"].execute("clip", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("clip-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def filter(ctx):
    """Filter operations."""
    pass

@filter.command(name="list")
@click.option("--id", default=None, help="filter identifier")
@click.pass_context
def filter_list(ctx, id):
    """list filter"""
    result = ctx.obj["backend"].execute("filter", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("filter-list", result))
    else:
        click.echo(result)

@filter.command(name="create")
@click.option("--id", default=None, help="filter identifier")
@click.pass_context
def filter_create(ctx, id):
    """create filter"""
    result = ctx.obj["backend"].execute("filter", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("filter-create", result))
    else:
        click.echo(result)

@filter.command(name="get")
@click.argument("id")
@click.pass_context
def filter_get(ctx, id):
    """get filter"""
    result = ctx.obj["backend"].execute("filter", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("filter-get", result))
    else:
        click.echo(result)

@filter.command(name="update")
@click.argument("id")
@click.pass_context
def filter_update(ctx, id):
    """update filter"""
    result = ctx.obj["backend"].execute("filter", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("filter-update", result))
    else:
        click.echo(result)

@filter.command(name="delete")
@click.argument("id")
@click.pass_context
def filter_delete(ctx, id):
    """delete filter"""
    result = ctx.obj["backend"].execute("filter", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("filter-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def export(ctx):
    """Export operations."""
    pass

@export.command(name="list")
@click.option("--id", default=None, help="export identifier")
@click.pass_context
def export_list(ctx, id):
    """list export"""
    result = ctx.obj["backend"].execute("export", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("export-list", result))
    else:
        click.echo(result)

@export.command(name="create")
@click.option("--id", default=None, help="export identifier")
@click.pass_context
def export_create(ctx, id):
    """create export"""
    result = ctx.obj["backend"].execute("export", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("export-create", result))
    else:
        click.echo(result)

@export.command(name="get")
@click.argument("id")
@click.pass_context
def export_get(ctx, id):
    """get export"""
    result = ctx.obj["backend"].execute("export", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("export-get", result))
    else:
        click.echo(result)

@export.command(name="update")
@click.argument("id")
@click.pass_context
def export_update(ctx, id):
    """update export"""
    result = ctx.obj["backend"].execute("export", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("export-update", result))
    else:
        click.echo(result)

@export.command(name="delete")
@click.argument("id")
@click.pass_context
def export_delete(ctx, id):
    """delete export"""
    result = ctx.obj["backend"].execute("export", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("export-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
