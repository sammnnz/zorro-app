from .views import *
from pymagic9 import nameof

hooks = {
    nameof(ajax): ('before_request', ajax),
}

routes = {}
