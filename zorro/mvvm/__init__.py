import os

from pathlib import Path
from .bindings import *
from .core import *
from .interfaces import *

__all__ = ['init']
__all__.extend(bindings.__all__)
__all__.extend(core.__all__)
__all__.extend(interfaces.__all__)

_files = ('binder.js', 'bindings.js', 'jquery.js', 'jquery-ui.js', 'jquery-ui.css', 'notify.js')


def init():
    from bottle import route

    route(path="/mvvm/js/<file:path>", callback=_file_js)
    route(path="/node_modules/js/<file:path>", callback=_node_js)
    route(path="/node_modules/css/<file:path>", callback=_node_js)


def _file_js(file: str):
    from bottle import static_file
    from eel import _set_response_headers

    responce = ''
    if file not in _files:
        return responce

    response = static_file(os.path.join('js', file), root=Path(__file__).parent)
    response.content_type = 'application/javascript'

    _set_response_headers(response)
    return response


def _node_js(file: str):
    from bottle import static_file
    from eel import _set_response_headers

    responce = ''
    if file not in _files:
        return responce

    path, content_type = '', ''
    if file.endswith('.js'):
        path = os.path.join('node_modules', file.removesuffix('.js'), 'dist', file)
        content_type = 'application/javascript'
    elif file.endswith('.css'):
        path = os.path.join('node_modules', file.removesuffix('.css'), 'dist', 'themes', 'base', file)
        content_type = 'text/css'

    response = static_file(path, root=os.getcwd())
    response.content_type = content_type
    print('\n', file, '\n')

    _set_response_headers(response)
    return response
