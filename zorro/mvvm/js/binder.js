/**
 * Binder.js
 */

// Type definitions
/**
 * BinderData type
 * @typedef {Object.<string, Object.<string, Set>>} BinderData
 */

/**
 * BinderElement type
 * @typedef {HTMLElement} BinderElement
 */

// Exports
/**
 * @class Binder
 * @property {BinderData} data
 * @property {BinderElement} instance
 */
export class Binder {
    /**
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
     * @private
     * @method
     * @name modifiedDescriptor
     * @param {BinderElement} el
     * @param {string} propertyName
     * @param {Function} callback
     * @returns {boolean}
     *
     */
    #modifiedDescriptor = (el, propertyName, callback) => {
        "use strict";

        let
            /**
             * @type {BinderElement}
             */
            parent;

        parent = this.instance
        while (parent) {
            if (parent.hasOwnProperty(propertyName)) break;

            parent = Object.getPrototypeOf(parent);
        }

        // Case when property don't found.
        if (!parent) return false;

        const
            /**
             * @type {PropertyDescriptor | undefined}
             */
            descriptor = Object.getOwnPropertyDescriptor(parent, propertyName),

            /**
             * @type {PropertyDescriptor | Object | undefined}
             */
            newDescriptor = {},

            /**
             * @type {Function | undefined}
             */
            oldGetter = descriptor.get,

            /**
             * @type {Function | undefined}
             */
            oldSetter = descriptor.set;

        for (let list of Object.entries(descriptor))
            if (list[0] !== 'get' && list[0] !== 'set') newDescriptor[list[0]] = list[1];

        newDescriptor['get'] = oldGetter instanceof Function ?  () => {
                return oldGetter.call(el);
        } : oldGetter
        newDescriptor['set'] = oldSetter instanceof Function ? (val) => {
            if (el[propertyName] !== val) {
                oldSetter.call(el, val);
                this.#updateBoundProperty(propertyName, val, callback);
            }
        } : oldSetter
        newDescriptor['configurable'] = true;
        Object.defineProperty(this.instance, propertyName, newDescriptor)

