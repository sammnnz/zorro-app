import re
import typing as t

from jinja2 import nodes
from jinja2.ext import Extension
from jinja2.exceptions import TemplateSyntaxError
from jinja2.parser import Parser

from .core import DataContext, exposer

__all__ = ['BindingExtension']

_bindings: t.List[t.Dict[str, str]] = []  # pattern: attr, id, prop, type

BINDING_TYPES: t.Dict[str, str] = {
    'OT': 'OneTime',
    'OW': 'OneWay',
    'OWTS': 'OneWayToSource',
    'TW': 'TwoWay'
}
SPECIAL_BINDING_ATTRS: t.Dict[str, str] = {'DC': 'data-command'}


@exposer
def _get_bindings() -> t.List[t.Dict[str, str]]:
    """Get bindings (only for JS calls).

    """
    return _bindings


class BindingExtension(Extension):
    """Binding system support based on jinja2.

    """

    tags: t.Set[str] = {"binding"}

    # search binding attribute
    _attr_regex: re.Pattern = re.compile(r"([^\'\" ]*)\s*=[^=\w]*binding")

    # search all comments
    _comment_regex: re.Pattern = re.compile(r"(?<=<!--)((.|\s)*?)(?=-->)")

    # search elements with binding <([^.<]*=\W*binding[^.>]*)>
    _element_regex: re.Pattern = re.compile(r"<([^<]*=\s*[\'\"]\s*\{\s*%\s*binding[^>]*)>")

    # search element id
    _id_regex: re.Pattern = re.compile(r"\s*id\s*=\s*['\"]([^\"\'\s]*\s*)['\"]")

    def __init__(self, environment):
        super(BindingExtension, self).__init__(environment)

    def preprocess(self, source: str, name: str, filename: t.Optional[str] = None) -> str:
        comm = '\n'.join([s[0] for s in self._comment_regex.findall(source)])
        for el in self._element_regex.findall(source):
            attrs, id_ = self._attr_regex.findall(el), self._id_regex.findall(el)
            is_comm = el in comm

            if len(attrs) > 0 and len(id_) == 1:
                for attr in attrs:
                    _bindings.append({'attr': attr.strip(), 'id': id_[0].strip(), 'comment': is_comm})
            else:
                lineno = source.split(el)[0].count('\n')

                if not len(attrs):
                    raise TemplateSyntaxError('Incorrect attribute for binding.', lineno, name)
                elif not len(id_):
                    raise TemplateSyntaxError('Incorrect id for binding.', lineno, name)
                else:  # elif len(id)
                    raise TemplateSyntaxError('Duplicate element id.', lineno, name)

        return source

    def parse(self, parser: Parser) -> t.Union[nodes.Node, t.List[nodes.Node]]:
        lineno = next(parser.stream).lineno

        temp = []
        try:
            while True:
                pe = parser.parse_expression()
                if 'node' in pe.fields and 'attr' in pe.fields:
                    temp.append(pe.node.name + '.' + pe.attr)
                elif 'name' in pe.fields:
                    temp.append(pe.name)
        except TemplateSyntaxError:
            pass

        if not len(temp):
            raise TemplateSyntaxError('Please specify a property to binding.', lineno, parser.name)
        elif len(temp) == 1:
            if temp[0].strip() in BINDING_TYPES.values():
                raise TemplateSyntaxError('Please specify a property to binding.', lineno, parser.name)
            else:
                temp.append(BINDING_TYPES['OW'])  # default is OneWay type of binding
        elif len(temp) == 2:
            if temp[1].strip() not in BINDING_TYPES.values():
                TemplateSyntaxError(
                    'Invalid binding type specified. Please enter one of the following: %s, %s, %s, %s' %
                    (BINDING_TYPES['OT'], BINDING_TYPES['OW'], BINDING_TYPES['OWTS'], BINDING_TYPES['TW']),
                    lineno,
                    parser.name)
        else:
            raise TemplateSyntaxError('Too much data to binding.', lineno, parser.name)

        data_context_name = DataContext.name
        if not data_context_name:
            raise ValueError('DataContext is required.')

        i = -1
        for bind in _bindings:
            i += 1
            if not hasattr(bind, 'prop'):
                del _bindings[i]
                if bind['comment']:
                    break

                del bind['comment']
                bind['prop'], bind['type'] = temp[0].strip(), temp[1].strip()
                if '.' not in bind['prop']:
                    bind['prop'] = data_context_name + '.' + bind['prop']

                if bind['attr'].lower() is SPECIAL_BINDING_ATTRS['DC'] and bind['type'] is not BINDING_TYPES['OWTS']:
                    bind['type'] = BINDING_TYPES['OW']  # for command attribute only OneWay type

                _bindings.append(bind)
                break

        del data_context_name, i, temp

        return nodes.CallBlock(self.call_method("_clear"), [], [], [], lineno=lineno)

    def _clear(self, caller):
        return ''
