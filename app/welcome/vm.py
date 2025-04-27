from zorro.mvvm import BaseVM, BaseCommand
from .models import WelcomeModel

__all__ = ['WelcomeViewModel']


class WelcomeViewModel(BaseVM):
    exposes = ('create_new_project', 'location', 'name')

    def __init__(self):
        self.welcome_model = WelcomeModel()
        self.create_new_project = BaseCommand(execute=self.welcome_model.create_new_project)
        self.location = ''
        self.name = ''

    location = property(
        fget=...,
        fset=...
    )

    name = property(
        fget=...,
        fset=...
    )

    # Command properties
    create_new_project = property(
        fget=...,
    )
