import os
import sys

from types import ModuleType
from typing import Any, Dict

__all__ = [
    'check_settings',
    'get_all_directories',
    'get_app_root',
    'get_settings',
    'get_static_roots',
    'get_template_roots',
    'load_objects'
]


def check_settings(settings: ModuleType):
    for param in _get_minimal_settings_params():
        if not hasattr(settings, param):
            raise AttributeError('Please create %s object in settings.py.' % param)

    print('Settings verified successfully!')


def get_all_directories(path):
    result = []
    if not os.path.isdir(path):
        return result
    result = [path]
    for root, dirs, files in os.walk(path):
        for dir_ in dirs:
            result += get_all_directories(os.path.join(root, dir_))
    return result


def get_app_root(app):
    """Returns path to app or app name.

    """
    if isinstance(app, (str,)):
        __import__(app)
        app = sys.modules[app]

    return os.path.dirname(os.path.abspath(app.__file__))


def get_settings(lower: bool = True) -> dict:
    try:
        settings = __import__('settings', None, locals())
    except ImportError:
        raise ImportError('settings.py must be exist in root of project.')

    res = {}
    for key in _get_all_settings_params():
        res.update({key.lower() if lower else key: getattr(settings, key, None)})

    return res


def get_static_roots(apps):
    """Returns list of apps static roots.

    """
    res = []
    for app in apps:
        if isinstance(app, (str,)):
            __import__(app)
            path = os.path.abspath(sys.modules[app].__file__)
            res.append(os.path.join(os.path.dirname(path), 'static'))

    return res


def get_template_roots(apps):
    """Get list with all app's templates paths like .../app/app_name/templates.

    """
    result = []
    for app in apps:
        app_root = get_app_root(app)
        templates_path = os.path.join(app_root, 'templates')
        if not os.path.isdir(templates_path):
            raise FileNotFoundError(
                "Please create 'templates/%s' directory in the '%s' application."
                % (app.split('.')[-1], app))

        result += [templates_path]

    return result


def load_objects(mo_path: str, mo_name: str, *object_names: str, depth: int = 50) -> Dict[str, Dict[str, Any]]:
    result = {}
    for name in sorted(os.listdir(mo_path), key=lambda p: os.path.isdir(p)):
        path = os.path.join(mo_path, name)
        if depth <= 0:
            break
        if os.path.isdir(path):
            lo = load_objects(path, mo_name, *object_names, depth=depth)
            if len(lo) == 1:
                if len(lo[list(lo.keys())[0]]) == len(object_names):
                    depth -= 1
            result.update(lo)
        elif os.path.isfile(path) and name == mo_name:
            path = path[:-3]
            temp_arr = path.split('\\')
            while True:
                try:
                    name = '.'.join(temp_arr)
                    if __import__(name, locals=locals()):
                        result[name] = {}
                        for obj in object_names:
                            try:
                                result[name][obj] = sys.modules[name].__dict__[obj]
                            except KeyError:
                                continue
                        break
                except (ImportError, ValueError):
                    try:
                        temp_arr.pop(0)
                    except IndexError:
                        break
                    continue
    return result


def _get_all_settings_params():
    yield 'APPS'
    yield 'DEBUG'
    yield 'JINJA'
    yield 'HOST'
    yield 'LANGUAGE'
    yield 'PORT'
    yield 'ROOT_PATH'
    yield 'START_URL'


def _get_minimal_settings_params():
    yield 'APPS'
    yield 'HOST'
    yield 'PORT'
    yield 'ROOT_PATH'
    yield 'START_URL'
