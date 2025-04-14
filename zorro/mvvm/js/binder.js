/**
 * Binder.js
 */


// Some type definitions
/**
 * BinderData type
 * @typedef {Object.<string, Object.<string, Set>>} BinderData
 */

/**
 * BinderElement type
 * @typedef {HTMLElement} BinderElement
 */

/**
 * TagAttributes type
 * @typedef {Object} TagAttributes
 * @property {string} CUSTOM
 * @property {[..., string]} GLOBAL
 * @property {Object.<string, [..., string]>} OTHER
 * @property {Object.<string, string>} SPECIAL
 */


// Class ElementBinder
/**
 * TODO дописать документацию ElementBinder
 * @class ElementBinder
 * @property {BinderData} data
 * @property {BinderElement} instance
 */
class ElementBinder {
    /**
     * TODO дописать документацию
     * @constructor
     * @param {BinderElement} obj
     * @returns {Object}
     */
    constructor(obj) {
        Object.defineProperty(this, 'data', {
            value: {}
        })
        Object.defineProperty(this.data, 'length', {
             get: () => {
                return Object.keys(this.data).length
            },
            set: () => {}
        })
        Object.defineProperty(this, 'instance', {
            value: obj
        })
        Object.defineProperty(this, 'oldValue', {
            value: {}
        })
        Object.defineProperty(this, 'secureData', {
            value: {}
        })

        return Object.create(this, {
            bind: {
                value: this.bind
            },
            data: {
                value: this.data
            },
            instance: {
                value: this.instance
            },
            unbind: {
                value: this.unbind
            }
        })
    }

    /**
     * TODO дописать документацию
     *
     * @private
     * @method
     * @name modifiedDescriptor
     * @param {BinderElement} obj - ...
     * @param {string} propertyName - ...
     * @param {Function} callback - ...
     * @returns {boolean} - ...
     *
     */
    #modifiedDescriptor = (obj, propertyName, callback) => {
        "use strict";

        let
            /**
             * TODO дописать документацию для переменной
             * @type {BinderElement}
             *
             */
            parentObj;

        parentObj = this.instance
        while (parentObj !== null) {
            if (parentObj.hasOwnProperty(propertyName)) {
                break
            }

            parentObj = Object.getPrototypeOf(parentObj)
        }

        if (parentObj === null) {
            return false // Case when property don't found.
        }

        const
            /**
             * TODO дописать документацию для переменной
             * @type {PropertyDescriptor | undefined}
             *
             */
            descriptor = Object.getOwnPropertyDescriptor(parentObj, propertyName),

            /**
             * TODO дописать документацию для переменной
             * @type {PropertyDescriptor | Object | undefined}
             *
             */
            newDescriptor = {},

            /**
             * TODO дописать документацию для переменной
             * @type {function | undefined}
             *
             */
            oldGetter = descriptor.get,

            /**
             * TODO дописать документацию для переменной
             * @type {function | undefined}
             *
             */
            oldSetter = descriptor.set;

        for (let list of Object.entries(descriptor))
            if (list[0] !== 'get' && list[0] !== 'set') {
                newDescriptor[list[0]] = list[1]
            }

        newDescriptor['get'] = oldGetter ?  () => {
                return oldGetter.call(obj)
        } : oldGetter
        newDescriptor['set'] = oldSetter ? (val) => {
            if (obj[propertyName] !== val) {
                oldSetter.call(obj, val)
                this.#updateBoundProperties(propertyName, val, callback)
            }
        } : oldSetter
        newDescriptor['configurable'] = true

        Object.defineProperty(this.instance, propertyName, newDescriptor)

