"""Kdenlive CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_kdenlive.backend import KdenliveBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-kdenlive")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Kdenlive CLI — agent-native wrapper for Kdenlive."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = KdenliveBackend()


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
def effect(ctx):
    """Effect operations."""
    pass

@effect.command(name="list")
@click.option("--id", default=None, help="effect identifier")
@click.pass_context
def effect_list(ctx, id):
    """list effect"""
    result = ctx.obj["backend"].execute("effect", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("effect-list", result))
    else:
        click.echo(result)

@effect.command(name="create")
@click.option("--id", default=None, help="effect identifier")
@click.pass_context
def effect_create(ctx, id):
    """create effect"""
    result = ctx.obj["backend"].execute("effect", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("effect-create", result))
    else:
        click.echo(result)

@effect.command(name="get")
@click.argument("id")
@click.pass_context
def effect_get(ctx, id):
    """get effect"""
    result = ctx.obj["backend"].execute("effect", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("effect-get", result))
    else:
        click.echo(result)

@effect.command(name="update")
@click.argument("id")
@click.pass_context
def effect_update(ctx, id):
    """update effect"""
    result = ctx.obj["backend"].execute("effect", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("effect-update", result))
    else:
        click.echo(result)

@effect.command(name="delete")
@click.argument("id")
@click.pass_context
def effect_delete(ctx, id):
    """delete effect"""
    result = ctx.obj["backend"].execute("effect", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("effect-delete", result))
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



def main():
    cli()

if __name__ == "__main__":
    main()
