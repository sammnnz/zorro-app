/**
 * Bindings API
 */

// Type definitions
/**
 * Binding's data type.
 * @typedef {Object.<string, Object.<string, Object.<string, Object>>>} Bindings
 */

/**
 * Binding's data from Python.
 * @typedef {Object.<string, string>} BindingData
 * @property {string} attr - name of attribute/attributeIDL (this property check in JS)
 * @property {string | undefined} attrIDL - name of attributeIDL (this property create in JS)
 * @property {string} id - id of HTMLElement
 * @property {string} prop - name of Python property
 * @property {string} type - type of binding (OneWay, TwoWay, OneWayToSource, OneTime)
 */

// Exports
/**
 * Binding's data for use in NotifyPropertyChanged.
 * @type {Bindings}
 */
export const bindings = {};

/**
 * Get from Python detected bindings and update `bindings` object.
 * @public
 * @function
 * @name UpdateBindings
 * @returns {Promise.<void>}
 */
export const UpdateBindings = async () => {
    "use strict";

    const
        /**
         * Call from Python function, witch get bindings data (element's id, attr/attrIDL of binding,
         * target Python property and type of binding).
         * @type {[BindingData]}
         */
        bindingData = eel?._get_bindings instanceof Function ?
            await eel._get_bindings()() : [],

        /**
         * Object with OneWayToSource bindings (only for OneWayToSource and
         * TwoWay).
         * @type {Set}
         */
        temp = new Set();

    for (let binding of bindingData) {
        if (typeof binding !== 'object') continue;

        if (! (typeof binding.attr === 'string' &&
            typeof binding.id === 'string' &&
            typeof binding.prop === 'string' &&
            typeof binding.type === 'string')) {
            console.warn(`Warning: Binding have incorrect data: 
            attr: ${binding.attr}, 
            id: ${binding.id}, 
            prop: ${binding.prop}, 
            type: ${binding.type}.`)
        }

        const
            /**
             * @type {HTMLElement}
             */
            el = router.getElementInTemplates('#' + binding.id);

        binding.prop = binding.prop.replace(".", "_");
        if (! el) {
            if (bindings[binding.prop] && binding.id in bindings[binding.prop]) {
                const id = bindings[binding.prop][binding.id];
                for (let attr in id) {
                    const
                        element = id[attr]?.element,
                        events = id[attr]?.events,
                        funcs = id[attr]?.funcs;

                    document.removeEventListener(events?.notify, funcs?.notify);
                    element.removeEventListener(events?.command, funcs?.command, {once: true, capture: true});
                }

                delete bindings[binding.prop][binding.id];
                if (! Object.keys(bindings[binding.prop]).length)
                    delete bindings[binding.prop];

                console.log(`Log: Delete id '${binding.id}' from binding's 
property ${binding.prop} and clear listeners.`);
            }

            continue;
        }

        binding['attr'] = CheckAttributeName(el, binding.attr)[0]
        binding['attrIDL'] = _CheckAttributeIDLName(el, binding.attr)
        bindings[binding.prop] = bindings[binding.prop] ?
            bindings[binding.prop] : {}
        bindings[binding.prop][binding.id] =
            bindings[binding.prop][binding.id] ?
            bindings[binding.prop][binding.id] : {}

        if (binding.attr in bindings[binding.prop][binding.id]) {
            console.log(`Log: Binding for property '${binding.prop}' and id 
'${binding.id}' has already attr '${binding.attr}'.`);
            continue;
        }

        bindings[binding.prop][binding.id][binding.attr] =
            bindings[binding.prop][binding.id][binding.attr] ?
            bindings[binding.prop][binding.id][binding.attr] : {
                info: binding,
                element: el
            }

        switch (binding.type) {
            case _bindingTypes['OT']: // OneTime
                await _OneTime(binding, el)
                break

            case _bindingTypes['OW']: // OneWay
                _OneWay(binding, bindings, el);
                break

            case _bindingTypes['OWTS']: // OneWayToSource
                temp.add(binding)
                break

            case _bindingTypes['TW']: // TwoWay
                // OneWay part
                _OneWay(binding, bindings, el)

                // OneWayToSource part
                temp.add(binding)
                break

            default:
                break
        }
    }

    // Create binds with ElementBinder for OneWayToSource and TwoWay bindings
    for (let binding of temp) {
        _OneWayToSource(binding, bindings)
    }
}

