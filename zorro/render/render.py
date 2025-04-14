import bottle as btl
import eel
import os
import random
import typing as t

from .environment import BaseEnvironment
from .loader import BaseFileSystemLoader
from jinja2 import Environment, FileSystemBytecodeCache, select_autoescape
from zorro.utils import get_static_roots, get_template_roots

__all__ = ['BaseRender', 'FSLRender', 'get_template', 'render_template', 'Response']

jinja_environment: t.Optional[Environment] = None


# Render classes
class BaseRender:
    def __init__(self, apps, **kwargs):
        self.apps = apps
        self.static_roots = get_static_roots(apps)

        # Static initialize
        btl.route('/static/<app>/<path:path>')(self.load_static_file)

    def create_environment(self):
        raise NotImplementedError('Implementation required.')

    def load_static_file(self, app, path):
        raise NotImplementedError('Implementation required.')


class FSLRender(BaseRender):
    def __init__(self, apps, **kwargs):
        super(FSLRender, self).__init__(apps, **kwargs)
        defaults = {
            'auto_reload': True,
            'autoescape': select_autoescape(['', 'htm', 'html', 'tpl', 'xml']),
            'extensions': []
        }
        self.auto_reload = kwargs['auto_reload'] \
            if 'auto_reload' in kwargs \
            else defaults['auto_reload']
        self.autoescape = kwargs['autoescape'] \
            if 'autoescape' in kwargs \
            else defaults['autoescape']
        self.extensions = kwargs['extensions'] \
            if 'extensions' in kwargs \
            else defaults['extensions']
        self.bytecode_cache = None
        self.loader = BaseFileSystemLoader(get_template_roots(apps))

    def create_environment(self):
        global jinja_environment

        if jinja_environment is not None:
            raise ValueError("'jinja_environment' already exists.")

        cache_directory = os.path.join(os.environ['TEMP'], 'j2_templates_cache')
        if not os.path.isdir(cache_directory):
            os.mkdir(cache_directory)

        cache_pattern = '__jinja2__' + \
                        str(random.randint(1000000000000000, 9999999999999999)) + \
                        '__%s.cache'
        self.bytecode_cache = FileSystemBytecodeCache(cache_directory, cache_pattern)
        jinja_environment = BaseEnvironment(auto_reload=self.auto_reload,
                                            autoescape=self.autoescape,
                                            bytecode_cache=self.bytecode_cache,
                                            loader=self.loader,
                                            extensions=self.extensions)

        # return jinja_environment

    def load_static_file(self, app, path):
        print("Load static:", path)
        for root in self.static_roots:
            if os.path.exists(os.path.join(root, app, path)):
                response = btl.static_file(os.path.join(app, path), root=root)
                _set_response_headers(response)

                return response

        return None


def get_template(path: str, **kwargs):
    template = 'Error'
    if jinja_environment is None:
        return template

    template = jinja_environment.get_template(path).render(**kwargs)

    return template


def render_template(path, **kwargs):
    template = 'Error'
    if jinja_environment is None:
        return btl.HTTPResponse(template, status_code=400)

    template = jinja_environment.get_template(path)
    response = btl.HTTPResponse(template.render(**kwargs))
    _set_response_headers(response)

    return response


_set_response_headers = getattr(eel, "_set_response_headers", lambda r: print(
    "Eel has no '_set_response_headers' function."
))


class Response:
    def __init__(self, **kwargs):
        self.kw = {
            'body': '',
            'selector': '#dummy',
        }
        self.kw.update(kwargs)

    def __call__(self, func):
        def wrapper():
            self.kw['body'] = func()

            return self.kw

        return wrapper
