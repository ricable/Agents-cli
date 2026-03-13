"""LibreOffice CLI — Click-based agent-native wrapper."""
import click
from cli_anything_core.output import json_response, error_response
from cli_anything_libreoffice.backend import LibreofficeBackend

__version__ = "0.1.0"


@click.group()
@click.version_option(__version__, prog_name="cli-anything-libreoffice")
@click.option("--json", "use_json", is_flag=True, help="Output structured JSON")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx, use_json, verbose):
    """LibreOffice CLI — agent-native wrapper for LibreOffice."""
    ctx.ensure_object(dict)
    ctx.obj["json"] = use_json
    ctx.obj["verbose"] = verbose
    ctx.obj["backend"] = LibreofficeBackend()


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
def spreadsheet(ctx):
    """Spreadsheet operations."""
    pass

@spreadsheet.command(name="list")
@click.option("--id", default=None, help="spreadsheet identifier")
@click.pass_context
def spreadsheet_list(ctx, id):
    """list spreadsheet"""
    result = ctx.obj["backend"].execute("spreadsheet", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("spreadsheet-list", result))
    else:
        click.echo(result)

@spreadsheet.command(name="create")
@click.option("--id", default=None, help="spreadsheet identifier")
@click.pass_context
def spreadsheet_create(ctx, id):
    """create spreadsheet"""
    result = ctx.obj["backend"].execute("spreadsheet", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("spreadsheet-create", result))
    else:
        click.echo(result)

@spreadsheet.command(name="get")
@click.argument("id")
@click.pass_context
def spreadsheet_get(ctx, id):
    """get spreadsheet"""
    result = ctx.obj["backend"].execute("spreadsheet", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("spreadsheet-get", result))
    else:
        click.echo(result)

@spreadsheet.command(name="update")
@click.argument("id")
@click.pass_context
def spreadsheet_update(ctx, id):
    """update spreadsheet"""
    result = ctx.obj["backend"].execute("spreadsheet", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("spreadsheet-update", result))
    else:
        click.echo(result)

@spreadsheet.command(name="delete")
@click.argument("id")
@click.pass_context
def spreadsheet_delete(ctx, id):
    """delete spreadsheet"""
    result = ctx.obj["backend"].execute("spreadsheet", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("spreadsheet-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def presentation(ctx):
    """Presentation operations."""
    pass

@presentation.command(name="list")
@click.option("--id", default=None, help="presentation identifier")
@click.pass_context
def presentation_list(ctx, id):
    """list presentation"""
    result = ctx.obj["backend"].execute("presentation", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("presentation-list", result))
    else:
        click.echo(result)

@presentation.command(name="create")
@click.option("--id", default=None, help="presentation identifier")
@click.pass_context
def presentation_create(ctx, id):
    """create presentation"""
    result = ctx.obj["backend"].execute("presentation", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("presentation-create", result))
    else:
        click.echo(result)

@presentation.command(name="get")
@click.argument("id")
@click.pass_context
def presentation_get(ctx, id):
    """get presentation"""
    result = ctx.obj["backend"].execute("presentation", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("presentation-get", result))
    else:
        click.echo(result)

@presentation.command(name="update")
@click.argument("id")
@click.pass_context
def presentation_update(ctx, id):
    """update presentation"""
    result = ctx.obj["backend"].execute("presentation", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("presentation-update", result))
    else:
        click.echo(result)

@presentation.command(name="delete")
@click.argument("id")
@click.pass_context
def presentation_delete(ctx, id):
    """delete presentation"""
    result = ctx.obj["backend"].execute("presentation", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("presentation-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def convert(ctx):
    """Convert operations."""
    pass

@convert.command(name="list")
@click.option("--id", default=None, help="convert identifier")
@click.pass_context
def convert_list(ctx, id):
    """list convert"""
    result = ctx.obj["backend"].execute("convert", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("convert-list", result))
    else:
        click.echo(result)

@convert.command(name="create")
@click.option("--id", default=None, help="convert identifier")
@click.pass_context
def convert_create(ctx, id):
    """create convert"""
    result = ctx.obj["backend"].execute("convert", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("convert-create", result))
    else:
        click.echo(result)

@convert.command(name="get")
@click.argument("id")
@click.pass_context
def convert_get(ctx, id):
    """get convert"""
    result = ctx.obj["backend"].execute("convert", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("convert-get", result))
    else:
        click.echo(result)

@convert.command(name="update")
@click.argument("id")
@click.pass_context
def convert_update(ctx, id):
    """update convert"""
    result = ctx.obj["backend"].execute("convert", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("convert-update", result))
    else:
        click.echo(result)

@convert.command(name="delete")
@click.argument("id")
@click.pass_context
def convert_delete(ctx, id):
    """delete convert"""
    result = ctx.obj["backend"].execute("convert", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("convert-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def macro(ctx):
    """Macro operations."""
    pass

@macro.command(name="list")
@click.option("--id", default=None, help="macro identifier")
@click.pass_context
def macro_list(ctx, id):
    """list macro"""
    result = ctx.obj["backend"].execute("macro", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("macro-list", result))
    else:
        click.echo(result)

@macro.command(name="create")
@click.option("--id", default=None, help="macro identifier")
@click.pass_context
def macro_create(ctx, id):
    """create macro"""
    result = ctx.obj["backend"].execute("macro", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("macro-create", result))
    else:
        click.echo(result)

@macro.command(name="get")
@click.argument("id")
@click.pass_context
def macro_get(ctx, id):
    """get macro"""
    result = ctx.obj["backend"].execute("macro", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("macro-get", result))
    else:
        click.echo(result)

@macro.command(name="update")
@click.argument("id")
@click.pass_context
def macro_update(ctx, id):
    """update macro"""
    result = ctx.obj["backend"].execute("macro", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("macro-update", result))
    else:
        click.echo(result)

@macro.command(name="delete")
@click.argument("id")
@click.pass_context
def macro_delete(ctx, id):
    """delete macro"""
    result = ctx.obj["backend"].execute("macro", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("macro-delete", result))
    else:
        click.echo(result)


@cli.group()
@click.pass_context
def template(ctx):
    """Template operations."""
    pass

@template.command(name="list")
@click.option("--id", default=None, help="template identifier")
@click.pass_context
def template_list(ctx, id):
    """list template"""
    result = ctx.obj["backend"].execute("template", "list", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("template-list", result))
    else:
        click.echo(result)

@template.command(name="create")
@click.option("--id", default=None, help="template identifier")
@click.pass_context
def template_create(ctx, id):
    """create template"""
    result = ctx.obj["backend"].execute("template", "create", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("template-create", result))
    else:
        click.echo(result)

@template.command(name="get")
@click.argument("id")
@click.pass_context
def template_get(ctx, id):
    """get template"""
    result = ctx.obj["backend"].execute("template", "get", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("template-get", result))
    else:
        click.echo(result)

@template.command(name="update")
@click.argument("id")
@click.pass_context
def template_update(ctx, id):
    """update template"""
    result = ctx.obj["backend"].execute("template", "update", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("template-update", result))
    else:
        click.echo(result)

@template.command(name="delete")
@click.argument("id")
@click.pass_context
def template_delete(ctx, id):
    """delete template"""
    result = ctx.obj["backend"].execute("template", "delete", id=id)
    if ctx.obj.get("json"):
        click.echo(json_response("template-delete", result))
    else:
        click.echo(result)



def main():
    cli()

if __name__ == "__main__":
    main()
