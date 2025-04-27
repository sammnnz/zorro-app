from src.render import get_template, Response

__all__ = ['new_project',
           'top_frame_content',
           'welcome',
           'workspace']


# ROUTES

@Response()
def welcome():
    return get_template('welcome/index.html')


@Response(selector="#top-frame-content")
def top_frame_content():
    return get_template('welcome/top-frame-content.html')


@Response(selector="#workspace")
def workspace():
    return get_template('welcome/workspace.html')


@Response(selector="#main-frame")
def new_project():
    return get_template('welcome/new-project.html')
