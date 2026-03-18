from fastapi import Request
from fastapi.templating import Jinja2Templates


templates = Jinja2Templates(directory="view/templates")


class View:
    def get_view(self, request: Request, template_name: str, data: dict | None = None):
        ctx = {"request": request}
        if data:
            ctx["data"] = data
        return templates.TemplateResponse(template_name, ctx)

