import os
import posixpath

from jinja2 import Environment, Template, TemplateNotFound, FileSystemLoader
from jinja2.utils import internalcode

__all__ = ['BaseEnvironment']


class BaseEnvironment(Environment):
    """Teaching jinja2 to work with relatives paths like `../path` and templates from any
     app (`templates/app/...`).

    """

    def join_path(self, template, parent):
        loader = self.loader
        if not isinstance(loader, FileSystemLoader):
            raise NotImplementedError('%s is not supported.'
                                      % type(loader).__name__)

        if not parent:
            return _get_template_path(template, loader.searchpath)

        template_path = _get_template_path(parent, loader.searchpath)
        root = os.path.dirname(template_path)
        path = os.path.abspath(os.path.join(root, template))
        if posixpath.isfile(path):
            return path

        raise TemplateNotFound(template)

    @internalcode
    def get_template(
            self, name, parent=None, globals=None) -> Template:
        if isinstance(name, Template):
            return name

        loader = self.loader
        if not isinstance(loader, FileSystemLoader):
            raise NotImplementedError('%s is not supported.'
                                      % type(loader).__name__)

        if name.startswith("templates/"):
            name = _get_template_path(name[10:], loader.searchpath)
        else:
            name = self.join_path(name, parent)

        return self._load_template(name, globals)


def _get_template_path(template, paths):
    """Get posixpath of template.

    Args:
        template: Name of the template to load.
        paths: List of patches by templates.
    Return:
        String posixpath of template.

    Raises:
        TemplateNotFound: raise if template's path not found.
    """
    if posixpath.isfile(template):
        return template

    for path in paths:
        path = posixpath.join(path, template)
        if posixpath.isfile(path):
            return path

    raise TemplateNotFound(template)
