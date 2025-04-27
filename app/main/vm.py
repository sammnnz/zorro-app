from app.notepad.vm import NotepadViewModel
from app.welcome.vm import WelcomeViewModel
from src.mvvm import BaseVM, DataContext


@DataContext
class MainViewModel(BaseVM):
    exposes = ()

    def __init__(self):
        self.welcome_viewmodel = WelcomeViewModel()
        self.notepad_viewmodel = NotepadViewModel()
