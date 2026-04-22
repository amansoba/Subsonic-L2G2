from fastapi import Request
from fastapi.templating import Jinja2Templates


templates = Jinja2Templates(directory="view/templates")


class View:
    def get_view(self, request: Request, template_name: str, data: dict | None = None):
        context = {}
        if data:
            context["data"] = data
        return templates.TemplateResponse(request=request, name=template_name, context=context)

