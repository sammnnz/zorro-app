import { bindings, UpdateBindings } from "./bindings.js";

const NotifyPropertyChanged = function (propertyName) {
    try {
        for (let id in bindings[propertyName]) {
            if (! bindings[propertyName].hasOwnProperty(id)) {
                continue
            }
            for (let attr in bindings[propertyName][id]) {
                if (! bindings[propertyName][id].hasOwnProperty(attr)) {
                    continue
                }

                document.dispatchEvent(bindings[propertyName][id][attr].events.notify)
            }
        }
    } catch (e) {
        console.warn(`Warning: Missing binding with ${propertyName} property.`)
    }
}

await UpdateBindings(); // In first load
window.addEventListener('routesuccess', async () => {
    await UpdateBindings();
})

eel.expose(NotifyPropertyChanged, 'NotifyPropertyChanged')
