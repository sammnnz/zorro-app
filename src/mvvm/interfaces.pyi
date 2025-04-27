from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

__all__: List[str]

class ICommand(ABC):
    __slots__: Tuple[str, ...]

    @abstractmethod
    def can_execute(self, *args, **kwargs) -> bool: ...
    @abstractmethod
    def execute(self, *args, **kwargs) -> None: ...

class INotifyPropertyChanged(ABC):
    __slots__: Tuple[str, ...]

    @abstractmethod
    def NotifyPropertyChanged(self, propertyName: Optional[str]) -> None: ...
