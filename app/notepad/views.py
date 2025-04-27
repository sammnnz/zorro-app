from src.render import get_template, Response

__all__ = ['notepad', 'top_frame_content', 'workspace']


@Response()
def notepad():
    return get_template('notepad/index.html')


@Response(selector="#top-frame-content")
def top_frame_content():
    return get_template('notepad/top-frame-content.html')


@Response(selector="#workspace")
def workspace():
    return get_template('notepad/workspace.html')