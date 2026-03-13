"""OBS Studio CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_obs_studio.backend import ObsStudioBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-obs-studio")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """OBS Studio CLI — agent-native wrapper for OBS Studio."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = ObsStudioBackend()


@cli.group()
@click.pass_context
def scene(ctx):
    """Scene operations."""
    pass

@scene.command(name="list")
@click.option("--id", default=None, help="scene identifier")
@click.pass_context
def scene_list(ctx, id):
    """list scene"""
    result = ctx.obj["backend"].execute("scene", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("scene-list", result))
    else:
        click.echo(result)

@scene.command(name="create")
@click.option("--id", default=None, help="scene identifier")
@click.pass_context
def scene_create(ctx, id):
    """create scene"""
    result = ctx.obj["backend"].execute("scene", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("scene-create", result))
    else:
        click.echo(result)

@scene.command(name="get")
@click.argument("id")
@click.pass_context
def scene_get(ctx, id):
    """get scene"""
    result = ctx.obj["backend"].execute("scene", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("scene-get", result))
    else:
        click.echo(result)

@scene.command(name="update")
@click.argument("id")
@click.pass_context
def scene_update(ctx, id):
    """update scene"""
    result = ctx.obj["backend"].execute("scene", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("scene-update", result))
    else:
        click.echo(result)

@scene.command(name="delete")
@click.argument("id")
@click.pass_context
def scene_delete(ctx, id):
    """delete scene"""
    result = ctx.obj["backend"].execute("scene", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("scene-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def source(ctx):
    """Source operations."""
    pass

@source.command(name="list")
@click.option("--id", default=None, help="source identifier")
@click.pass_context
def source_list(ctx, id):
    """list source"""
    result = ctx.obj["backend"].execute("source", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("source-list", result))
    else:
        click.echo(result)

@source.command(name="create")
@click.option("--id", default=None, help="source identifier")
@click.pass_context
def source_create(ctx, id):
    """create source"""
    result = ctx.obj["backend"].execute("source", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("source-create", result))
    else:
        click.echo(result)

@source.command(name="get")
@click.argument("id")
@click.pass_context
def source_get(ctx, id):
    """get source"""
    result = ctx.obj["backend"].execute("source", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("source-get", result))
    else:
        click.echo(result)

@source.command(name="update")
@click.argument("id")
@click.pass_context
def source_update(ctx, id):
    """update source"""
    result = ctx.obj["backend"].execute("source", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("source-update", result))
    else:
        click.echo(result)

@source.command(name="delete")
@click.argument("id")
@click.pass_context
def source_delete(ctx, id):
    """delete source"""
    result = ctx.obj["backend"].execute("source", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("source-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def stream(ctx):
    """Stream operations."""
    pass

@stream.command(name="list")
@click.option("--id", default=None, help="stream identifier")
@click.pass_context
def stream_list(ctx, id):
    """list stream"""
    result = ctx.obj["backend"].execute("stream", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("stream-list", result))
    else:
        click.echo(result)

@stream.command(name="create")
@click.option("--id", default=None, help="stream identifier")
@click.pass_context
def stream_create(ctx, id):
    """create stream"""
    result = ctx.obj["backend"].execute("stream", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("stream-create", result))
    else:
        click.echo(result)

@stream.command(name="get")
@click.argument("id")
@click.pass_context
def stream_get(ctx, id):
    """get stream"""
    result = ctx.obj["backend"].execute("stream", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("stream-get", result))
    else:
        click.echo(result)

@stream.command(name="update")
@click.argument("id")
@click.pass_context
def stream_update(ctx, id):
    """update stream"""
    result = ctx.obj["backend"].execute("stream", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("stream-update", result))
    else:
        click.echo(result)

@stream.command(name="delete")
@click.argument("id")
@click.pass_context
def stream_delete(ctx, id):
    """delete stream"""
    result = ctx.obj["backend"].execute("stream", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("stream-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def record(ctx):
    """Record operations."""
    pass

@record.command(name="list")
@click.option("--id", default=None, help="record identifier")
@click.pass_context
def record_list(ctx, id):
    """list record"""
    result = ctx.obj["backend"].execute("record", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("record-list", result))
    else:
        click.echo(result)

@record.command(name="create")
@click.option("--id", default=None, help="record identifier")
@click.pass_context
def record_create(ctx, id):
    """create record"""
    result = ctx.obj["backend"].execute("record", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("record-create", result))
    else:
        click.echo(result)

@record.command(name="get")
@click.argument("id")
@click.pass_context
def record_get(ctx, id):
    """get record"""
    result = ctx.obj["backend"].execute("record", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("record-get", result))
    else:
        click.echo(result)

@record.command(name="update")
@click.argument("id")
@click.pass_context
def record_update(ctx, id):
    """update record"""
    result = ctx.obj["backend"].execute("record", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("record-update", result))
    else:
        click.echo(result)

@record.command(name="delete")
@click.argument("id")
@click.pass_context
def record_delete(ctx, id):
    """delete record"""
    result = ctx.obj["backend"].execute("record", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("record-delete", result))
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
def transition(ctx):
    """Transition operations."""
    pass

@transition.command(name="list")
@click.option("--id", default=None, help="transition identifier")
@click.pass_context
def transition_list(ctx, id):
    """list transition"""
    result = ctx.obj["backend"].execute("transition", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transition-list", result))
    else:
        click.echo(result)

@transition.command(name="create")
@click.option("--id", default=None, help="transition identifier")
@click.pass_context
def transition_create(ctx, id):
    """create transition"""
    result = ctx.obj["backend"].execute("transition", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transition-create", result))
    else:
        click.echo(result)

@transition.command(name="get")
@click.argument("id")
@click.pass_context
def transition_get(ctx, id):
    """get transition"""
    result = ctx.obj["backend"].execute("transition", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transition-get", result))
    else:
        click.echo(result)

@transition.command(name="update")
@click.argument("id")
@click.pass_context
def transition_update(ctx, id):
    """update transition"""
    result = ctx.obj["backend"].execute("transition", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transition-update", result))
    else:
        click.echo(result)

@transition.command(name="delete")
@click.argument("id")
@click.pass_context
def transition_delete(ctx, id):
    """delete transition"""
    result = ctx.obj["backend"].execute("transition", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transition-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
