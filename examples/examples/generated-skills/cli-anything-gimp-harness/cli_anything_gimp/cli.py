"""GIMP CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_gimp.backend import GimpBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-gimp")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """GIMP CLI — agent-native wrapper for GIMP."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = GimpBackend()


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
def image(ctx):
    """Image operations."""
    pass

@image.command(name="list")
@click.option("--id", default=None, help="image identifier")
@click.pass_context
def image_list(ctx, id):
    """list image"""
    result = ctx.obj["backend"].execute("image", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("image-list", result))
    else:
        click.echo(result)

@image.command(name="create")
@click.option("--id", default=None, help="image identifier")
@click.pass_context
def image_create(ctx, id):
    """create image"""
    result = ctx.obj["backend"].execute("image", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("image-create", result))
    else:
        click.echo(result)

@image.command(name="get")
@click.argument("id")
@click.pass_context
def image_get(ctx, id):
    """get image"""
    result = ctx.obj["backend"].execute("image", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("image-get", result))
    else:
        click.echo(result)

@image.command(name="update")
@click.argument("id")
@click.pass_context
def image_update(ctx, id):
    """update image"""
    result = ctx.obj["backend"].execute("image", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("image-update", result))
    else:
        click.echo(result)

@image.command(name="delete")
@click.argument("id")
@click.pass_context
def image_delete(ctx, id):
    """delete image"""
    result = ctx.obj["backend"].execute("image", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("image-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def layer(ctx):
    """Layer operations."""
    pass

@layer.command(name="list")
@click.option("--id", default=None, help="layer identifier")
@click.pass_context
def layer_list(ctx, id):
    """list layer"""
    result = ctx.obj["backend"].execute("layer", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("layer-list", result))
    else:
        click.echo(result)

@layer.command(name="create")
@click.option("--id", default=None, help="layer identifier")
@click.pass_context
def layer_create(ctx, id):
    """create layer"""
    result = ctx.obj["backend"].execute("layer", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("layer-create", result))
    else:
        click.echo(result)

@layer.command(name="get")
@click.argument("id")
@click.pass_context
def layer_get(ctx, id):
    """get layer"""
    result = ctx.obj["backend"].execute("layer", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("layer-get", result))
    else:
        click.echo(result)

@layer.command(name="update")
@click.argument("id")
@click.pass_context
def layer_update(ctx, id):
    """update layer"""
    result = ctx.obj["backend"].execute("layer", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("layer-update", result))
    else:
        click.echo(result)

@layer.command(name="delete")
@click.argument("id")
@click.pass_context
def layer_delete(ctx, id):
    """delete layer"""
    result = ctx.obj["backend"].execute("layer", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("layer-delete", result))
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
def color(ctx):
    """Color operations."""
    pass

@color.command(name="list")
@click.option("--id", default=None, help="color identifier")
@click.pass_context
def color_list(ctx, id):
    """list color"""
    result = ctx.obj["backend"].execute("color", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("color-list", result))
    else:
        click.echo(result)

@color.command(name="create")
@click.option("--id", default=None, help="color identifier")
@click.pass_context
def color_create(ctx, id):
    """create color"""
    result = ctx.obj["backend"].execute("color", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("color-create", result))
    else:
        click.echo(result)

@color.command(name="get")
@click.argument("id")
@click.pass_context
def color_get(ctx, id):
    """get color"""
    result = ctx.obj["backend"].execute("color", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("color-get", result))
    else:
        click.echo(result)

@color.command(name="update")
@click.argument("id")
@click.pass_context
def color_update(ctx, id):
    """update color"""
    result = ctx.obj["backend"].execute("color", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("color-update", result))
    else:
        click.echo(result)

@color.command(name="delete")
@click.argument("id")
@click.pass_context
def color_delete(ctx, id):
    """delete color"""
    result = ctx.obj["backend"].execute("color", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("color-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def batch(ctx):
    """Batch operations."""
    pass

@batch.command(name="list")
@click.option("--id", default=None, help="batch identifier")
@click.pass_context
def batch_list(ctx, id):
    """list batch"""
    result = ctx.obj["backend"].execute("batch", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("batch-list", result))
    else:
        click.echo(result)

@batch.command(name="create")
@click.option("--id", default=None, help="batch identifier")
@click.pass_context
def batch_create(ctx, id):
    """create batch"""
    result = ctx.obj["backend"].execute("batch", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("batch-create", result))
    else:
        click.echo(result)

@batch.command(name="get")
@click.argument("id")
@click.pass_context
def batch_get(ctx, id):
    """get batch"""
    result = ctx.obj["backend"].execute("batch", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("batch-get", result))
    else:
        click.echo(result)

@batch.command(name="update")
@click.argument("id")
@click.pass_context
def batch_update(ctx, id):
    """update batch"""
    result = ctx.obj["backend"].execute("batch", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("batch-update", result))
    else:
        click.echo(result)

@batch.command(name="delete")
@click.argument("id")
@click.pass_context
def batch_delete(ctx, id):
    """delete batch"""
    result = ctx.obj["backend"].execute("batch", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("batch-delete", result))
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
