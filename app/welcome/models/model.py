from zorro.mvvm import BaseM

__all__ = ["WelcomeModel"]


class WelcomeModel(BaseM):

    def click(self, *args, **kwargs):
        print('I am click baby!')
