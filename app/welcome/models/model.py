import os
import pathlib
from time import sleep

from zorro.mvvm import BaseM, CancelCommand

__all__ = ["WelcomeModel"]


class WelcomeModel(BaseM):

    def new_project(self, *args, **kwargs):
        print(self.vm.location)  # ; sleep(5)  # TODO: Debug
        path = str(pathlib.PurePath(self.vm.location))
        abspath = os.path.abspath(path)

        if abspath != path:
            raise CancelCommand('Location must be a absolute directory (not file).')

        try:
            os.makedirs(path, exist_ok=False)
        except OSError:
            if not len(os.listdir(path)):
                return

            raise CancelCommand('Folder is not empty.')
