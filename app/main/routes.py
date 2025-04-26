from .views import *
from pymagic9 import nameof

routes = {
    nameof(node_modules) + '_js': ('/node_modules/js/<file:path>', node_modules, 'GET'),
    nameof(node_modules) + '_css': ('/node_modules/css/<file:path>', node_modules, 'GET'),
    nameof(main): ('/', main, 'GET'),
    nameof(header): ('/header', header, 'GET'),
}
