// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

process.once('loaded', () => {
    // Load Zorro-Core API (router, states, ...)
    require('./zorro/core/js/preload');

    const { contextBridge, ipcRenderer } = require('electron');

    // Custom Apps API
    const invoke = async function (channel, ...args) {
        return await ipcRenderer.invoke(channel, ...args)
    }

    contextBridge.exposeInMainWorld('electron', {
        addListener (eventName, listener) {
            ipcRenderer.addListener(eventName, listener)
        },

        async invoke (channel, ...args) {
            return await invoke(channel, ...args)
        },
    })

    contextBridge.exposeInMainWorld("CurrentWindowAPI", {
        close: async () => {
            await invoke('CurrentWindowAPI', 'close')
        },
        isMaximized: async () => {
            return await invoke('CurrentWindowAPI', 'isMaximized')
        },
        maximize: async () => {
            await invoke('CurrentWindowAPI', 'maximize')
        },
        minimize: async () => {
            await invoke('CurrentWindowAPI', 'minimize')
        },
        unmaximize: async () => {
            await invoke('CurrentWindowAPI', 'unmaximize')
        }
    })

    contextBridge.exposeInMainWorld('error', {
        /**
         * Error provider.
         * @public
         * @function
         * @name throw
         * @param {ErrorConstructor} type
         * @param {string} msg
         * @throws {type}
         */
        throw(type, msg) {
            throw new type(msg);
        }
    });
})