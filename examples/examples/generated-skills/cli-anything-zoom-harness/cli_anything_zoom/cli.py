"""Zoom CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_zoom.backend import ZoomBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-zoom")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """Zoom CLI — agent-native wrapper for Zoom."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = ZoomBackend()


@cli.group()
@click.pass_context
def meeting(ctx):
    """Meeting operations."""
    pass

@meeting.command(name="list")
@click.option("--id", default=None, help="meeting identifier")
@click.pass_context
def meeting_list(ctx, id):
    """list meeting"""
    result = ctx.obj["backend"].execute("meeting", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("meeting-list", result))
    else:
        click.echo(result)

@meeting.command(name="create")
@click.option("--id", default=None, help="meeting identifier")
@click.pass_context
def meeting_create(ctx, id):
    """create meeting"""
    result = ctx.obj["backend"].execute("meeting", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("meeting-create", result))
    else:
        click.echo(result)

@meeting.command(name="get")
@click.argument("id")
@click.pass_context
def meeting_get(ctx, id):
    """get meeting"""
    result = ctx.obj["backend"].execute("meeting", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("meeting-get", result))
    else:
        click.echo(result)

@meeting.command(name="update")
@click.argument("id")
@click.pass_context
def meeting_update(ctx, id):
    """update meeting"""
    result = ctx.obj["backend"].execute("meeting", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("meeting-update", result))
    else:
        click.echo(result)

@meeting.command(name="delete")
@click.argument("id")
@click.pass_context
def meeting_delete(ctx, id):
    """delete meeting"""
    result = ctx.obj["backend"].execute("meeting", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("meeting-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def user(ctx):
    """User operations."""
    pass

@user.command(name="list")
@click.option("--id", default=None, help="user identifier")
@click.pass_context
def user_list(ctx, id):
    """list user"""
    result = ctx.obj["backend"].execute("user", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("user-list", result))
    else:
        click.echo(result)

@user.command(name="create")
@click.option("--id", default=None, help="user identifier")
@click.pass_context
def user_create(ctx, id):
    """create user"""
    result = ctx.obj["backend"].execute("user", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("user-create", result))
    else:
        click.echo(result)

@user.command(name="get")
@click.argument("id")
@click.pass_context
def user_get(ctx, id):
    """get user"""
    result = ctx.obj["backend"].execute("user", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("user-get", result))
    else:
        click.echo(result)

@user.command(name="update")
@click.argument("id")
@click.pass_context
def user_update(ctx, id):
    """update user"""
    result = ctx.obj["backend"].execute("user", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("user-update", result))
    else:
        click.echo(result)

@user.command(name="delete")
@click.argument("id")
@click.pass_context
def user_delete(ctx, id):
    """delete user"""
    result = ctx.obj["backend"].execute("user", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("user-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def recording(ctx):
    """Recording operations."""
    pass

@recording.command(name="list")
@click.option("--id", default=None, help="recording identifier")
@click.pass_context
def recording_list(ctx, id):
    """list recording"""
    result = ctx.obj["backend"].execute("recording", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("recording-list", result))
    else:
        click.echo(result)

@recording.command(name="create")
@click.option("--id", default=None, help="recording identifier")
@click.pass_context
def recording_create(ctx, id):
    """create recording"""
    result = ctx.obj["backend"].execute("recording", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("recording-create", result))
    else:
        click.echo(result)

@recording.command(name="get")
@click.argument("id")
@click.pass_context
def recording_get(ctx, id):
    """get recording"""
    result = ctx.obj["backend"].execute("recording", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("recording-get", result))
    else:
        click.echo(result)

@recording.command(name="update")
@click.argument("id")
@click.pass_context
def recording_update(ctx, id):
    """update recording"""
    result = ctx.obj["backend"].execute("recording", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("recording-update", result))
    else:
        click.echo(result)

@recording.command(name="delete")
@click.argument("id")
@click.pass_context
def recording_delete(ctx, id):
    """delete recording"""
    result = ctx.obj["backend"].execute("recording", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("recording-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def report(ctx):
    """Report operations."""
    pass

@report.command(name="list")
@click.option("--id", default=None, help="report identifier")
@click.pass_context
def report_list(ctx, id):
    """list report"""
    result = ctx.obj["backend"].execute("report", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("report-list", result))
    else:
        click.echo(result)

@report.command(name="create")
@click.option("--id", default=None, help="report identifier")
@click.pass_context
def report_create(ctx, id):
    """create report"""
    result = ctx.obj["backend"].execute("report", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("report-create", result))
    else:
        click.echo(result)

@report.command(name="get")
@click.argument("id")
@click.pass_context
def report_get(ctx, id):
    """get report"""
    result = ctx.obj["backend"].execute("report", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("report-get", result))
    else:
        click.echo(result)

@report.command(name="update")
@click.argument("id")
@click.pass_context
def report_update(ctx, id):
    """update report"""
    result = ctx.obj["backend"].execute("report", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("report-update", result))
    else:
        click.echo(result)

@report.command(name="delete")
@click.argument("id")
@click.pass_context
def report_delete(ctx, id):
    """delete report"""
    result = ctx.obj["backend"].execute("report", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("report-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def webinar(ctx):
    """Webinar operations."""
    pass

@webinar.command(name="list")
@click.option("--id", default=None, help="webinar identifier")
@click.pass_context
def webinar_list(ctx, id):
    """list webinar"""
    result = ctx.obj["backend"].execute("webinar", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("webinar-list", result))
    else:
        click.echo(result)

@webinar.command(name="create")
@click.option("--id", default=None, help="webinar identifier")
@click.pass_context
def webinar_create(ctx, id):
    """create webinar"""
    result = ctx.obj["backend"].execute("webinar", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("webinar-create", result))
    else:
        click.echo(result)

@webinar.command(name="get")
@click.argument("id")
@click.pass_context
def webinar_get(ctx, id):
    """get webinar"""
    result = ctx.obj["backend"].execute("webinar", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("webinar-get", result))
    else:
        click.echo(result)

@webinar.command(name="update")
@click.argument("id")
@click.pass_context
def webinar_update(ctx, id):
    """update webinar"""
    result = ctx.obj["backend"].execute("webinar", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("webinar-update", result))
    else:
        click.echo(result)

@webinar.command(name="delete")
@click.argument("id")
@click.pass_context
def webinar_delete(ctx, id):
    """delete webinar"""
    result = ctx.obj["backend"].execute("webinar", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("webinar-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
