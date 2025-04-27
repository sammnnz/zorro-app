from jinja2 import Environment, Template
from jinja2.utils import internalcode
from typing import Any, List, MutableMapping, NoReturn, Optional, Union

__all__: List[str]

class BaseEnvironment(Environment):
    def join_path(self, template: str, parent: str) -> Optional[str, NoReturn]: ...
    @internalcode
    def get_template(
            self,
            name: Union[str, Template],
            parent: Optional[str] = ...,
            globals: Optional[MutableMapping[str, Any]] = ...
    ) -> Optional[Template, NoReturn]: ...

def _get_template_path(template: str, paths: List[str]) -> Optional[str, NoReturn]: ...
