import os
import settings as _settings

from bottle import static_file
from eel import _set_response_headers
from zorro.render import get_template, render_template, Response

__all__ = ['header', 'main', 'node_modules']


# STATIC

def node_modules(file: str):
    responce = ''
    if file not in ('jquery.js', 'jquery-ui.js', 'jquery-ui.css'):
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
    _set_response_headers(response)
    return response


# ROUTES

def main():
    return render_template('main/index.html',
                           language=getattr(_settings, 'LANGUAGE', 'en'))


@Response(selector="header")
def header():
    return get_template('main/header.html')