        return true
    }

    /**
     * @private
     * @method
     * @name updateBoundProperties
     * @param {string} propertyName
     * @param {*} value
     * @param {Function} callback
     * @returns {void}
     */
     #updateBoundProperty = (propertyName, value, callback) => {
         "use strict";

         this.oldValue[propertyName] = value
         callback?.()?.then(() => {
            for (let key of Object.keys(this.data[propertyName])) {
                let
                   /**
                    * @type {Set}
                    */
                    p = this.data[propertyName][key];

                for (let o of p) {
                        if (key in o && o[key] !== value) o[key] = value;
                }
            }
        })?.catch((e) => {
            if (e instanceof CanceledAction)
                console.log(e);
            else
                throw e;
        })
     }

    /**
     * Create a binding to a property of the target object.
     * @public
     * @method
     * @name bind
     * @param {string} ownPropertyName
     * @param {BinderElement} el
     * @param {string} propertyName
     * @param {Object} options
     * @returns {Binder}
     */
    bind = (ownPropertyName, el, propertyName, options) => {
        "use strict";

        let
            /**
             * @type {Object}
             */
            defaults = {
                callback: undefined
            },
            /**
             * @type {Object}
             */
            observerOptions;

        const
            /**
             * @type {[string, boolean]}
             */
            [attr, isStandartAttr] = CheckAttributeName(this.instance, ownPropertyName),

            /**
             * @type {MutationObserver}
             */
            mutation = new MutationObserver(async (mutationsList) => {
                for (let mutation_ of mutationsList) {
                    if (mutation_.type === 'attributes') {
                        if (mutation_.attributeName === attr) {
                            const
                                /**
                                 * @type {string}
                                 */
                                attr_ = this.instance.getAttribute(attr),

                                /**
                                 * @type {*}
                                 */
                                value = this.instance[ownPropertyName] ?
                                    this.instance[ownPropertyName] : attr_;

                            if (value === attr_ && value !== this.oldValue[ownPropertyName]) {
                                this.#updateBoundProperty(ownPropertyName, value, defaults.callback)
                            // Case when attribute mutation does not affect property change
                            } else if (value !== attr_ && isStandartAttr) {
                                mutation.disconnect();
                            }

                            break;
                        }
                    } else if (mutation_.type === 'characterData') {
                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.#updateBoundProperty(ownPropertyName, this.instance[ownPropertyName], defaults.callback);
                        } else {
                            // TODO: impl turn off mutation
                            // mutation.disconnect()
                            // observerOptions['characterData'] = false
                            // mutation.observe(this.instance, observerOptions)
                        }

                        break;
                    } else if (mutation_.type === 'childList') {
                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.#updateBoundProperty(ownPropertyName, this.instance[ownPropertyName], defaults.callback);
                        } else {
                            // TODO: impl turn off mutation
                            // mutation.disconnect()
                            // observerOptions['childList'] = false
                            // mutation.observe(this.instance, observerOptions)
                        }

                        break;
                    }
                }
            });

        defaults = Object.assign({}, defaults, options);

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
        this.data[ownPropertyName][propertyName].add(el)

        // Save mutation and listener of input event for unbind
        this.secureData[ownPropertyName] = this.secureData[ownPropertyName] ?
            this.secureData[ownPropertyName] : {}
        this.secureData[ownPropertyName][propertyName] = this.secureData[ownPropertyName][propertyName] ?
            this.secureData[ownPropertyName][propertyName] : new Map()
        this.secureData[ownPropertyName][propertyName].set(el, {mutation: mutation})

        // Case when property exist
        if (this.#modifiedDescriptor(this.instance, ownPropertyName, defaults.callback)) {
            const
                /**
                 * @type {Object.<string, null>}
                 */
                inputTags = {
                    'input': null,
                    'select': null,
                    'textarea': null
                };

            if (this.instance.isContentEditable || this.instance.nodeName.toLowerCase() in inputTags) { // for Input event
                const
                    /**
                     * @function
                     * @name onInput
                     * @param {event} ev
                     * @returns {void}
                     *
                     */
                    onInput = (ev) => {
                        this.#updateBoundProperty(ownPropertyName, this.instance[ownPropertyName], defaults.callback)
                    },

                    /**
                     * @function
                     * @name onceInput
                     * @param {event} ev
                     * @returns {void}
                     *
                     */
                    // We do this to determine if the property changes during the input event
                    onceInput = (ev) => {
                        this.instance.removeEventListener('input', onceInput)

                        delete this.secureData[ownPropertyName][propertyName].get(el)['input']

                        if (this.instance[ownPropertyName] !== this.oldValue[ownPropertyName]) {
                            this.instance.addEventListener('input', onInput)
                            this.secureData[ownPropertyName][propertyName].get(el)['input'] = onInput
                            onInput(ev)
                        }
                    };

                this.instance.addEventListener('input', onceInput)

                this.secureData[ownPropertyName][propertyName].get(el)['input'] = onceInput
            }

            // Case when property exist and attribute is custom
            if (! isStandartAttr) {
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
     * TODO: impl
     * @public
     * @method
     * @name unbind
     * @param {string} ownPropertyName
     * @param {BinderElement} el
     * @param {string} propertyName
     * @returns {Binder}
     */
    unbind = (ownPropertyName, el, propertyName) => {
        "use strict";

        const
            /**
             * @type {Map}
             */
            _el = this.secureData[ownPropertyName][propertyName].get(el);

        try {
            if (_el.hasOwnProperty('mutation'))
                _el['mutation'].disconnect();

            delete _el['mutation']
        } catch (ex) {}

        try {
            if (_el.hasOwnProperty('input'))
                this.instance.removeEventListener('input', _el['input']);

            delete _el['input']
        } catch (ex) {}

        this.secureData[ownPropertyName][propertyName].delete(el)
        this.data[ownPropertyName][propertyName].delete(el)

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

/**
 * Signal for cancel calling property value assignments inside js.
 * @class CanceledAction
 * @extends {Error}
 * @property {string} name
 * @property {string} message
 * @property {string | undefined} stack
 */
export class CanceledAction extends Error {
    /**
     * @constructor
     * @param {string} message - cancel message
     */
    constructor(message) {
        super(message)
        this.name = 'CanceledAction'
    }
}

/**
 * TODO: docs, impl
 * @private
 * @function
 * @name CheckAttributeIDLName
 * @param {BinderElement | null} el
 * @param {string} name
 * @returns {string | undefined}
 */
export const CheckAttributeIDLName = (el, name) => {
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

    currentObj = el

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
 * Check HTML attribute name and return list with name and check result (bool)
 * @function
 * @name CheckAttributeName
 * @param {BinderElement} el
 * @param {string} name
 * @returns {[string, boolean]}
 */
export const CheckAttributeName = (el, name) => {
    "use strict";

    let
        /**
         * @type {RegExpMatchArray | null}
         */
        matches,

        /**
         * @type {RegExp}
         */
        re;

    name = name.toLowerCase();
    re = new RegExp("(" + TAG_ATTRIBUTES.CUSTOM + ")", "i");
    matches = name.match(re);
    if (matches instanceof Array) return [matches[0], true];

    for (let attr of TAG_ATTRIBUTES.GLOBAL) {
        re = new RegExp("(" + attr + ")", "i");
        matches = name.match(re);
        if (matches instanceof Array) return [attr, true];
    }

    const tagName = el.nodeName.toLowerCase();
    for (let attr of TAG_ATTRIBUTES.OTHER[tagName]) {
        re = new RegExp("(" + attr + ")", "i");
        matches = name.match(re);
        if (matches instanceof Array) return [attr, true];
    }

    return [name, false]
}

// Privates

// Other objects
/**
 * Supported HTML attributes for bindings
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
    }
}
