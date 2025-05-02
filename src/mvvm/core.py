import eel

from abc import ABCMeta
from eel import expose
from multipledispatch import dispatch
from pymagic9 import getframe, nameof, PropertyMeta
from types import FunctionType, LambdaType, MethodType

from .interfaces import ICommand, INotifyPropertyChanged

__all__ = ['BaseCommand',
           'BaseNPC',
           'BaseM',
           'BaseVM',
           'CancelCommand',
           'DataContext',
           'exposer']

# Patterns

expose_accessor_name_pattern = 'PROPERTY_%s'  # % accessorName
""" Pattern for property's accessor, which must be exposed. """

getter_name_pattern = '%s_%s'  # % (ViewModelName, propertyName)
""" Pattern for property's getter. """

js_npcfn_name_pattern = '%s_%s'  # % (ViewModelName, propertyName)
""" Pattern for names of JS functions, which notify data in browser. """

setter_name_pattern = '%s_%s_SETTER'  # % (ViewModelName, propertyName)
""" Pattern for property's setter. """

setter_suffix = '.setter'
""" Suffix for name of setter, before expose. """

# Interface implementations

_FType = (FunctionType, LambdaType, MethodType)


class BaseCommand(ICommand):
    """`ICommand` interface implementation.

    """
    __slots__ = ('ce', 'ce_kwargs', 'ex', 'ex_kwargs')

    def __init__(self, execute=None, can_execute=None,
                 ex_kwargs=None, ce_kwargs=None):

        if isinstance(can_execute, _FType):
            self.ce = can_execute
        else:
            self.ce = lambda *args, **kwargs: True

        if isinstance(ce_kwargs, dict):
            self.ce_kwargs = ce_kwargs
        else:
            self.ce_kwargs = {}

        if isinstance(execute, _FType):
            self.ex = execute
        else:
            self.ex = lambda *args, **kwargs: None

        if isinstance(ex_kwargs, dict):
            self.ex_kwargs = ex_kwargs
        else:
            self.ex_kwargs = {}

    def can_execute(self, *args, **kwargs):
        # kwargs.update(self.ce_kwargs)
        return self.ce(*args, **self.ce_kwargs)

    def execute(self, *args, **kwargs):
        # kwargs.update(self.ex_kwargs)
        try:
            self.ex(*args, **self.ce_kwargs)
        except CancelCommand as e:
            return {'result': False, 'msg': e.msg}

        return {'result': True, 'msg': ''}


class CancelCommand(Exception):
    def __init__(self, msg=None):
        # super(CancelCommand, self).__init__(msg)
        if not isinstance(msg, str):
            msg = ''

        self.msg = msg


class BaseNPC(INotifyPropertyChanged):
    """`INotifyPropertyChanged` interface implementation.

    """
    __slots__ = ()

    def NotifyPropertyChanged(self, propertyName):
        if hasattr(eel, 'NotifyPropertyChanged'):
            eel.NotifyPropertyChanged(js_npcfn_name_pattern %
                                      (type(self).__name__, propertyName))()

    def set(self, fieldName, value, propertyName):
        if fieldName.startswith('__'):
            fieldName = '_' + type(self).__name__ + fieldName

        setattr(self, fieldName, value)
        self.NotifyPropertyChanged(propertyName)


# Model base class

class _BaseMMeta(type):
    def __call__(cls, *args, **kwargs):
        self = object.__new__(cls)
        self.__init__(*args, **kwargs)
        frame = getframe(1)
        vm = frame.f_locals.get('self', None)
        if isinstance(vm, BaseVM):
            self.vm = vm

            return self

        raise TypeError('Model class should be initialized only in ViewModel class.')


class BaseM(metaclass=_BaseMMeta):
    """Base class for all Models. Inherit your model from it to access ViewModel.

    """


# ViewModel base class

class _ExposeMeta(PropertyMeta):
    def __call__(cls, *args, **kwargs):
        # Readonly properties must be initialized only from `PropertyMeta.__call__`
        self = PropertyMeta.__call__(cls, *args, **kwargs)
        exposes = getattr(cls, "exposes", None)
        if exposes is None:
            return

        if not isinstance(exposes, tuple):
            return

        msg = "tuple 'bindings' must contain only strings with property names"
        for propName in exposes:
            if not isinstance(propName, str):
                raise TypeError(msg)

            prop = getattr(cls, propName, None)
            if not isinstance(prop, property):
                raise TypeError(msg)

            if prop.fget is not None:
                exposer(cls, propName)

            if prop.fset is not None:
                exposer(cls, propName + setter_suffix)

        return self


class _BaseVMMeta(_ExposeMeta, ABCMeta):
    """This class was created to eliminate the conflict in BaseVM class
    between the ABCMeta (from INotifyPropertyChanged) and _ExposeMeta.

    """
    pass