        return true
    }

    /**
     * TODO дописать документацию
     *
     * @private
     * @method
     * @name updateBoundProperties
     * @param {string} propertyName - ...
     * @param {*} value - ...
     * @param {Function} callback - ...
     * @returns {void}
     *
     */
     #updateBoundProperties = (propertyName, value, callback) => {
         "use strict";

         this.oldValue[propertyName] = value

         callback?.()?.then(() => {
            for (let k of Object.keys(this.data[propertyName])) {
                let
                   /**
                    * TODO дописать документацию переменной
                    * @type {Set}
                    *
                    */
                    p = this.data[propertyName][k];

                for (let o of p) {
                        if (k in o && o[k] !== value) {
                            o[k] = value
                        }
                }
            }
        })?.catch((er) => {
            if (er instanceof CanceledAction) {
                console.log(er)
            } else {
                throw er
            }
        })
     }

    /**
     * TODO дописать документацию
     * Create a binding to a property of the target object.
     *
     * @public
     * @method
     * @name bind
     * @param {string} ownPropertyName - ...
     * @param {BinderElement} obj - ...
     * @param {string} propertyName - ...
     * @param {Object} options
     * @returns {ElementBinder} - ...
     * @example
     * ...
     *
     */
    bind = (ownPropertyName, obj, propertyName, options) => {
        "use strict";

        let
            /**
             * TODO дописать документацию для переменной
             * @type {Object}
             *
             */
            defaults = {
                callback: undefined
            },

            /**
             * TODO дописать документацию для переменной
             * @type {Object}
             *
             */
            observerOptions;

        const
            /**
             * TODO дописать документацию для переменной
             * @type {[string, boolean]}
             *
             */
            [attr, is_standartAttr] = CheckAttributeName(this.instance, ownPropertyName),

            /**
             * TODO дописать документацию для переменной
             * @type {MutationObserver}
             *
             */
            mutation = new MutationObserver(async (mutationsList) => {
                for (let mutation_ of mutationsList) {
                    if (mutation_.type === 'attributes') {
                        if (mutation_.attributeName === attr) {
                            const
                                /**
                                 * TODO дописать документацию для переменной
                                 * @type {string}
                                 *
                                 */
                                attr_ = this.instance.getAttribute(attr),

                                /**
                                 * TODO дописать документацию для переменной
                                 * @type {*}
                                 *
                                 */
                                value = this.instance[ownPropertyName] ? this.instance[ownPropertyName] : attr_;

                            if (value === attr_ && value !== this.oldValue[ownPropertyName]) {
                                this.#updateBoundProperties(ownPropertyName, value, defaults.callback)
                            } else if (value !== attr_ && is_standartAttr) {  // Case when attribute mutation does not affect property change
                                mutation.disconnect()
                            }

                            break
                        }
                    } else if (mutation_.type === 'characterData') {
                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.#updateBoundProperties(ownPropertyName, this.instance[ownPropertyName], defaults.callback)
                        } else {
                            // TODO доделать имплементацию отключения мутации
                            // mutation.disconnect()
                            // observerOptions['characterData'] = false
                            // mutation.observe(this.instance, observerOptions)
                        }

                        break
                    } else if (mutation_.type === 'childList') {
                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.#updateBoundProperties(ownPropertyName, this.instance[ownPropertyName], defaults.callback)
                        } else {
                            // TODO доделать имплементацию отключения мутации
                            // mutation.disconnect()
                            // observerOptions['childList'] = false
                            // mutation.observe(this.instance, observerOptions)
                        }

                        break
                    }
                }
            });

        defaults = Object.assign({}, defaults, options)

        // Case when property exist and attribute is standart || Case when property NOT exist
        observerOptions = {
            attributes: true,
            attributeFilter: [attr]
        }

        // Create a data for the binder instance
        this.data[ownPropertyName] = this.data[ownPropertyName] ?
            this.data[ownPropertyName] : {}
        this.data[ownPropertyName][propertyName] = this.data[ownPropertyName][propertyName] ?
            this.data[ownPropertyName][propertyName] : new Set()
        this.data[ownPropertyName][propertyName].add(obj)

        // Save mutation and listener of input event for unbind
        this.secureData[ownPropertyName] = this.secureData[ownPropertyName] ?
            this.secureData[ownPropertyName] : {}
        this.secureData[ownPropertyName][propertyName] = this.secureData[ownPropertyName][propertyName] ?
            this.secureData[ownPropertyName][propertyName] : new Map()
        this.secureData[ownPropertyName][propertyName].set(obj, {mutation: mutation})

        // Case when property exist
        if (this.#modifiedDescriptor(this.instance, ownPropertyName, defaults.callback)) {
            const
                /**
                 * TODO дописать документацию для переменной
                 * @type {Object.<string, null>}
                 *
                 */
                inputTags = {
                    'input': null,
                    'select': null,
                    'textarea': null
                };

            if (this.instance.isContentEditable || this.instance.nodeName.toLowerCase() in inputTags) { // for Input event
                const
                    /**
                     * TODO дописать документацию для функции
                     * @function
                     * @name onInput
                     * @param {event} ev
                     * @returns {void}
                     *
                     */
                    onInput = (ev) => {
                        this.#updateBoundProperties(ownPropertyName, this.instance[ownPropertyName], defaults.callback)
                    },

                    /**
                     * TODO дописать документацию для функции
                     * @function
                     * @name onceInput
                     * @param {event} ev
                     * @returns {void}
                     *
                     */
                    // We do this to determine if the property changes during the input event
                    onceInput = (ev) => {
                        this.instance.removeEventListener('input', onceInput)

                        delete this.secureData[ownPropertyName][propertyName].get(obj)['input']

                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.instance.addEventListener('input', onInput)
                            this.secureData[ownPropertyName][propertyName].get(obj)['input'] = onInput
                            onInput(ev)
                        }
                    };

                this.instance.addEventListener('input', onceInput)

                this.secureData[ownPropertyName][propertyName].get(obj)['input'] = onceInput
            }

            // Case when property exist and attribute is custom
            if (! is_standartAttr) {
                observerOptions = {
                    attributes: true,
                    attributeFilter: [attr],
                    characterData: true,
                    childList: true,
                    subtree: true
                }
            }
        }

        mutation.observe(this.instance, observerOptions)

        return this
    }

    /**
     * TODO дописать документацию
     *
     * @public
     * @method
     * @name unbind
     * @param {string} ownPropertyName - ...
     * @param {BinderElement} obj - ...
     * @param {string} propertyName - ...
     * @returns {ElementBinder} - ...
     * @example
     * ...
     *
     */
    unbind = (ownPropertyName, obj, propertyName) => {
        "use strict";

        // TODO доделать имплеменатцию unbind
        const
            /**
             * TODO дописать документацию для переменной
             * @type {Map}
             *
             */
            obj_ = this.secureData[ownPropertyName][propertyName].get(obj);

        try {
            if (obj_.hasOwnProperty('mutation')) {
                obj_['mutation'].disconnect()
            }

            delete obj_['mutation']
        } catch (ex) {}

        try {
            if (obj_.hasOwnProperty('input')) {
                this.instance.removeEventListener('input', obj_['input'])
            }

            delete obj_['input']
        } catch (ex) {}

        this.secureData[ownPropertyName][propertyName].delete(obj)
        this.data[ownPropertyName][propertyName].delete(obj)

        if (! Object.keys(this.secureData[ownPropertyName][propertyName]).length) {
            this.data[ownPropertyName][propertyName] = undefined
            this.secureData[ownPropertyName][propertyName] = undefined

            delete this.data[ownPropertyName]
            delete this.secureData[ownPropertyName]

            this.oldValue[ownPropertyName] = undefined
        }

        // We must delete custom property descriptor from instance object
        delete this.instance[ownPropertyName]
    }
}


