from pymagic9 import nameof
from src.mvvm import BaseVM
from .models import NotepadModel

__all__ = ['NotepadViewModel']


class NotepadViewModel(BaseVM):
    exposes = ('project_title',)

    def __init__(self):
        self.notepad_model = NotepadModel()
        self.project_title = ''

    project_title = property(
        fget=...,
        fset=lambda self, value: self.NotifyPropertyChanged(nameof(self.project_title))
    )
