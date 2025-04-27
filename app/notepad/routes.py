from .views import *
from pymagic9 import nameof

routes = {
    nameof(notepad): ('/notepad', notepad, 'GET'),
    nameof(top_frame_content): ('/notepad/top-frame-content', top_frame_content, 'GET'),
    nameof(workspace): ('/notepad/workspace', workspace, 'GET'),
}
