const { contextBridge } = require('electron');

(function (contextBridge) {
    document.addEventListener('readystatechange', () => {
         if (document.readyState === 'complete') {
             throw new Error("Error: Router not be load.")
         }

         const { router } = require('./router');

         contextBridge.exposeInMainWorld('router', {
            _getShadowTemplates: router._getShadowTemplates, // Debug
            _onErrorCallback: router._onErrorCallback,
            getElementInTemplates: router.getElementInTemplates,
            init: router.init,
            goTo: router.goTo,
            route: router.route,
        });
        console.log("Router exposed in mainWorld!");
        router.init(true);
    }, {once: true})

    window.addEventListener('load', () => {
        const { states } = require('./states');

        states.loadState();
    }, {once: true})
})(contextBridge)