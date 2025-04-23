from .views import *
from pymagic9 import nameof

hooks = {}

routes = {
    nameof(welcome): ('/welcome', welcome, 'GET'),
    nameof(top_frame_content): ('/welcome/top_frame_content', top_frame_content, 'GET'),
    nameof(workspace): ('/welcome/workspace', workspace, 'GET'),
    nameof(new_project): ('/welcome/new-project', new_project, 'GET'),
}