// Privates
/**
 * Binding types (OneTime, OneWay, OneWayToSource, TwoWay).
 * @type {Object.<string. string>}
 */
const _bindingTypes = {
    'OT':   'OneTime',
    'OW':   'OneWay',
    'OWTS': 'OneWayToSource',
    'TW':   'TwoWay'
 };

/**
 * TODO: docs, impl
 * @private
 * @function
 * @name _CheckAttributeIDLName
 * @param {HTMLElement | null} obj
 * @param {string} name
 * @returns {string | undefined}
 */
const _CheckAttributeIDLName = (obj, name) => {
    "use strict";

    let
        /**
         * @type {Object | null}
         */
        currentObj,

        /**
         * @type {[string]}
         */
        propertyNames;

    // TODO: update 'translations' object
    const
        /**
         * @type {Object.<string, string>}
         */
        translations = {
            "class": "className",
            "for": "htmlFor",
        };

    name = translations[name.toLowerCase()] || name

    const
        /**
         * @type {RegExp}
         */
        re = new RegExp("\\b(" + name + ")\\b", "i");

    currentObj = obj

    while (currentObj !== null) {
        if (currentObj.hasOwnProperty(name)) {
            break
        }

        propertyNames = Object.getOwnPropertyNames(currentObj)
        propertyNames = propertyNames.join(' ').match(re)

        if (propertyNames === null) {
            currentObj = Object.getPrototypeOf(currentObj)
            continue
        }

        name = propertyNames[0]
        break
    }

    if (currentObj === null) {
        return undefined
    }

    return name
}

/**
 * @function _CheckPropertyError
 * @param {Error} e - error object
 * @param {string} name - property name
 */
const _CheckPropertyError = (e, name) => {
    switch (e.name) {
        case 'TypeError':
            console.warn(`Property ${name} not found.`);

            return;

        default:
            console.warn(e);
    }
}

/**
 * TODO: docs, impl
 * @private
 * @function
 * @name _CreateAttributeIDL
 * @param {HTMLElement | null} el - ...
 * @param {string} name - ...
 * @returns {void}
 *
 */
const _CreateAttributeIDL = (el, name) => {}

/**
 * @private
 * @function
 * @name _GetValue
 * @param {BindingData} binding
 * @param {HTMLElement} el
 * @returns {*}
 */
const _GetValue = (binding, el) => {
    if (binding.attrIDL !== undefined) {
        return el[binding.attrIDL]
    }

    if (el.hasAttribute(binding.attr)) {
        return el.getAttribute(binding.attr)
    }

    return ''
}

/**
 * @private
 * @function
 * @name _OneTime
 * @param {BindingData} binding
 * @param {HTMLElement} el
 * @returns {Promise.<void>}
 */
const _OneTime = async (binding, el) => {
    let value;

    const pyGetter = "PROPERTY" + "_" + binding.prop;

    try {
        value = await eel[pyGetter]()();
    } catch (e) {
        return _CheckPropertyError(e, pyGetter);
    }

    _SetValue(binding, el, value)
}

/**
 * @private
 * @function
 * @name _OneWay
 * @param {BindingData} binding
 * @param {Bindings} data
 * @param {HTMLElement} el
 * @returns {void}
 */
