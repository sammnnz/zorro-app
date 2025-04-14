/*
 * Router.js (for Node.js)
 */

const $ = require('jquery');

const _addShadowTemplate = (value) => {
    if (value instanceof ShadowRoot) {
        _shadowTemplates.add(value);
    }
}

const _getShadowTemplates = () => {
    return _shadowTemplates;
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
    console.log("Shadow-root add to '_shadowTemplates':", node.parentNode)
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
        await _loadBaseScripts(host);
        shadowRoot = host.querySelector('.base-container')?.shadowRoot;
        _addShadowTemplate(shadowRoot);

        return 0;
    }

    for (let t of _shadowTemplates) {
        host = t.querySelector(selector);
        if (host) return _routeCallback(selector, template, t)
    }

    return -1;
}

const _shadowTemplates = new Set();

const getElementInTemplates = (selector) => {
    let obj = document.querySelector(selector);

    if (obj) return obj;

    for (let t of _shadowTemplates) {
        obj = t.querySelector(selector);
        if (obj) return obj;
    }

    console.warn(`Warning: Element not found: 
    selector ${selector}`)
    return undefined;
}

const goTo = (path, callback = _routeCallback) => {
    window.history.pushState({path}, path, path); // TODO: change
    route(path, callback);
}

const init = (popstate = false) => { // TODO: change
    popstate ? window.addEventListener('popstate', (e) => {
        const url = new URL(window.location.href).pathname;

        console.log(`Popstate callback with url: ${url}`);
        route(url);
    }) : undefined

    $("[href!='/']").each((_, el) => {
        el.tagName === 'A' ? el.addEventListener('click', (ev) => {
            const callback = () => {
                ev.preventDefault()
                const {pathname: path} = new URL(ev.target.href);

                goTo(path)
            }
            el.getAttribute('data-is-reload-page') !== 'true' ? callback() : undefined
        }) : undefined
    })

}

const route = (path, callback = _routeCallback) => {
    $.ajax({
        url: path,
        method: 'POST',
        data: {_ajax: 'GET'},
        success: async function (data) {
            if (await callback(data?.selector, data?.body) === -1) {
                console.warn(`Warning: (Ajax) 
                Selector '${data?.selector}' or template '${data?.body}' not found.`)
            }
        },
        error: function (jqXHR, exception){
            console.error(`Error: (Ajax) 
            url: ${this.url}, 
            method: ${this.method}, 
            data: ${this.data}`)
            $(location).attr('href',window.location.href) // TODO: change
        }
    });
}

const router = {
    _getShadowTemplates: _getShadowTemplates, // Internal use
    _onErrorCallback: _onErrorCallback, // Internal use
    getElementInTemplates: getElementInTemplates,
    goTo: goTo,
    init: init,
    route: route,
}

module.exports.router = router
