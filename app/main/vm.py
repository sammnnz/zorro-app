from app.welcome.vm import WelcomeViewModel
from zorro.mvvm import BaseVM, DataContext


@DataContext
class MainViewModel(BaseVM):
    exposes = ()

    def __init__(self):
        self.welcome_viewmodel = WelcomeViewModel()