// Error classes
/**
 * TODO дописать документацию DOMBinder
 * @class CanceledAction
 * @extends {Error}
 * @property {string} name
 * @property {string} message
 * @property {string | undefined} stack
 *
 */
class CanceledAction extends Error {
    /**
     * TODO дописать документацию
     * @constructor
     * @param {string} message - cancel message
     *
     */
    constructor(message) {
        super(message)
        this.name = 'CanceledAction'
    }
}


// Some functions
/**
 * TODO дописать документацию
 * @function
 * @name CheckAttributeName
 * @param {BinderElement} obj - ...
 * @param {string} name - ...
 * @returns {[string, boolean]}
 *
 */
const CheckAttributeName = (obj, name) => {
    "use strict";

    // TODO доделать имплементацию CheckAttributeName
    let
        /**
         * TODO дописать документацию для переменной
         * @type {RegExpMatchArray | null}
         *
         */
        matches,

        /**
         * TODO дописать документацию для переменной
         * @type {RegExp}
         *
         */
        re;

    name = name.toLowerCase()

    re = new RegExp("(" + TAG_ATTRIBUTES.CUSTOM + ")", "i")
    matches = name.match(re)
    if (matches !== null) {
        return [matches[0], true]
    }

    for (let attr of TAG_ATTRIBUTES.GLOBAL) {
        re = new RegExp("(" + attr + ")", "i")
        matches = name.match(re)

        if (matches !== null) {
            return [attr, true]
        }
    }

    const
        /**
         * TODO дописать документацию для переменной
         * @type {string}
         *
         */
        tagName = obj.nodeName.toLowerCase();

    for (let attr of TAG_ATTRIBUTES.OTHER[tagName]) {
        re = new RegExp("(" + attr + ")", "i")
        matches = name.match(re)

        if (matches !== null) {
            return [attr, true]
        }
    }

    return [name, false]
}

// Other objects
/**
 * TODO дописать доументацию
 * @type {TagAttributes}
 *
 */
