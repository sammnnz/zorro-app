import typing as t

__all__ = [
    'BaseError',
    'CommandError',
    'DataContextError',
    'ModelError',
    'SettingsError',
    'ViewModelError',
]


class BaseError(Exception):
    def __init__(self, *args):
        super(BaseError, self).__init__(*_strip(args))


class CommandError(BaseError):
    pass


class DataContextError(BaseError):
    pass


class ModelError(BaseError):
    pass


class SettingsError(BaseError):
    pass


class ViewModelError(BaseError):
    pass


def _strip(args: t.Tuple) -> t.Tuple:
    args, i = list(args), 0
    for arg in args:
        if isinstance(arg, str):
            args[i] = ''
            for s in arg.split('\n'):
                args[i] += s.strip() + '\n'
        i += 1
    return tuple(args)
