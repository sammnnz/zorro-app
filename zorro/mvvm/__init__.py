import os

from bottle import route
from pathlib import Path
from .bindings import *
from .core import *
from .interfaces import *

__all__ = []
__all__.extend(bindings.__all__)
__all__.extend(core.__all__)
__all__.extend(interfaces.__all__)


@route("/mvvm/js/<file:path>")
def _load_js(file: str):
    from bottle import static_file
    from eel import _set_response_headers

    responce = ''
    if file not in ('binder.js', 'bindings.js', 'notify.js'):
        return responce

    response = static_file(os.path.join('js', file), root=Path(__file__).parent)
    response.content_type = 'application/javascript'
    _set_response_headers(response)
    return response
