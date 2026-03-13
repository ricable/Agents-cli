"""Draw.io CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_drawio.backend import DrawioBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-drawio")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Draw.io CLI — agent-native wrapper for Draw.io."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = DrawioBackend()


@cli.group()
@click.pass_context
def diagram(ctx):
    """Diagram operations."""
    pass

@diagram.command(name="list")
@click.option("--id", default=None, help="diagram identifier")
@click.pass_context
def diagram_list(ctx, id):
    """list diagram"""
    result = ctx.obj["backend"].execute("diagram", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("diagram-list", result))
    else:
        click.echo(result)

@diagram.command(name="create")
@click.option("--id", default=None, help="diagram identifier")
@click.pass_context
def diagram_create(ctx, id):
    """create diagram"""
    result = ctx.obj["backend"].execute("diagram", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("diagram-create", result))
    else:
        click.echo(result)

@diagram.command(name="get")
@click.argument("id")
@click.pass_context
def diagram_get(ctx, id):
    """get diagram"""
    result = ctx.obj["backend"].execute("diagram", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("diagram-get", result))
    else:
        click.echo(result)

@diagram.command(name="update")
@click.argument("id")
@click.pass_context
def diagram_update(ctx, id):
    """update diagram"""
    result = ctx.obj["backend"].execute("diagram", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("diagram-update", result))
    else:
        click.echo(result)

@diagram.command(name="delete")
@click.argument("id")
@click.pass_context
def diagram_delete(ctx, id):
    """delete diagram"""
    result = ctx.obj["backend"].execute("diagram", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("diagram-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def shape(ctx):
    """Shape operations."""
    pass

@shape.command(name="list")
@click.option("--id", default=None, help="shape identifier")
@click.pass_context
def shape_list(ctx, id):
    """list shape"""
    result = ctx.obj["backend"].execute("shape", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("shape-list", result))
    else:
        click.echo(result)

@shape.command(name="create")
@click.option("--id", default=None, help="shape identifier")
@click.pass_context
def shape_create(ctx, id):
    """create shape"""
    result = ctx.obj["backend"].execute("shape", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("shape-create", result))
    else:
        click.echo(result)

@shape.command(name="get")
@click.argument("id")
@click.pass_context
def shape_get(ctx, id):
    """get shape"""
    result = ctx.obj["backend"].execute("shape", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("shape-get", result))
    else:
        click.echo(result)

@shape.command(name="update")
@click.argument("id")
@click.pass_context
def shape_update(ctx, id):
    """update shape"""
    result = ctx.obj["backend"].execute("shape", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("shape-update", result))
    else:
        click.echo(result)

@shape.command(name="delete")
@click.argument("id")
@click.pass_context
def shape_delete(ctx, id):
    """delete shape"""
    result = ctx.obj["backend"].execute("shape", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("shape-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def connection(ctx):
    """Connection operations."""
    pass

@connection.command(name="list")
@click.option("--id", default=None, help="connection identifier")
@click.pass_context
def connection_list(ctx, id):
    """list connection"""
    result = ctx.obj["backend"].execute("connection", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("connection-list", result))
    else:
        click.echo(result)

@connection.command(name="create")
@click.option("--id", default=None, help="connection identifier")
@click.pass_context
def connection_create(ctx, id):
    """create connection"""
    result = ctx.obj["backend"].execute("connection", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("connection-create", result))
    else:
        click.echo(result)

@connection.command(name="get")
@click.argument("id")
@click.pass_context
def connection_get(ctx, id):
    """get connection"""
    result = ctx.obj["backend"].execute("connection", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("connection-get", result))
    else:
        click.echo(result)

@connection.command(name="update")
@click.argument("id")
@click.pass_context
def connection_update(ctx, id):
    """update connection"""
    result = ctx.obj["backend"].execute("connection", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("connection-update", result))
    else:
        click.echo(result)

@connection.command(name="delete")
@click.argument("id")
@click.pass_context
def connection_delete(ctx, id):
    """delete connection"""
    result = ctx.obj["backend"].execute("connection", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("connection-delete", result))
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


@cli.group()
@click.pass_context
def style(ctx):
    """Style operations."""
    pass

@style.command(name="list")
@click.option("--id", default=None, help="style identifier")
@click.pass_context
def style_list(ctx, id):
    """list style"""
    result = ctx.obj["backend"].execute("style", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("style-list", result))
    else:
        click.echo(result)

@style.command(name="create")
@click.option("--id", default=None, help="style identifier")
@click.pass_context
def style_create(ctx, id):
    """create style"""
    result = ctx.obj["backend"].execute("style", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("style-create", result))
    else:
        click.echo(result)

@style.command(name="get")
@click.argument("id")
@click.pass_context
def style_get(ctx, id):
    """get style"""
    result = ctx.obj["backend"].execute("style", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("style-get", result))
    else:
        click.echo(result)

@style.command(name="update")
@click.argument("id")
@click.pass_context
def style_update(ctx, id):
    """update style"""
    result = ctx.obj["backend"].execute("style", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("style-update", result))
    else:
        click.echo(result)

@style.command(name="delete")
@click.argument("id")
@click.pass_context
def style_delete(ctx, id):
    """delete style"""
    result = ctx.obj["backend"].execute("style", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("style-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
