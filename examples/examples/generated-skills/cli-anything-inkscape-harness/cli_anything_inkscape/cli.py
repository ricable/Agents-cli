"""Inkscape CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_inkscape.backend import InkscapeBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-inkscape")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Inkscape CLI — agent-native wrapper for Inkscape."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = InkscapeBackend()


@cli.group()
@click.pass_context
def document(ctx):
    """Document operations."""
    pass

@document.command(name="list")
@click.option("--id", default=None, help="document identifier")
@click.pass_context
def document_list(ctx, id):
    """list document"""
    result = ctx.obj["backend"].execute("document", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("document-list", result))
    else:
        click.echo(result)

@document.command(name="create")
@click.option("--id", default=None, help="document identifier")
@click.pass_context
def document_create(ctx, id):
    """create document"""
    result = ctx.obj["backend"].execute("document", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("document-create", result))
    else:
        click.echo(result)

@document.command(name="get")
@click.argument("id")
@click.pass_context
def document_get(ctx, id):
    """get document"""
    result = ctx.obj["backend"].execute("document", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("document-get", result))
    else:
        click.echo(result)

@document.command(name="update")
@click.argument("id")
@click.pass_context
def document_update(ctx, id):
    """update document"""
    result = ctx.obj["backend"].execute("document", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("document-update", result))
    else:
        click.echo(result)

@document.command(name="delete")
@click.argument("id")
@click.pass_context
def document_delete(ctx, id):
    """delete document"""
    result = ctx.obj["backend"].execute("document", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("document-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def object(ctx):
    """Object operations."""
    pass

@object.command(name="list")
@click.option("--id", default=None, help="object identifier")
@click.pass_context
def object_list(ctx, id):
    """list object"""
    result = ctx.obj["backend"].execute("object", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("object-list", result))
    else:
        click.echo(result)

@object.command(name="create")
@click.option("--id", default=None, help="object identifier")
@click.pass_context
def object_create(ctx, id):
    """create object"""
    result = ctx.obj["backend"].execute("object", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("object-create", result))
    else:
        click.echo(result)

@object.command(name="get")
@click.argument("id")
@click.pass_context
def object_get(ctx, id):
    """get object"""
    result = ctx.obj["backend"].execute("object", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("object-get", result))
    else:
        click.echo(result)

@object.command(name="update")
@click.argument("id")
@click.pass_context
def object_update(ctx, id):
    """update object"""
    result = ctx.obj["backend"].execute("object", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("object-update", result))
    else:
        click.echo(result)

@object.command(name="delete")
@click.argument("id")
@click.pass_context
def object_delete(ctx, id):
    """delete object"""
    result = ctx.obj["backend"].execute("object", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("object-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def path(ctx):
    """Path operations."""
    pass

@path.command(name="list")
@click.option("--id", default=None, help="path identifier")
@click.pass_context
def path_list(ctx, id):
    """list path"""
    result = ctx.obj["backend"].execute("path", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("path-list", result))
    else:
        click.echo(result)

@path.command(name="create")
@click.option("--id", default=None, help="path identifier")
@click.pass_context
def path_create(ctx, id):
    """create path"""
    result = ctx.obj["backend"].execute("path", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("path-create", result))
    else:
        click.echo(result)

@path.command(name="get")
@click.argument("id")
@click.pass_context
def path_get(ctx, id):
    """get path"""
    result = ctx.obj["backend"].execute("path", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("path-get", result))
    else:
        click.echo(result)

@path.command(name="update")
@click.argument("id")
@click.pass_context
def path_update(ctx, id):
    """update path"""
    result = ctx.obj["backend"].execute("path", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("path-update", result))
    else:
        click.echo(result)

@path.command(name="delete")
@click.argument("id")
@click.pass_context
def path_delete(ctx, id):
    """delete path"""
    result = ctx.obj["backend"].execute("path", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("path-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def text(ctx):
    """Text operations."""
    pass

@text.command(name="list")
@click.option("--id", default=None, help="text identifier")
@click.pass_context
def text_list(ctx, id):
    """list text"""
    result = ctx.obj["backend"].execute("text", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("text-list", result))
    else:
        click.echo(result)

@text.command(name="create")
@click.option("--id", default=None, help="text identifier")
@click.pass_context
def text_create(ctx, id):
    """create text"""
    result = ctx.obj["backend"].execute("text", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("text-create", result))
    else:
        click.echo(result)

@text.command(name="get")
@click.argument("id")
@click.pass_context
def text_get(ctx, id):
    """get text"""
    result = ctx.obj["backend"].execute("text", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("text-get", result))
    else:
        click.echo(result)

@text.command(name="update")
@click.argument("id")
@click.pass_context
def text_update(ctx, id):
    """update text"""
    result = ctx.obj["backend"].execute("text", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("text-update", result))
    else:
        click.echo(result)

@text.command(name="delete")
@click.argument("id")
@click.pass_context
def text_delete(ctx, id):
    """delete text"""
    result = ctx.obj["backend"].execute("text", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("text-delete", result))
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
def transform(ctx):
    """Transform operations."""
    pass

@transform.command(name="list")
@click.option("--id", default=None, help="transform identifier")
@click.pass_context
def transform_list(ctx, id):
    """list transform"""
    result = ctx.obj["backend"].execute("transform", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transform-list", result))
    else:
        click.echo(result)

@transform.command(name="create")
@click.option("--id", default=None, help="transform identifier")
@click.pass_context
def transform_create(ctx, id):
    """create transform"""
    result = ctx.obj["backend"].execute("transform", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transform-create", result))
    else:
        click.echo(result)

@transform.command(name="get")
@click.argument("id")
@click.pass_context
def transform_get(ctx, id):
    """get transform"""
    result = ctx.obj["backend"].execute("transform", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transform-get", result))
    else:
        click.echo(result)

@transform.command(name="update")
@click.argument("id")
@click.pass_context
def transform_update(ctx, id):
    """update transform"""
    result = ctx.obj["backend"].execute("transform", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transform-update", result))
    else:
        click.echo(result)

@transform.command(name="delete")
@click.argument("id")
@click.pass_context
def transform_delete(ctx, id):
    """delete transform"""
    result = ctx.obj["backend"].execute("transform", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transform-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
