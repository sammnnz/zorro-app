from app.main.vm import MainViewModel
from src import show


if __name__ == '__main__':
    data_context = MainViewModel()
    show(disable_cache=True)
