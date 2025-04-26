import bottle as btl
import eel
import eel.browsers as brw
import eel.electron as elc
import os
import psutil
import shutil
import subprocess as sps
import sys

from .router import update_routes_and_hooks
from zorro.render import FSLRender
from zorro.utils import get_app_root, get_settings

__all__ = ['show']


def show(**kwargs):
    """We do the necessary initializations, deploy the local server, open the
     electron browser and route to start URL.

    """
    params = get_settings()
    params.update(kwargs)

    from zorro.mvvm import BindingExtension
    if not isinstance(params['jinja'], dict):
        print("Warning: 'JINJA' (from settings.py) must be dict.")
        params['jinja'] = {
            'extensions': []
        }

    if not isinstance(params['jinja']['extensions'], list):
        print("Warning: JINJA[\"extensions\"] (from settings.py) must be a list.")
        params['jinja']['extensions'] = []

    params['jinja']['extensions'].append(BindingExtension)
    params['jinja_templates'] = None  # Turn off jinja2 in eel
    app = _init(params['apps'])
    app.catchall = True  # TODO: make DebuggerM
    params['app'] = app
    environment = FSLRender(params['apps'], **params['jinja'])
    environment.create_environment()
    _start(environment, **params)


def _init(apps: list[str]):
    """Initialize all JS functions (from all connected applications) available
     for calling from Python, and set path to electron.

    """

    js_functions = []
    try:
        for app in apps + ['zorro.mvvm']:
            eel.init(get_app_root(app), allowed_extensions=['.js'])
            js_functions += eel.__dict__['_js_functions']

        eel.__dict__['_js_functions'] = js_functions
    except KeyError:
        raise KeyError(
            "Error with access to list '_js_functions' from `eel`.")

    brw.set_path('electron', 'node_modules/electron/dist/electron')

    return btl.default_app()


def _start(environment, **kwargs):
    """Update routes and hooks for the bottle and run eel.start.

    """
    params = {}
    params.update(kwargs)
    params['mode'] = 'electron'  # Use only electron
    update_routes_and_hooks(params['apps'])
    for key in list(eel.BOTTLE_ROUTES.keys()):  # Removing unused eel routes
        if 'eel' not in key:
            eel.BOTTLE_ROUTES.pop(key)

    url = '"' + "http" + "://" + params['host'] + ':' + str(params['port']) + \
          params['start_url'] + '"'
    _rewrite_url(os.path.join(os.path.dirname(__file__), 'js', 'url.js'), url)
    process = {
        'pid': None,
        'stdin': None
    }

    def run_electron(path, options, start_urls):
        cmd = [path] + options['cmdline_args']
        cmd += ['.', ';'.join(start_urls)]
        p_open = sps.Popen(cmd, stdout=sys.stdout, stderr=sys.stderr, stdin=sps.PIPE)
        process['pid'], process['stdin'] = p_open.pid, p_open.stdin

    try:
        elc.__dict__['run'] = run_electron
    except KeyError:
        pass

    del run_electron

    start_url = params['start_url']
    eel_starts = _get_eel_start_signature()
    for key in list(params.keys()):
        if key not in eel_starts:
            params.pop(key)

    msg = 'Process \'electron.exe\' or some of its children don\'t terminate.'
    state = 'success'
    try:
        eel.start(start_url, **params)
    except OSError:
        state = 'error'
        try:
            if not _close_process_and_all_his_children(process['pid']):
                print(msg)
        finally:
            raise Exception('Port %s was busy.' % params['port'])
    finally:
        cache_directory = environment.bytecode_cache.directory
        shutil.rmtree(cache_directory, ignore_errors=True)

        if not _close_process_and_all_his_children(process['pid']):
            print(msg)

        if state == 'success':
            print('Zorro successfully finished!')
        elif state == 'error':
            print('Zorro exit with error!')


def _close_process_and_all_his_children(pid):
    """Return True if process and all his children was successfully closed
     (also, if process already was closed or not exists).

    """
    try:
        if not psutil.pid_exists(pid):
            return True
    except OverflowError:
        return False

    result = True
    main_process = psutil.Process(pid)
    for p in main_process.children():
        result &= _close_process_and_all_his_children(p.pid)

    main_process.terminate()
    result &= True
    gone, alive = psutil.wait_procs([main_process], timeout=3, callback=_on_terminate)
    for p in alive:
        p.kill()
        result &= True

    return result


def _get_eel_start_signature():
    code = eel.start.__code__

    return code.co_varnames[:code.co_kwonlyargcount]


def _on_terminate(proc: psutil.Process):
    print("process {} terminated with exit code {}"
          .format(proc, getattr(proc, 'returncode', 'UNKNOWN')))


def _rewrite_url(file_name, url: str) -> None:
    try:
        with open(file_name, "r", encoding="utf8") as file:
            contents = file.readlines()
        with open(file_name, "w", encoding="utf8") as file:
            for c in contents:
                if 'const url = ' in c:
                    file.write('const url = ' + url + ';' + '\n')
                    continue
                file.write(c)
    except (FileNotFoundError, UnicodeEncodeError):
        raise FileNotFoundError("url.js not found or can not be decode.")
