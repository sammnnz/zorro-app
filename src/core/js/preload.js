const { contextBridge } = require('electron');

(function (contextBridge) {
    document.addEventListener('readystatechange', () => {
         const { router } = require('./router');

         contextBridge.exposeInMainWorld('router', {
            _getShadowTemplates: router._getShadowTemplates, // TODO: Debug
            _onErrorCallback: router._onErrorCallback,
            getElementInTemplates: router.getElementInTemplates,
            init: router.init,
            goTo: router.goTo,
            route: router.route,
        });
        console.log("Router exposed in Main World!");
        window.addEventListener('popstate', (e) => {
            const url = new URL(window.location.href).pathname;

            router.route(url);
        })
        if (document.readyState === 'complete') {
            console.warn("Warning: Router was load after DOMContentLoaded event.");
        }
    }, {once: true})

    window.addEventListener('load', () => {
        const { states } = require('./states');

        states.loadState();
    }, {once: true})
})(contextBridge)