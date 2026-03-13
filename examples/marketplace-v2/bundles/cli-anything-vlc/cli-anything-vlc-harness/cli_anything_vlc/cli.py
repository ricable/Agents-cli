"""VLC CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_vlc.backend import VlcBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-vlc")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """VLC CLI — agent-native wrapper for VLC."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = VlcBackend()


@cli.group()
@click.pass_context
def playback(ctx):
    """Playback operations."""
    pass

@playback.command(name="list")
@click.option("--id", default=None, help="playback identifier")
@click.pass_context
def playback_list(ctx, id):
    """list playback"""
    result = ctx.obj["backend"].execute("playback", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playback-list", result))
    else:
        click.echo(result)

@playback.command(name="create")
@click.option("--id", default=None, help="playback identifier")
@click.pass_context
def playback_create(ctx, id):
    """create playback"""
    result = ctx.obj["backend"].execute("playback", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playback-create", result))
    else:
        click.echo(result)

@playback.command(name="get")
@click.argument("id")
@click.pass_context
def playback_get(ctx, id):
    """get playback"""
    result = ctx.obj["backend"].execute("playback", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playback-get", result))
    else:
        click.echo(result)

@playback.command(name="update")
@click.argument("id")
@click.pass_context
def playback_update(ctx, id):
    """update playback"""
    result = ctx.obj["backend"].execute("playback", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playback-update", result))
    else:
        click.echo(result)

@playback.command(name="delete")
@click.argument("id")
@click.pass_context
def playback_delete(ctx, id):
    """delete playback"""
    result = ctx.obj["backend"].execute("playback", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playback-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def playlist(ctx):
    """Playlist operations."""
    pass

@playlist.command(name="list")
@click.option("--id", default=None, help="playlist identifier")
@click.pass_context
def playlist_list(ctx, id):
    """list playlist"""
    result = ctx.obj["backend"].execute("playlist", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playlist-list", result))
    else:
        click.echo(result)

@playlist.command(name="create")
@click.option("--id", default=None, help="playlist identifier")
@click.pass_context
def playlist_create(ctx, id):
    """create playlist"""
    result = ctx.obj["backend"].execute("playlist", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playlist-create", result))
    else:
        click.echo(result)

@playlist.command(name="get")
@click.argument("id")
@click.pass_context
def playlist_get(ctx, id):
    """get playlist"""
    result = ctx.obj["backend"].execute("playlist", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playlist-get", result))
    else:
        click.echo(result)

@playlist.command(name="update")
@click.argument("id")
@click.pass_context
def playlist_update(ctx, id):
    """update playlist"""
    result = ctx.obj["backend"].execute("playlist", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playlist-update", result))
    else:
        click.echo(result)

@playlist.command(name="delete")
@click.argument("id")
@click.pass_context
def playlist_delete(ctx, id):
    """delete playlist"""
    result = ctx.obj["backend"].execute("playlist", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("playlist-delete", result))
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
def transcode(ctx):
    """Transcode operations."""
    pass

@transcode.command(name="list")
@click.option("--id", default=None, help="transcode identifier")
@click.pass_context
def transcode_list(ctx, id):
    """list transcode"""
    result = ctx.obj["backend"].execute("transcode", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transcode-list", result))
    else:
        click.echo(result)

@transcode.command(name="create")
@click.option("--id", default=None, help="transcode identifier")
@click.pass_context
def transcode_create(ctx, id):
    """create transcode"""
    result = ctx.obj["backend"].execute("transcode", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transcode-create", result))
    else:
        click.echo(result)

@transcode.command(name="get")
@click.argument("id")
@click.pass_context
def transcode_get(ctx, id):
    """get transcode"""
    result = ctx.obj["backend"].execute("transcode", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transcode-get", result))
    else:
        click.echo(result)

@transcode.command(name="update")
@click.argument("id")
@click.pass_context
def transcode_update(ctx, id):
    """update transcode"""
    result = ctx.obj["backend"].execute("transcode", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transcode-update", result))
    else:
        click.echo(result)

@transcode.command(name="delete")
@click.argument("id")
@click.pass_context
def transcode_delete(ctx, id):
    """delete transcode"""
    result = ctx.obj["backend"].execute("transcode", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("transcode-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def info(ctx):
    """Info operations."""
    pass

@info.command(name="list")
@click.option("--id", default=None, help="info identifier")
@click.pass_context
def info_list(ctx, id):
    """list info"""
    result = ctx.obj["backend"].execute("info", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("info-list", result))
    else:
        click.echo(result)

@info.command(name="create")
@click.option("--id", default=None, help="info identifier")
@click.pass_context
def info_create(ctx, id):
    """create info"""
    result = ctx.obj["backend"].execute("info", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("info-create", result))
    else:
        click.echo(result)

@info.command(name="get")
@click.argument("id")
@click.pass_context
def info_get(ctx, id):
    """get info"""
    result = ctx.obj["backend"].execute("info", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("info-get", result))
    else:
        click.echo(result)

@info.command(name="update")
@click.argument("id")
@click.pass_context
def info_update(ctx, id):
    """update info"""
    result = ctx.obj["backend"].execute("info", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("info-update", result))
    else:
        click.echo(result)

@info.command(name="delete")
@click.argument("id")
@click.pass_context
def info_delete(ctx, id):
    """delete info"""
    result = ctx.obj["backend"].execute("info", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("info-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