const TAG_ATTRIBUTES = {
    CUSTOM: 'data-.*',
    GLOBAL: ['accesskey', 'autocapitalize', 'autofocus', 'class', 'contenteditable', 'contextmenu', 'dir', 'draggable', 'enterkeyhint', 'exportparts', 'hidden', 'id', 'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype', 'lang', 'nonce', 'part', 'slot', 'spellcheck', 'style', 'tabindex', 'title', 'translate', 'nx-ms-acceleratorkey', 'nx-ms-format-detection'],
    OTHER: {
        a: ['download', 'href', 'hreflang', 'ping', 'referrerpolicy', 'rel', 'target', 'type', 'charset', 'coords', 'name', 'rev', 'shape'],
        abbr: [],
        acronym: [],
        address: [],
        applet: ['align', 'alt', 'archive', 'code', 'codebase', 'datafld', 'datasrc', 'height', 'hspace', 'mayscript', 'name', 'object', 'src', 'vspace', 'width'],
        area: ['alt', 'coords', 'download', 'href', 'hreflang', 'ping', 'referrerpolicy', 'rel', 'shape', 'target', 'name', 'nohref', 'type'],
        article: [],
        aside: [],
        audio: ['autoplay', 'controls', 'crossorigin', 'disableremoteplayback', 'loop', 'muted', 'preload', 'src'],
        b: [],
        base: ['href', 'target'],
        bdi: [],
        bdo: [],
        bgsound: ['balance', 'loop', 'src', 'volume'],
        big: [],
        blink: [],
        blockquote: ['cite'],
        body: ['alink', 'background', 'bgcolor', 'bottommargin', 'leftmargin', 'link', 'onafterprint', 'onbeforeprint', 'onbeforeunload', 'onblur', 'onerror', 'onfocus', 'onhashchange', 'onlanguagechange', 'onload', 'onmessage', 'onoffline', 'ononline', 'onpopstate', 'onredo', 'onresize', 'onstorage', 'onundo', 'onunload', 'rightmargin', 'text', 'topmargin', 'vlink'],
        br: ['clear'],
        button: ['autofocus', 'autocomplete', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'name', 'type', 'value'],
        canvas: ['height', 'moz-opaque', 'width'],
        caption: ['align'],
        center: [],
        cite: [],
        code: [],
        col: ['span', 'align', 'bgcolor', 'char', 'charoff', 'valign', 'width'],
        colgroup: ['span', 'align', 'bgcolor', 'char', 'charoff', 'valign'],
        content: [],
        data: ['value'],
        datalist: [],
        dd: ['nowrap'],
        del: ['cite', 'datetime'],
        details: ['open'],
        dfn: [],
        dialog: ['open'],
        dir: ['compact'],
        div: [],
        dl: [],
        dt: [],
        em: [],
        embed: ['height', 'src', 'type', 'width'],
        fieldset: ['disabled', 'form', 'name'],
        figcaption: [],
        figure: [],
        font: ['color', 'face', 'size'],
        footer: [],
        form: ['accept', 'accept-charset', 'autocapitalize', 'autocomplete', 'name', 'rel', 'action', 'enctype', 'method', 'novalidate', 'target'],
        frame: ['src', 'name', 'noresize', 'scrolling', 'marginheight', 'marginwidth', 'frameborder'],
        frameset: ['cols', 'rows'],
        head: ['profile'],
        header: [],
        h1: [],
        hgroup: [],
        hr: ['align', 'color', 'noshade', 'size', 'width'],
        html: ['manifest', 'version', 'xmlns'],
        i: [],
        iframe: ['allow', 'allowfullscreen', 'allowpaymentrequest', 'csp', 'fetchpriority', 'height', 'loading', 'name', 'referrerpolicy', 'sandbox', 'src', 'srcdoc', 'width', 'align', 'frameborder', 'longdesc', 'marginheight', 'marginwidth', 'scrolling'],
        image: [],
        img: ['alt', 'crossorigin', 'decoding', 'fetchpriority', 'height', 'ismap', 'loading', 'referrerpolicy', 'sizes', 'src', 'srcset', 'width', 'usemap', 'align', 'border', 'hspace', 'longdesc', 'name', 'vspace'],
        input: ['alt', 'autocomplete', 'accept', 'autocorrect', 'checked', 'capture', 'dirname', 'disabled', 'formenctype', 'formnovalidate', 'formmethod', 'form', 'formaction', 'formtarget', 'height', 'incremental', 'list', 'maxlength', 'multiple', 'min', 'max', 'minlength', 'mozactionhint', 'name', 'orient', 'placeholder', 'pattern', 'readonly', 'results', 'required', 'size', 'step', 'src', 'type', 'value', 'webkitdirectory', 'width'],
        ins: ['cite', 'datetime'],
        kbd: [],
        keygen: ['autofocus', 'challenge', 'disabled', 'form', 'keytype', 'name'],
        label: ['for'],
        legend: [],
        li: ['value', 'type'],
        link: ['as', 'crossorigin', 'disabled', 'fetchpriority', 'href', 'hreflang', 'imagesizes', 'imagesrcset', 'integrity', 'media', 'prefetch', 'referrerpolicy', 'rel', 'sizes', 'title', 'type', 'methods', 'target', 'charset', 'rev'],
        main: [],
        map: ['name'],
        mark: [],
        marquee: ['behavior', 'bgcolor', 'direction', 'height', 'hspace', 'loop', 'scrollamount', 'scrolldelay', 'truespeed', 'vspace', 'width', 'onbounce', 'onfinish', 'onstart'],
        menu: [],
        menuitem: ['checked', 'command', 'default', 'disabled', 'icon', 'label', 'radiogroup', 'type'],
        meta: ['charset', 'content', 'http-equiv', 'name'],
        meter: ['value', 'min', 'max', 'low', 'high', 'optimum'],
        nav: [],
        nobr: [],
        noembed: [],
        noframes: [],
        noscript: [],
        object: ['archive', 'border', 'classid', 'codebase', 'codetype', 'data', 'declare', 'form', 'height', 'name', 'standby', 'type', 'usemap', 'width'],
        ol: ['reversed', 'start', 'type'],
        optgroup: ['disabled', 'label'],
        option: ['disabled', 'label', 'selected', 'value'],
        output: ['for', 'form', 'name'],
        p: [],
        param: ['name', 'value', 'type', 'valuetype'],
        picture: [],
        plaintext: [],
        portal: ['referrerpolicy', 'src'],
        pre: ['cols', 'width', 'wrap'],
        progress: ['max', 'value'],
        q: ['cite'],
        rb: [],
        rp: [],
        rt: [],
        rtc: [],
        ruby: [],
        s: [],
        samp: [],
        script: ['async', 'crossorigin', 'defer', 'fetchpriority', 'integrity', 'nomodule', 'nonce', 'referrerpolicy', 'src', 'type', 'charset', 'language'],
        section: [],
        select: ['autocomplete', 'autofocus', 'disabled', 'form', 'multiple', 'name', 'required', 'size'],
        shadow: [],
        slot: ['name'],
        small: [],
        source: ['type', 'src', 'srcset', 'sizes', 'media', 'height', 'width'],
        spacer: ['type', 'size', 'width', 'height', 'align'],
        span: [],
        strike: [],
        strong: [],
        style: ['media', 'nonce', 'title', 'type'],
        sub: [],
        summary: [],
        sup: [],
        table: ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'frame', 'rules', 'summary', 'width'],
        tbody: ['align', 'bgcolor', 'char', 'charoff', 'valign'],
        td: ['colspan', 'headers', 'rowspan', 'abbr', 'align', 'axis', 'bgcolor', 'char', 'charoff', 'height', 'scope', 'valign', 'width'],
        template: [],
        textarea: ['autocomplete', 'autocorrect', 'autofocus', 'cols', 'disabled', 'form', 'maxlength', 'minlength', 'name', 'placeholder', 'readonly', 'required', 'rows', 'spellcheck', 'wrap'],
        tfoot: ['align', 'bgcolor', 'char', 'charoff', 'valign'],
        th: ['abbr', 'colspan', 'headers', 'rowspan', 'scope', 'align', 'axis', 'bgcolor', 'char', 'charoff', 'height', 'valign', 'width'],
        thead: ['align', 'bgcolor', 'char', 'charoff', 'valign'],
        time: ['datetime'],
        title: [],
        tr: ['align', 'bgcolor', 'char', 'charoff', 'valign'],
        track: ['default', 'kind', 'label', 'src', 'srclang'],
        tt: [],
        u: [],
        ul: ['compact', 'type'],
        var: [],
        video: ['autoplay', 'autopictureinpicture', 'controls', 'controlslist', 'crossorigin', 'disablepictureinpicture', 'disableremoteplayback', 'height', 'loop', 'muted', 'playsinline', 'poster', 'preload', 'src', 'width'],
        wbr: [],
        xmp: [],
    },
    SPECIAL: {
        datacommand: 'data-command'
    }
}

// export default {CheckAttributeName, TAG_ATTRIBUTES}