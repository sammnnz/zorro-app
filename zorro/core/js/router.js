/*
 * Router.js (for Node.js)
 */

const $ = require('jquery');

const _addShadowTemplate = (value) => {
    if (! (value instanceof ShadowRoot)) return;

    _shadowTemplates.add(value);
    _init(value);
}

const _clearShadowTemplates = () => {
    for (let t of _shadowTemplates) {
        if (! t.isConnected) _shadowTemplates.delete(t);
    }
}

const _getShadowTemplates = () => {
    console.log(_shadowTemplates);
}

const _init = (context = document) => {
    $($(context).find('a')).each((_, el) => {
        if (! el.hasAttribute('data-reload-page')) return;

        try {
            if (el.getAttribute('data-reload-page') === 'true') return;
            if (el.pathname === '/' || el.pathname === '') return;

            const callback = (ev) => {
                ev.preventDefault();
                const
                    {pathname: path} = new URL(ev.target.href),
                    listener = async () => {
                        if (el.isConnected) return;

                        el.removeEventListener('click', callback);
                        console.log('Log: Success remove listener for', el, '.');
                        window.removeEventListener('routesuccess', listener);
                    };

                window.addEventListener('routesuccess', listener);
                goTo(path);
            }

            el.addEventListener('click', callback);
        } finally {
            el.removeAttribute('data-reload-page');
        }
    })
}

const _loadBaseScripts = async (host) => {
    const baseScripts = host.querySelectorAll('.base-container .base-scripts');

    for (let scripts of baseScripts) {
        let index = -1,
            shadowRoot = scripts.parentNode.shadowRoot;

        while(++index < scripts.children.length) {
            let script = scripts.children[0];

            if (! (script instanceof HTMLScriptElement)) continue;

            try {
                await _loadScript(script, () => {
                    console.log(`Load script: 
                    src: ${script?.src}`);
                });
            } catch (e) {
                console.error(`Error in load script: 
                src: ${script?.src}`);
            }
        }

        if (shadowRoot) await _loadBaseScripts(shadowRoot);
    }
}

/**
 * @private
 * @function
 * @name _loadScript
 * @param {HTMLScriptElement} script
 * @param {Function} callback
 * @returns {Promise}
 */
const _loadScript = async (script, callback) => {
    return new Promise((resolve, reject) => {
        let _script = document.createElement('script');

        for (let attr of script.attributes) {
            _script.setAttribute(attr.name, attr.value)
        }

        script.src ? _script.src = _script.src + "?" + Date.now() : undefined
        script.textContent ? _script.textContent = script.textContent : undefined
        _script.addEventListener("load",(e) => {
            if (callback) callback(e);

            resolve();
        }, {once: true})
        _script.addEventListener("error", (e) => {
            reject(e);
        }, {once: true})
        script.parentNode.appendChild(_script);
        script.remove();
    });
}

/**
 * This callback-function add shadow-root to `_shadowTemplates` object in case,
 * when we use `include` jinja2 command. Use this function only for `IMG` tag.
 * See more info in
 * https://sky.pro/wiki/html/dobavlyaem-sobytie-onload-dlya-elementa-div-v-html/
 *  @param {HTMLImageElement} node
 */
const _onErrorCallback = (node) => {
    if (! (node instanceof HTMLImageElement || node.src === "")) return;

    _addShadowTemplate(node.parentNode)
    node.remove();
}

const _routeCallback = async (selector, template, context = undefined) => {
    if (! selector || ! template) return -1;

    if(! context) context = document;

    let host = context.querySelector(selector),
        shadowRoot;

    if (host) {
        // https://dev.to/js_bits_bill/simplify-shadow-dom-with-sethtmlunsafe-1fne
        host.setHTMLUnsafe(template);
        shadowRoot = host.querySelector('.base-container')?.shadowRoot;
        _clearShadowTemplates();
        _addShadowTemplate(shadowRoot);
        await _loadBaseScripts(host);
        if (! shadowRoot) _init(document);

        return 0;
    }

    for (let t of _shadowTemplates) {
        host = t.querySelector(selector);
        if (host) return _routeCallback(selector, template, t)
    }

    return -1;
}

const _RouteSuccessEvent = new Event('routesuccess',{bubbles: true, composed: true});

const _shadowTemplates = new Set();

/**
 * @public
 * @function
 * @name getElementInTemplates
 * @param {string} selector
 * @return {HTMLElement | undefined}
 */
const getElementInTemplates = (selector) => {
    let el = document.querySelector(selector);

    if (el) return el;

    for (let t of _shadowTemplates) {
        el = t.querySelector(selector);
        if (el) return el;
    }

    console.warn(`Warning: Element not found: 
    selector ${selector}`)
    return undefined;
}

const goTo = (path) => {
    window.history.pushState({path}, path, path);
    route(path);
}

const init = () => {
    _init(document);
    for (let t of _shadowTemplates) {
        _init(t);
    }
}

const route = (path) => {
    $.ajax({
        url: path,
        method: 'POST',
        data: {_ajax: 'GET'},
        success: async function (data) {
            if (await _routeCallback(data?.selector, data?.body) === -1) {
                console.warn(`Warning: (Ajax) 
                Selector '${data?.selector}' or template '${data?.body}' not found.`)
            }

            window.dispatchEvent(_RouteSuccessEvent);
        },
        error: function (jqXHR, exception){
            console.error(`Error: (Ajax) 
            url: ${this.url}, 
            method: ${this.method}, 
            data: ${this.data}`)
            $(location).attr('href',window.location.href)
        }
    });
}

const router = {
    _getShadowTemplates: _getShadowTemplates, // Debug
    _onErrorCallback: _onErrorCallback, // Internal use
    getElementInTemplates: getElementInTemplates,
    goTo: goTo,
    init: init,
    route: route
}

module.exports.router = router
