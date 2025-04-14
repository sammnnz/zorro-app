/**
 * Bindings API
 */

// import {CheckAttributeName, TAG_ATTRIBUTES} from "./binder.js";


// Type definitions
/**
 * Binding's data type.
 * @typedef {Object.<string, Object.<string, Object.<string, Object>>>} BindingData
 */

/**
 * Binding type (get from Python).
 * @typedef {Object.<string, string>} Binding
 * @property {string} attr - name of attribute/attributeIDL (this property check in JS)
 * @property {string | undefined} attrIDL - name of attributeIDL (this property create in JS)
 * @property {string} id - id of HTMLElement
 * @property {string} prop - name of Python property
 * @property {string} type - type of binding (OneWay, TwoWay, OneWayToSource, OneTime)
 */


// Public functions
/**
 * Get from Python detected bindings and return JS binding's data.
 * @public
 * @function
 * @name BindingsOn
 * @returns {BindingData}
 */
export const BindingsOn = async () => {
    "use strict";

    const
        /**
         * Call from Python function, witch get bindings data (element's id, attr/attrIDL of binding,
         * target Python property and type of binding).
         * @type {[Binding]}
         */
        bindings = await eel?._get_bindings()(),

         /**
         * Set binding types (OneTime, OneWay, OneWayToSource, TwoWay).
         * @type {Object.<string. string>}
         */
        bindingTypes = {
            'OT': 'OneTime',
             'OW': 'OneWay',
             'OWTS': 'OneWayToSource',
             'TW': 'TwoWay'
         },

        /**
         * Return binding's data.
         * @type {BindingData}
         */
        data = {},

        /**
         * Object with OneWayToSource bindings (only for OneWayToSource and TwoWay).
         * @type {Set}
         */
        temp = new Set();

    for (let binding of bindings) {
        const
            /**
             * @type {HTMLElement}
             */
            obj = binding?.id ? router.getElementInTemplates('#' + binding.id) : undefined;

        if (! obj) {
            continue
        }

        binding['attr'] = CheckAttributeName(obj, binding?.attr)[0]
        binding['attrIDL'] = CheckAttributeIDLName(obj, binding?.attr)
        binding['prop'] = binding?.prop?.replace?.(".", "_")

        data[binding.prop] = data[binding.prop] ?
            data[binding.prop] : {}
        data[binding.prop][binding.id] = data[binding.prop][data] ?
            data[binding.prop][binding.id] : {}
        data[binding.prop][binding.id][binding.attr] = data[binding.prop][binding.id][binding.attr] ?
            data[binding.prop][binding.id][binding.attr] : {
                info: binding,
            }

        switch (binding?.type) {
            case bindingTypes['OT']: // OneTime
                await OneTime(binding, obj)
                break

            case bindingTypes['OW']: // OneWay
                OneWay(binding, data, obj);
                break

            case bindingTypes['OWTS']: // OneWayToSource
                temp.add(binding)
                break

            case bindingTypes['TW']: // TwoWay
                //for OneWay part
                OneWay(binding, data, obj)

                // for OneWayToSource part
                temp.add(binding)
                break

            default:
                break
        }
    }

    // Create binds with ElementBinder for OneWayToSource and TwoWay bindings
    for (let binding of temp) {
        OneWayToSource(binding, bindingTypes, data)
    }

    return data
}

/**
 * TODO дописать документацию
 *
 * @private
 * @function
 * @name BindingOff
 * @param {Binding} binding - ...
 * @returns {void}
 *
 */
export const BindingOff = (binding) => {
    "use strict";

    // TODO сделать имплеиментацию
}

/**
 * TODO дописать документацию
 *
 * @private
 * @function
 * @name BindingsOff
 * @param {BindingData} bindingData - ...
 * @returns {void}
 *
 */
export const BindingsOff = (bindingData) => {
    "use strict";

    // TODO сделать имплеиментацию
}


// Private functions
/**
 * TODO дописать документацию
 *
 * @private
 * @function
 * @name CheckAttributeIDLName
 * @param {HTMLElement | null} obj - ...
 * @param {string} name - ...
 * @returns {string | undefined}
 *
 */
