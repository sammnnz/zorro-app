"""Zorro

"""
import sys

assert sys.version_info >= (3, 9), 'Please install Python 3.9 or higher.'

try:
    import settings as _settings
except ImportError:
    from .exceptions import SettingsError
    raise SettingsError('settings.py is not exists.')

from .utils import check_settings

check_settings(_settings)
del check_settings, _settings

from .core import show

__all__ = ['show']
