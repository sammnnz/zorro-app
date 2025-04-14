from zorro.mvvm import BaseVM, BaseCommand
from .models import WelcomeModel

__all__ = ['WelcomeViewModel']


class WelcomeViewModel(BaseVM):
    exposes = ('click',)

    def __init__(self):
        self.welcome_model = WelcomeModel()
        self.click = BaseCommand(execute=self.welcome_model.click)

    # Command properties
    click = property(
        fget=...
    )