const CheckAttributeIDLName = (obj, name) => {
    "use strict";

    let
        /**
         * TODO дописать документацию
         * @type {Object | null}
         *
         */
        currentObj,

        /**
         * TODO дописать документацию
         * @type {[string]}
         *
         */
        propertyNames;

    // TODO дополнять таблицу несоответствиями между аттрибутамии и свойствами
    const
        /**
         * TODO дописать документацию переменной
         * @type {Object.<string, string>}
         *
         */
        translations = {
            "class": "className",
            "for": "htmlFor",
        };

    name = translations[name.toLowerCase()] || name

    const
        /**
         * TODO дописать документацию переменной
         * @type {RegExp}
         *
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
 * TODO дописать документацию
 *
 * @private
 * @function
 * @name CreateAttriduteIDL
 * @param {HTMLElement | null} obj - ...
 * @param {string} name - ...
 * @returns {void}
 *
 */
const CreateAttriduteIDL = (obj, name) => {

}

/**
 * TODO дописать документацию функции
 *
 * @private
 * @function
 * @name GetValue
 * @param {Binding} binding - ...
 * @param {HTMLElement} obj - ...
 * @returns {*} - ...
 *
 */
const GetValue = (binding, obj) => {
    if (binding.attrIDL !== undefined) {
        return obj[binding.attrIDL]
    } else {
        if (obj.hasAttribute(binding.attr)) {
            return obj.getAttribute(binding.attr)
        }
        return ''
    }
}

/**
 * TODO дописать документацию функции
 *
 * @private
 * @function
 * @name OneWay
 * @param {Binding} binding - ...
 * @param {HTMLElement} obj - ...
 * @returns {Promise.<void>} - ...
 *
 */
const OneTime = async (binding, obj) => {
    const
        /**
         * TODO дописать документацию для переменной
         * @type {string}
         *
         */
        pyGetter = "PROPERTY" + "_" + binding.prop,

        /**
         * TODO дописать документацию для переменной
         * @type {*}
         *
         */
        value = await eel[pyGetter]()();

    SetValue(binding, obj, value)
}

/**
 * TODO дописать документацию функции
 *
 * @private
 * @function
 * @name OneWay
 * @param {Binding} binding - ...
 * @param {BindingData} data - ...
 * @param {HTMLElement} obj - ...
 * @returns {void} - ...
 *
 */
const OneWay = (binding, data, obj) => {
    "use strict";

    let
        /**
         * TODO дописать документацию для переменной
         * @type {Object.<string, Function>}
         *
         */
        funcs;

    const
        /**
         * TODO дописать документацию для переменной
         * @type {Event}
         *
         */
        event = new Event("BINDING_EVENT" + "_" + binding.prop, {bubbles: true, composed: true}),

        /**
         * TODO дописать документацию для переменной
         * @type {string}
         *
         */
        pyGetter = "PROPERTY" + "_" + binding.prop;

    if (binding.attr === TAG_ATTRIBUTES.SPECIAL.datacommand){
        funcs = {
            notify: async () => {
                await eel[pyGetter]()()
            },
            command: (ev) => {
                document.dispatchEvent(event)
            }
        }

        document.addEventListener(event.type, funcs.notify)
        obj.addEventListener('click', funcs.command)
    } else {
        funcs = {
            notify: async () => {
                const
                    /**
                     * TODO дописать документацию для переменной
                     * @type {*}
                     *
                     */
                    value = await eel[pyGetter]()();

                if (GetValue(binding, obj) !== value) {
                    SetValue(binding, obj, value)
                }
            }
        }

        document.addEventListener(event.type, funcs.notify)

        // Loading initial values.
        document.dispatchEvent(event)
    }

    data[binding.prop][binding.id][binding.attr]['events'] = {notify: event}
    data[binding.prop][binding.id][binding.attr]['funcs'] = funcs
}

/**
 * TODO дописать документацию
 *
 * @private
 * @function
 * @name OneWayToSource
 * @param {Binding} binding - ...
 * @param {Object.<string. string>} bindingTypes - ...
 * @param {BindingData} data - ...
 * @returns {void}
 *
 */
const OneWayToSource = (binding, bindingTypes, data) => {
    "use strict";

    const
        /**
         * TODO дописать документацию для переменной
         * @type {HTMLElement}
         *
         */
        obj = document.getElementById(binding.id),

        /**
         * TODO дописать документацию для переменной
         * @type {ElementBinder}
         *
         */
        bind = new ElementBinder(obj),

        /**
         * TODO дописать документацию для переменной
         * @type {string}
         *
         */
        pySetter = "PROPERTY" + "_" + binding.prop + "_SETTER",

        /**
         * TODO дописать документацию переменной
         * @function
         * @name callback
         * @returns {Promise.<void>} - ...
         *
         */
        callback = async () => {
            console.log(binding.attrIDL + ' to PYTHON')  // TODO FOR DEBUG ONLY

            const
                /**
                 * TODO дописать документацию переменной
                 * @type {*}
                 *
                 */
                value = GetValue(binding, obj);

            await eel[pySetter](value)()

            // We cancel the standard behavior of the binder so that the NotifyPropertyChanged is made through Python
            throw new CanceledAction('Cancel calling property value assignments inside js.')
        };

    for (let id of Object.values(data[binding.prop])) {
        for (let attr in id) {
            if (! id.hasOwnProperty(attr) ||
                binding.id === id[attr].info.id ||
                id[attr].info.type === bindingTypes['OWTS'] ||
                id[attr].info.type === bindingTypes['OT']) {
                continue
            }

            bind.bind(binding.attrIDL ?? binding.attr, document.getElementById(id[attr].info.id),
                id[attr].info.attrIDL ?? id[attr].info.attr, { callback: callback })
        }
    }

    data[binding.prop][binding.id][binding.attr]['bind'] = bind.data.length === 0 ?
        bind.bind(binding.attrIDL ?? binding.attr, obj,
            binding.attrIDL ?? binding.attr, { callback: callback }) : bind
}

/**
 * TODO дописать документацию функции
 *
 * @private
 * @function
 * @name SetValue
 * @param {Binding} binding - ...
 * @param {HTMLElement} obj - ...
 * @param {*} value - ...
 * @returns {void} - ...
 *
 */
const SetValue = (binding, obj, value) => {
    if (binding.attrIDL !== undefined) {
        obj[binding.attrIDL] = value
    } else {
        obj.setAttribute(binding.attr, String(value))
    }
}
// const BindingEvents = await init_bindings()

// export default { OffBinding, OnBindings }