const _OneWay = (binding, data, el) => {
    "use strict";

    let
        /**
         * @type {Object.<string, Function>}
         */
        funcs,
        /**
         * @type {Object.<string, string>}
         */
        events,
        /**
         * @type {Object.<boolean, string>}
         */
        value;

    const
        event = new Event("BINDING_EVENT" + "_" + binding.prop,
            {bubbles: true, composed: true}),
        pyGetter = "PROPERTY" + "_" + binding.prop;

    if (binding.attr === TAG_ATTRIBUTES.SPECIAL.datacommand){
        funcs = {
            notify: async () => {
                try {
                    value = await eel[pyGetter]()();
                    if (value.result === true)
                        el.dispatchEvent(new CustomEvent('commandsuccess',
                        {bubbles: true, composed: true, detail: value.msg}));
                    else if (value.result === false)
                        console.warn('Warning: ' + value.msg);
                        el.dispatchEvent(new CustomEvent('commanderror',
                        {bubbles: true, composed: true, detail: value.msg}));
                } catch (e) {
                    el.dispatchEvent(new CustomEvent('commanderror',
                        {bubbles: true, composed: true, detail: value.msg}));
                    return _CheckPropertyError(e, pyGetter);
                } finally {
                    el.dispatchEvent(new CustomEvent('commandfinally',
                        {bubbles: true, composed: true, detail: value.msg}));
                }
            },
            command: async (ev) => {
                ev.preventDefault();
                // ev.stopImmediatePropagation();
                el.addEventListener('commandfinally', () => {
                    console.log('Finally add!') // TODO: Debug
                    el.addEventListener('click', funcs.command, {once: true, capture: true});
                }, {once: true})
                document.dispatchEvent(event);
                console.log('Start command!'); // TODO: Debug
            }
        }

        events = {
            notify: event.type,
            command: 'click'
        }

        document.addEventListener(event.type, funcs.notify);
        el.addEventListener('click', funcs.command, {once: true, capture: true});
    } else {
        funcs = {
            notify: async () => {
                try {
                    value = await eel[pyGetter]()();
                } catch (e) {
                    return _CheckPropertyError(e, pyGetter);
                }

                if (_GetValue(binding, el) !== value) {
                    _SetValue(binding, el, value)
                }
            }
        }

        events = {
            notify: event.type
        }

        document.addEventListener(event.type, funcs.notify)
        document.dispatchEvent(event) // Loading initial values.
    }

    data[binding.prop][binding.id][binding.attr]['events'] = events
    data[binding.prop][binding.id][binding.attr]['funcs'] = funcs
}

/**
 * TODO: docs, impl
 * @private
 * @function
 * @name _OneWayToSource
 * @param {BindingData} binding
 * @param {Bindings} data
 * @returns {void}
 */
const _OneWayToSource = (binding, data) => {
    "use strict";

    const
        /**
         * @type {HTMLElement}
         */
        el = router.getElementInTemplates('#' + binding.id),

        /**
         * @type {ElementBinder}
         */
        bind = new ElementBinder(el),

        /**
         * @type {string}
         */
        pySetter = "PROPERTY" + "_" + binding.prop + "_SETTER",

        /**
         * @function
         * @name callback
         * @returns {Promise.<void>}
         */
        callback = async () => {
            console.log(binding.attrIDL + ' to PYTHON')  // TODO: FOR DEBUG ONLY
            const value = _GetValue(binding, el);

            await eel[pySetter](value)()
            // We cancel the standard behavior of the binder so that
            // the NotifyPropertyChanged is made through Python
            throw new CanceledAction('Cancel calling property value assignments inside js.')
        };

    for (let id of Object.values(data[binding.prop])) {
        for (let attr in id) {
            if (! id.hasOwnProperty(attr) ||
                binding.id === id[attr].info.id ||
                id[attr].info.type === _bindingTypes['OWTS'] ||
                id[attr].info.type === _bindingTypes['OT']) {
                continue
            }

            bind.bind(binding.attrIDL ?? binding.attr,
                router.getElementInTemplates('#' + id[attr].info.id),
                id[attr].info.attrIDL ?? id[attr].info.attr,
                { callback: callback })
        }
    }

    data[binding.prop][binding.id][binding.attr]['bind'] = bind.data.length === 0 ?
        bind.bind(binding.attrIDL ?? binding.attr, el,
            binding.attrIDL ?? binding.attr, { callback: callback }) : bind
}

/**
 * @private
 * @function
 * @name _SetValue
 * @param {BindingData} binding
 * @param {HTMLElement} el
 * @param {*} value
 * @returns {void}
 */
const _SetValue = (binding, el, value) => {
    if (binding.attrIDL !== undefined) {
        el[binding.attrIDL] = value;
    }

    el.setAttribute(binding.attr, String(value));
}
