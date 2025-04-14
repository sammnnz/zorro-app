"""
Interfaces for interacting with UI.

"""
from abc import ABC, abstractmethod

__all__ = ['ICommand', 'INotifyPropertyChanged']


class ICommand(ABC):
    """Interface for managing command execution.

    """
    __slots__ = ()

    @abstractmethod
    def can_execute(self, *args, **kwargs):
        """Determines whether command can execute in its current state.

        """
        pass

    @abstractmethod
    def execute(self, *args, **kwargs):
        """Executes command.

        """
        pass


class INotifyPropertyChanged(ABC):
    """Interface for notifying clients of changes when property value has changed.

    """
    __slots__ = ()

    @abstractmethod
    def NotifyPropertyChanged(self, propertyName):
        """Called when the property value is changed.

        """
        pass
