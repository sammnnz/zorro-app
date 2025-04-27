import bottle as btl
import os

from typing import Any, Callable, Dict, List, Tuple
from src.utils import get_app_root, load_objects

__all__ = ['setup_hooks', 'setup_routes', 'update_routes_and_hooks']

MAIN_APP_NAME_PATTERN = 'main'
ROUTES_FILE_NAME_PATTERN = 'routes.py'


def setup_hooks(hooks: Dict[str, Tuple[str, Callable[..., Any]]]) -> None:
    for name in hooks:
        desc, func = hooks[name]
        btl.hook(desc)(func)


def setup_routes(routes: Dict[str, Tuple[str, Callable[..., Any], str]]) -> None:
    for name in routes:
        path, func, method = routes[name]
        btl.route(path, method=method, name=name)(func)


def update_routes_and_hooks(apps: List[str]) -> None:
    hooks, routes = {}, {}
    _update_routes_and_hooks(os.path.dirname(os.path.abspath(__file__)), hooks, routes, '_')

    for app in apps:
        app_root = get_app_root(app)
        app_name = app.split('.')[-1]
        _update_routes_and_hooks(app_root, hooks, routes, app_name)

    setup_hooks(hooks)
    setup_routes(routes)


def _update_routes_and_hooks(path: str,
                             hooks: Dict[str, Tuple[str, Callable[..., Any]]],
                             routes: Dict[str, Tuple[str, Callable[..., Any], str]],
                             prefix: str = '') -> None:
    object_names = 'hooks', 'routes'
    for module_path, di in load_objects(path, ROUTES_FILE_NAME_PATTERN, *object_names).items():
        for key, obj in di.items():
            for name in object_names:
                if key != name:
                    continue

                for k, v in obj.items():
                    if not MAIN_APP_NAME_PATTERN == prefix and \
                            not k.startswith(prefix):
                        k = prefix + '_' + k

                    locals()[name][k] = v

                break
