import os
import pathlib

from src.mvvm import BaseM, CancelCommand, DataContext

__all__ = ["WelcomeModel"]


class WelcomeModel(BaseM):

    def create_new_project(self, *args, **kwargs):
        path = str(pathlib.PurePath(self.vm.location, self.vm.name))
        abspath = os.path.abspath(path)

        if abspath != path:
            raise CancelCommand('Location must be a absolute directory and not file.')

        try:
            os.makedirs(path, exist_ok=False)
        except OSError:
            if not len(os.listdir(path)):
                DataContext.inst.notepad_viewmodel.project_title = self.vm.name
                return

            raise CancelCommand('Folder is not empty.')

        DataContext.inst.notepad_viewmodel.project_title = self.vm.name
