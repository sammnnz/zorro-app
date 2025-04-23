from zorro.mvvm import BaseVM, BaseCommand
from .models import WelcomeModel

__all__ = ['WelcomeViewModel']


class WelcomeViewModel(BaseVM):
    exposes = ('new_project', 'location')

    def __init__(self):
        self.welcome_model = WelcomeModel()
        self.new_project = BaseCommand(execute=self.welcome_model.new_project)
        self.location = ''

    location = property(
        fget=...,
        fset=...
    )

    # Command properties
    new_project = property(
        fget=...,
    )
