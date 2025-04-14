from .views import *
from pymagic9 import nameof

routes = {
    nameof(main): ('/', main, 'GET'),
    nameof(header): ('/header', header, 'GET'),
}