class BaseVM(BaseNPC, metaclass=_BaseVMMeta):
    """Base class for all ViewModels. Inherit your view model from it to allow
    it to notify data using `NotifyPropertyChanged` and use auto-implemented
    properties from `pymagic9`.

    """

    exposes = ()


# DataContext

class _DCMeta(type):
    __slots__ = ()

    def __init__(cls, name, bases, attrs):
        super(_DCMeta, cls).__init__(name, bases, attrs)
        type.__setattr__(cls, 'cls', None)
        type.__setattr__(cls, 'inst', None)
        type.__setattr__(cls, 'name', None)

    def __call__(cls, *args, **kwargs):
        if DataContext.cls is not None:
            raise AttributeError('DataContext already exist.')

        return super(_DCMeta, cls).__call__(*args, **kwargs)

    def __setattr__(cls, key, value):
        if key in ('cls', 'inst', 'name'):
            raise AttributeError(f"attribute {key} is readonly")

        raise AttributeError(f"'{nameof(DataContext)}' object has no attribute '{key}'")


class DataContext(metaclass=_DCMeta):
    __slots__ = ('cls', 'inst', 'name')

    def __init__(self, cls):
        if not isinstance(cls, type):
            raise TypeError('DataContext decorator may be used on classes.')

        type.__setattr__(DataContext, nameof(DataContext.cls), cls)
        type.__setattr__(DataContext, nameof(DataContext.name), cls.__name__)

    def __call__(self, *args, **kwargs):
        dc = DataContext.cls(*args, **kwargs)
        type.__setattr__(DataContext, nameof(DataContext.inst), dc)

        for clsName, propName in _delay_exposure:
            _exposer(clsName, propName)

        return dc

    def __setattr__(self, key, value):
        if key in object.__getattribute__(self, '__slots__'):
            raise AttributeError(f"attribute {key} is readonly")

        raise AttributeError(f"'{nameof(DataContext)}' object has no attribute '{key}'")


_delay_exposure = set()


@dispatch([object], namespace=locals())
def exposer(*args):
    raise TypeError('valid data is required: arguments %s are of an unsupported type' % str(args))


@dispatch(FunctionType, namespace=locals())
def exposer(func):
    return expose(func)


@dispatch(property, namespace=locals())
def exposer(prop):
    """This exposer use only as decorator for properties.

    """
    if prop.fget is None and prop.fset is None:
        raise TypeError('Property for exposer must have getter or setter.')

    accessors = ('fget', 'fset')
    for ac in accessors:
        (clsName, propName) = getattr(getattr(prop, ac, None), '__qualname__', '.').split('.')[:2]
        if clsName == '' or propName == '':
            continue

        if propName == '<lambda>':
            raise TypeError('This overload of `exposer` may used only as decorator.')

        if ac == 'fset':
            propName += setter_suffix

        if DataContext.inst is None:
            global _delay_exposure

            _delay_exposure.add((clsName, propName))
        else:
            _exposer(clsName, propName)

    return prop


@dispatch(type, str, namespace=locals())
def exposer(cls, propName):
    """This exposer must not use as decorator.

    """
    if DataContext.inst is None:
        global _delay_exposure

        _delay_exposure.add((cls.__name__, propName))
    else:
        _exposer(cls.__name__, propName)


def _exposer(clsName, propName):
    outputName = ''
    if DataContext.name == clsName:
        if propName.endswith(setter_suffix):
            propName = propName[:-7]
            outputName = setter_name_pattern % (clsName, propName)
            exec('%s = lambda value: setattr(DataContext.inst, \'%s\', value)'
                 % (outputName, propName), globals())
        else:  # getter
            outputName = getter_name_pattern % (clsName, propName)
            if isinstance(getattr(DataContext.inst, propName), ICommand):
                exec('%s = lambda *args: DataContext.inst.%s.execute(*args) '
                     'if DataContext.inst.%s.can_execute() else None'
                     % (outputName, propName, propName), globals())
            else:
                exec('%s = lambda *args: DataContext.inst.%s'
                     % (outputName, propName), globals())
    else:
        for key, obj in DataContext.inst.__dict__.items():
            if type(obj).__name__ == clsName:
                if propName.endswith(setter_suffix):
                    propName = propName[:-7]
                    outputName = setter_name_pattern % (clsName, propName)
                    exec('%s = lambda value: setattr(DataContext.inst.%s, \'%s\', value)'
                         % (outputName, key, propName), globals())
                else:
                    outputName = getter_name_pattern % (clsName, propName)
                    if isinstance(getattr(obj, propName), ICommand):
                        exec('%s = lambda *args: DataContext.inst.%s.%s.execute(*args) '
                             'if DataContext.inst.%s.%s.can_execute() else None'
                             % (outputName, key, propName, key, propName), globals())
                    else:
                        exec('%s = lambda *args: DataContext.inst.%s.%s'
                             % (outputName, key, propName), globals())

                break

    try:
        expose(expose_accessor_name_pattern % outputName)(globals()[outputName])
    except KeyError:
        pass
