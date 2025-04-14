import os

from pathlib import Path
from .bindings import *
from .core import *
from .interfaces import *

__all__ = ['init']
__all__.extend(bindings.__all__)
__all__.extend(core.__all__)
__all__.extend(interfaces.__all__)

_JS_FILES = ('binder.js', 'bindings.js', 'notify.js')


def init():
    from bottle import route

    route(path="/mvvm/js/<file:path>", callback=_file_js)


def _file_js(file: str):
    from bottle import static_file
    from eel import _set_response_headers

    responce = ''  # TODO: выяснить что отобразится в html
    if file not in _JS_FILES:
        return responce

    response = static_file(os.path.join('js', file), root=Path(__file__).parent)
    response.content_type = 'application/javascript'

    _set_response_headers(response)
    return response
