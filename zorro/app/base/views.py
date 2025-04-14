import bottle as btl

__all__ = ['ajax']


# HOOKS

def ajax():
    """ Hook for define ajax request. """
    if btl.request.method == 'POST' and btl.request.POST.get('_ajax'):
        btl.request.environ['REQUEST_METHOD'] = btl.request.POST.get('_ajax', '').upper()
