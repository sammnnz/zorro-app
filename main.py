import zorro

from app.main.vm import MainViewModel


if __name__ == '__main__':
    data_context = MainViewModel()
    zorro.show(disable_cache=True)
