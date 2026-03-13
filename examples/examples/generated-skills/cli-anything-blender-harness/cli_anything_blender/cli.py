"""Blender CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_blender.backend import BlenderBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-blender")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Blender CLI — agent-native wrapper for Blender."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = BlenderBackend()


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
def mesh(ctx):
    """Mesh operations."""
    pass

@mesh.command(name="list")
@click.option("--id", default=None, help="mesh identifier")
@click.pass_context
def mesh_list(ctx, id):
    """list mesh"""
    result = ctx.obj["backend"].execute("mesh", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("mesh-list", result))
    else:
        click.echo(result)

@mesh.command(name="create")
@click.option("--id", default=None, help="mesh identifier")
@click.pass_context
def mesh_create(ctx, id):
    """create mesh"""
    result = ctx.obj["backend"].execute("mesh", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("mesh-create", result))
    else:
        click.echo(result)

@mesh.command(name="get")
@click.argument("id")
@click.pass_context
def mesh_get(ctx, id):
    """get mesh"""
    result = ctx.obj["backend"].execute("mesh", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("mesh-get", result))
    else:
        click.echo(result)

@mesh.command(name="update")
@click.argument("id")
@click.pass_context
def mesh_update(ctx, id):
    """update mesh"""
    result = ctx.obj["backend"].execute("mesh", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("mesh-update", result))
    else:
        click.echo(result)

@mesh.command(name="delete")
@click.argument("id")
@click.pass_context
def mesh_delete(ctx, id):
    """delete mesh"""
    result = ctx.obj["backend"].execute("mesh", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("mesh-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def material(ctx):
    """Material operations."""
    pass

@material.command(name="list")
@click.option("--id", default=None, help="material identifier")
@click.pass_context
def material_list(ctx, id):
    """list material"""
    result = ctx.obj["backend"].execute("material", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("material-list", result))
    else:
        click.echo(result)

@material.command(name="create")
@click.option("--id", default=None, help="material identifier")
@click.pass_context
def material_create(ctx, id):
    """create material"""
    result = ctx.obj["backend"].execute("material", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("material-create", result))
    else:
        click.echo(result)

@material.command(name="get")
@click.argument("id")
@click.pass_context
def material_get(ctx, id):
    """get material"""
    result = ctx.obj["backend"].execute("material", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("material-get", result))
    else:
        click.echo(result)

@material.command(name="update")
@click.argument("id")
@click.pass_context
def material_update(ctx, id):
    """update material"""
    result = ctx.obj["backend"].execute("material", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("material-update", result))
    else:
        click.echo(result)

@material.command(name="delete")
@click.argument("id")
@click.pass_context
def material_delete(ctx, id):
    """delete material"""
    result = ctx.obj["backend"].execute("material", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("material-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def render(ctx):
    """Render operations."""
    pass

@render.command(name="list")
@click.option("--id", default=None, help="render identifier")
@click.pass_context
def render_list(ctx, id):
    """list render"""
    result = ctx.obj["backend"].execute("render", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("render-list", result))
    else:
        click.echo(result)

@render.command(name="create")
@click.option("--id", default=None, help="render identifier")
@click.pass_context
def render_create(ctx, id):
    """create render"""
    result = ctx.obj["backend"].execute("render", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("render-create", result))
    else:
        click.echo(result)

@render.command(name="get")
@click.argument("id")
@click.pass_context
def render_get(ctx, id):
    """get render"""
    result = ctx.obj["backend"].execute("render", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("render-get", result))
    else:
        click.echo(result)

@render.command(name="update")
@click.argument("id")
@click.pass_context
def render_update(ctx, id):
    """update render"""
    result = ctx.obj["backend"].execute("render", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("render-update", result))
    else:
        click.echo(result)

@render.command(name="delete")
@click.argument("id")
@click.pass_context
def render_delete(ctx, id):
    """delete render"""
    result = ctx.obj["backend"].execute("render", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("render-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def animation(ctx):
    """Animation operations."""
    pass

@animation.command(name="list")
@click.option("--id", default=None, help="animation identifier")
@click.pass_context
def animation_list(ctx, id):
    """list animation"""
    result = ctx.obj["backend"].execute("animation", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("animation-list", result))
    else:
        click.echo(result)

@animation.command(name="create")
@click.option("--id", default=None, help="animation identifier")
@click.pass_context
def animation_create(ctx, id):
    """create animation"""
    result = ctx.obj["backend"].execute("animation", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("animation-create", result))
    else:
        click.echo(result)

@animation.command(name="get")
@click.argument("id")
@click.pass_context
def animation_get(ctx, id):
    """get animation"""
    result = ctx.obj["backend"].execute("animation", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("animation-get", result))
    else:
        click.echo(result)

@animation.command(name="update")
@click.argument("id")
@click.pass_context
def animation_update(ctx, id):
    """update animation"""
    result = ctx.obj["backend"].execute("animation", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("animation-update", result))
    else:
        click.echo(result)

@animation.command(name="delete")
@click.argument("id")
@click.pass_context
def animation_delete(ctx, id):
    """delete animation"""
    result = ctx.obj["backend"].execute("animation", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("animation-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def modifier(ctx):
    """Modifier operations."""
    pass

@modifier.command(name="list")
@click.option("--id", default=None, help="modifier identifier")
@click.pass_context
def modifier_list(ctx, id):
    """list modifier"""
    result = ctx.obj["backend"].execute("modifier", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("modifier-list", result))
    else:
        click.echo(result)

@modifier.command(name="create")
@click.option("--id", default=None, help="modifier identifier")
@click.pass_context
def modifier_create(ctx, id):
    """create modifier"""
    result = ctx.obj["backend"].execute("modifier", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("modifier-create", result))
    else:
        click.echo(result)

@modifier.command(name="get")
@click.argument("id")
@click.pass_context
def modifier_get(ctx, id):
    """get modifier"""
    result = ctx.obj["backend"].execute("modifier", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("modifier-get", result))
    else:
        click.echo(result)

@modifier.command(name="update")
@click.argument("id")
@click.pass_context
def modifier_update(ctx, id):
    """update modifier"""
    result = ctx.obj["backend"].execute("modifier", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("modifier-update", result))
    else:
        click.echo(result)

@modifier.command(name="delete")
@click.argument("id")
@click.pass_context
def modifier_delete(ctx, id):
    """delete modifier"""
    result = ctx.obj["backend"].execute("modifier", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("modifier-delete", result))
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
