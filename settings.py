import os

ROOT_PATH = os.getcwd()

APPS = [
    'zorro.app.base',
    'app.main',
    'app.welcome'
]

JINJA = {
    'auto_reload': True,
    'extensions': [],
}

HOST = 'localhost'

LANGUAGE = 'en'

MAIN_JS = os.path.join(ROOT_PATH, 'main.js')

PORT = 7896

# PORT = 9230

START_URL = '/'
