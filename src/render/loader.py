import os

from jinja2 import TemplateNotFound
from jinja2.loaders import FileSystemLoader
from jinja2.utils import open_if_exists

__all__ = ['BaseFileSystemLoader']


class BaseFileSystemLoader(FileSystemLoader):

    def get_source(self, environment, template):
        """Get content from file.

        :param self: Base's class element (FileSystemLoader class).
        :param environment: jinja2 Environment element.
        :param template: Name of the template to load. When loading
            templates from the filesystem, "/" is used as the path
            separator, even on Windows.
        :return: Content, normpath of template, uptodate function (last for auto_reload).
        """

        f = open_if_exists(template)
        if f is None:
            raise TemplateNotFound(template)
        try:
            contents = f.read().decode(self.encoding)
        finally:
            f.close()

        mtime = os.path.getmtime(template)

        def uptodate() -> bool:
            try:
                return os.path.getmtime(template) == mtime
            except OSError:
                return False

        # Use normpath to convert Windows altsep to sep.
        return contents, os.path.normpath(template), uptodate
