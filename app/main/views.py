import settings as _settings

from zorro.render import get_template, render_template, Response

__all__ = ['header', 'main']


# ROUTES

def main():
    return render_template('main/index.html',
                           language=getattr(_settings, 'LANGUAGE', 'en'))


@Response(selector="header")
def header():
    return get_template('main/header.html')
