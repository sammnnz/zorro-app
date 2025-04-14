from jinja2 import Environment
from jinja2.loaders import FileSystemLoader
from typing import Callable, List, NoReturn, Optional, Tuple

__all__: List[str]

class BaseFileSystemLoader(FileSystemLoader):
    def get_source(self, environment: Environment, template: str
                   ) -> Optional[Tuple[str, str, Callable[[], bool]], NoReturn]: ...
